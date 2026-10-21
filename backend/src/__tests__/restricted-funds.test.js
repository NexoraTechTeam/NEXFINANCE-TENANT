'use strict';

const request = require('supertest');
const { bootstrap, activate } = require('./helpers/setup');
const { provisionTenant } = require('../services/tenants');

const HOST = 'funds.localhost';
const M = 1_000_000;
let app;
let knex;
let token;

beforeAll(async () => {
  ({ app, knex } = await bootstrap({ demo: false }));
  await provisionTenant(knex, {
    slug: 'funds', name: 'Funds School', domains: [HOST],
    admin: { username: 'admin-funds', name: 'Admin', password: 'Funds-Pass-123' },
  });
  token = await activate(app, HOST, 'admin-funds', 'Funds-Pass-123', 'Funds-Pass-123-Tetap');
});

afterAll(async () => {
  await knex.destroy();
});

const api = new Proxy({}, {
  get: (_, method) => (path) => request(app)[method](path).set('Host', HOST).set('Authorization', `Bearer ${token}`),
});
const YEAR = new Date().getFullYear();
const D = (md) => `${YEAR}-${md}`;

describe('restricted funds (ISAK 335 net assets with restrictions)', () => {
  it('lists both restricted fund types at zero', async () => {
    const res = await api.get('/api/v1/accounting/restricted-funds');
    expect(res.statusCode).toBe(200);
    expect(res.body.funds.map((f) => [f.key, f.balance])).toEqual([['temporer', 0], ['permanen', 0]]);
  });

  it('records a restricted receipt into cash/bank and the restricted revenue account', async () => {
    const res = await api.post('/api/v1/accounting/restricted-funds/receipts')
      .send({ date: D('03-01'), fund: 'temporer', amount: 10 * M, method: 'transfer', description: 'Donasi renovasi musala' });
    expect(res.statusCode).toBe(201);
    expect(res.body.journal).toMatchObject({ debit: { account: '1100' }, credit: { account: '4100' }, source: { type: 'restricted_receipt' } });
    await api.post('/api/v1/accounting/restricted-funds/receipts')
      .send({ date: D('03-02'), fund: 'permanen', amount: 50 * M, method: 'tunai', description: 'Wakaf tunai' }).expect(201);
  });

  it('releases a temporary restriction once its purpose is met, never more than the balance', async () => {
    const tooMuch = await api.post('/api/v1/accounting/restricted-funds/releases')
      .send({ date: D('04-01'), fund: 'temporer', amount: 11 * M, description: 'Renovasi' });
    expect(tooMuch.statusCode).toBe(400);
    expect(tooMuch.body.error).toMatch(/tersedia Rp\s?10\.000\.000/);
    const permanent = await api.post('/api/v1/accounting/restricted-funds/releases')
      .send({ date: D('04-01'), fund: 'permanen', amount: 1 * M, description: 'x' });
    expect(permanent.statusCode).toBe(400);

    const ok = await api.post('/api/v1/accounting/restricted-funds/releases')
      .send({ date: D('04-01'), fund: 'temporer', amount: 8 * M, description: 'Renovasi musala selesai' });
    expect(ok.statusCode).toBe(201);
    expect(ok.body.journal).toMatchObject({ debit: { account: '3100' }, credit: { account: '3000' }, source: { type: 'restriction_release' } });

    const list = (await api.get('/api/v1/accounting/restricted-funds')).body;
    expect(list.funds.map((f) => [f.key, f.balance])).toEqual([['temporer', 2 * M], ['permanen', 50 * M]]);
    expect(list.transactions).toHaveLength(3);
  });

  it('refuses a back-dated release that would overdraw a later balance', async () => {
    // 2 M left after the 8 M release on 04-01; a 3 M release dated 03-15 would leave the fund negative.
    const res = await api.post('/api/v1/accounting/restricted-funds/releases')
      .send({ date: D('03-15'), fund: 'temporer', amount: 3 * M, description: 'Mundur' });
    expect(res.statusCode).toBe(400);
  });

  it('validates input', async () => {
    const res = await api.post('/api/v1/accounting/restricted-funds/receipts').send({ date: D('03-01'), fund: 'lain', amount: 1 });
    expect(res.statusCode).toBe(400);
  });

  it('serves the full ISAK 335 package for the year', async () => {
    const res = await api.get(`/api/v1/accounting/reports/isak335?year=${YEAR}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.standard).toBe('ISAK 335 (d/h ISAK 35)');
    expect(res.body.financialPosition.netAssets).toMatchObject({ unrestricted: 8 * M, restricted: 52 * M, total: 60 * M });
    expect(res.body.changesInNetAssets.restricted).toMatchObject({ surplus: 60 * M, released: -8 * M, closing: 52 * M });
    expect(res.body.cashFlows.closingCash).toBe(60 * M);
    expect(res.body.notes.find((n) => n.id === 'A').paragraphs.join(' ')).toContain('Funds School');
    expect(res.body.accounts.find((a) => a.code === '4200')).toMatchObject({ netAssetClass: 'restricted', activity: 'financing' });
  });

  it('keeps the legacy balance sheet consistent with the two classes', async () => {
    const bs = (await api.get('/api/v1/accounting/reports/balance-sheet')).body;
    expect(bs.netAssets).toEqual({ unrestricted: 8 * M, restricted: 52 * M, total: 60 * M });
    expect(bs.equity).toBe(60 * M);
  });

  it('keeps the auditor read-only: reports yes, accounting writes no', async () => {
    await api.post('/api/v1/master/users').send({
      name: 'Auditor', email: 'auditor@funds.test', password: 'Auditor-Pass-123', role: 'auditor',
    }).expect(201);
    const auditorToken = await activate(app, HOST, 'auditor@funds.test', 'Auditor-Pass-123', 'Auditor-Pass-456');
    const as = (method, path) => request(app)[method](path).set('Host', HOST).set('Authorization', `Bearer ${auditorToken}`);
    expect((await as('get', `/api/v1/accounting/reports/isak335?year=${YEAR}`)).statusCode).toBe(200);
    expect((await as('get', '/api/v1/accounting/restricted-funds')).statusCode).toBe(200);
    for (const path of ['/api/v1/accounting/journals', '/api/v1/accounting/opening-balance',
      '/api/v1/accounting/restricted-funds/receipts', '/api/v1/accounting/restricted-funds/releases']) {
      const res = await as('post', path).send({ date: D('05-01'), fund: 'temporer', amount: 1, description: 'x' });
      expect([path, res.statusCode]).toEqual([path, 403]);
    }
  });
});
