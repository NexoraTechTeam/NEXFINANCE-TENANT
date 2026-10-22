'use strict';

const request = require('supertest');
const { bootstrap, activate } = require('./helpers/setup');
const { provisionTenant } = require('../services/tenants');
const { migrateTenantSchema } = require('../db/migrate');

const HOST = 'assets.localhost';
const M = 1_000_000;
const YEAR = new Date().getFullYear();
let app;
let knex;
let token;

beforeAll(async () => {
  ({ app, knex } = await bootstrap({ demo: false }));
  await provisionTenant(knex, {
    slug: 'assets', name: 'Assets School', domains: [HOST],
    admin: { username: 'admin-assets', name: 'Admin', password: 'Assets-Pass-123' },
  });
  token = await activate(app, HOST, 'admin-assets', 'Assets-Pass-123', 'Assets-Pass-123-Tetap');
});

afterAll(async () => {
  await knex.destroy();
});

const as = (tk) => new Proxy({}, {
  get: (_, method) => (path) => request(app)[method](path).set('Host', HOST).set('Authorization', `Bearer ${tk}`),
});
const call = new Proxy({}, {
  get: (_, method) => (path) => request(app)[method](path).set('Host', HOST).set('Authorization', `Bearer ${token}`),
});

const ym = (offset = 0) => {
  const d = new Date();
  const total = d.getUTCFullYear() * 12 + d.getUTCMonth() + offset;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
};
const building = (over = {}) => ({
  name: 'Gedung A', category: 'bangunan', mode: 'acquisition', cost: 240 * M, usefulLifeMonths: 240,
  acquisitionDate: `${YEAR - 1}-01-15`, method: 'transfer', ...over,
});
const journalsOf = async (type) => (await call.get('/api/v1/accounting/journals')).body.journals.filter((j) => j.source?.type === type);

describe('chart of accounts for fixed assets', () => {
  it('seeds the depreciation accounts into a new tenant', async () => {
    const { accounts } = (await call.get('/api/v1/accounting/chart-of-accounts')).body;
    expect(accounts['1510']).toMatchObject({ name: 'Peralatan & Kendaraan', type: 'Asset', isak35: 'Aset Tetap' });
    expect(accounts['1590']).toMatchObject({ name: 'Akumulasi Penyusutan', type: 'Asset', isak35: 'Aset Tetap' });
    expect(accounts['5500']).toMatchObject({ name: 'Beban Penyusutan', type: 'Expense' });
    expect(Object.keys(accounts)).toHaveLength(21);
  });

  it('adds the accounts to an existing tenant by migration, idempotently and without duplicates', async () => {
    const schema = 't_assets';
    await knex.withSchema(schema).from('records').where({ collection: 'chart_of_accounts' }).whereIn('id', ['1510', '1590', '5500']).del();
    await knex.withSchema(schema).from('schema_migrations').where({ id: '002_fixed_asset_accounts' }).del();
    await migrateTenantSchema(knex, schema);
    await migrateTenantSchema(knex, schema);
    const ids = (await knex.withSchema(schema).from('records').where({ collection: 'chart_of_accounts' }).select('id')).map((r) => r.id);
    expect(ids).toHaveLength(21);
    expect(new Set(ids).size).toBe(21);
  });

  it('does not touch the accounts a school already edited', async () => {
    const schema = 't_assets';
    await knex.withSchema(schema).from('records').where({ collection: 'chart_of_accounts', id: '1590' })
      .update({ data: { id: '1590', name: 'Akum. Penyusutan (kustom)', type: 'Asset', isak35: 'Aset Tetap' } });
    await knex.withSchema(schema).from('schema_migrations').where({ id: '002_fixed_asset_accounts' }).del();
    await migrateTenantSchema(knex, schema);
    const row = await knex.withSchema(schema).from('records').where({ collection: 'chart_of_accounts', id: '1590' }).first('data');
    expect(row.data.name).toBe('Akum. Penyusutan (kustom)');
    await knex.withSchema(schema).from('records').where({ collection: 'chart_of_accounts', id: '1590' })
      .update({ data: { id: '1590', name: 'Akumulasi Penyusutan', type: 'Asset', isak35: 'Aset Tetap' } });
  });
});

describe('registering fixed assets', () => {
  it('starts empty', async () => {
    const res = await call.get('/api/v1/accounting/fixed-assets');
    expect(res.statusCode).toBe(200);
    expect(res.body.assets).toEqual([]);
    expect(res.body.totals).toEqual({ cost: 0, accumulated: 0, bookValue: 0 });
    expect(res.body.categories.map((c) => c.key)).toEqual(['tanah', 'bangunan', 'peralatan', 'kendaraan']);
  });

  it('records an acquisition: asset in the register and the cost posted against bank', async () => {
    const res = await call.post('/api/v1/accounting/fixed-assets').send(building());
    expect(res.statusCode).toBe(201);
    expect(res.body.asset).toMatchObject({
      id: 'AST000001', name: 'Gedung A', category: 'bangunan', account: '1500', cost: 240 * M, residualValue: 0,
      usefulLifeMonths: 240, depreciable: true, depreciationFrom: `${YEAR - 1}-01`, monthly: M, accumulated: 0, bookValue: 240 * M,
    });
    const [j] = await journalsOf('asset_acquisition');
    expect(j).toMatchObject({ date: `${YEAR - 1}-01-15`, debit: { account: '1500', amount: 240 * M }, credit: { account: '1100', amount: 240 * M }, source: { id: 'AST000001' } });
  });

  it('uses cash for cash purchases and the equipment account for equipment', async () => {
    const res = await call.post('/api/v1/accounting/fixed-assets').send({
      name: 'Proyektor', category: 'peralatan', mode: 'acquisition', cost: 12 * M, usefulLifeMonths: 48, residualValue: 0,
      acquisitionDate: `${YEAR}-01-10`, method: 'tunai',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.asset).toMatchObject({ account: '1510', monthly: 250_000 });
    const j = (await journalsOf('asset_acquisition')).find((x) => x.source.id === res.body.asset.id);
    expect(j).toMatchObject({ debit: { account: '1510' }, credit: { account: '1000' } });
  });

  it('registers land without depreciation', async () => {
    const res = await call.post('/api/v1/accounting/fixed-assets').send({
      name: 'Tanah sekolah', category: 'tanah', mode: 'acquisition', cost: 500 * M, usefulLifeMonths: 99, acquisitionDate: `${YEAR - 1}-01-01`, method: 'transfer',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.asset).toMatchObject({ account: '1500', depreciable: false, usefulLifeMonths: null, depreciationFrom: null, monthly: 0, bookValue: 500 * M });
  });

  it('registers an existing asset that is already in the opening balance', async () => {
    const before = (await call.get('/api/v1/accounting/journals')).body.journals.length;
    const res = await call.post('/api/v1/accounting/fixed-assets').send({
      name: 'Gedung lama', category: 'bangunan', mode: 'existing', cost: 100 * M, usefulLifeMonths: 100, acquisitionDate: '2010-06-01',
      depreciationFrom: `${YEAR}-01`, accumulatedDepreciation: 40 * M,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.asset).toMatchObject({ mode: 'existing', openingAccumulated: 40 * M, accumulated: 40 * M, bookValue: 60 * M, monthly: M });
    const journals = (await call.get('/api/v1/accounting/journals')).body.journals;
    expect(journals).toHaveLength(before + 1); // only the opening accumulated depreciation, no second cost
    expect(journals[0]).toMatchObject({ debit: { account: '3000', amount: 40 * M }, credit: { account: '1590', amount: 40 * M }, source: { type: 'opening_balance', id: '1590' } });
  });

  it('validates the input', async () => {
    const bad = (over) => call.post('/api/v1/accounting/fixed-assets').send(building(over));
    const cases = [
      { name: '' }, { name: 'x'.repeat(121) }, { category: 'pesawat' }, { cost: 0 }, { cost: -5 }, { cost: 'abc' },
      { usefulLifeMonths: 0 }, { usefulLifeMonths: 1.5 }, { usefulLifeMonths: 601 }, { usefulLifeMonths: undefined },
      { residualValue: -1 }, { residualValue: 240 * M }, { acquisitionDate: '2026-13-01' }, { acquisitionDate: undefined },
      { mode: 'lain' }, { method: 'giro' }, { cost: 100, usefulLifeMonths: 600 },
    ];
    for (const over of cases) {
      const res = await bad(over);
      expect([JSON.stringify(over), res.statusCode]).toEqual([JSON.stringify(over), 400]);
    }
    const existing = (over) => call.post('/api/v1/accounting/fixed-assets').send({
      name: 'Lama', category: 'bangunan', mode: 'existing', cost: 100 * M, usefulLifeMonths: 100, acquisitionDate: '2010-06-01', depreciationFrom: `${YEAR}-01`, ...over,
    });
    for (const over of [{ depreciationFrom: undefined }, { depreciationFrom: '2026-13' }, { accumulatedDepreciation: -1 }, { accumulatedDepreciation: 101 * M }]) {
      const res = await existing(over);
      expect([JSON.stringify(over), res.statusCode]).toEqual([JSON.stringify(over), 400]);
    }
  });

  it('rejects a bad payload without registering anything', async () => {
    const res = await call.get('/api/v1/accounting/fixed-assets');
    expect(res.body.assets.map((a) => a.id)).toEqual(['AST000001', 'AST000002', 'AST000003', 'AST000004']);
  });
});

describe('monthly depreciation', () => {
  it('refuses a future or malformed period', async () => {
    for (const period of [ym(1), '2026-13', 'abc', undefined, '2026-10-01']) {
      const res = await call.post('/api/v1/accounting/depreciation/run').send({ period });
      expect([String(period), res.statusCode]).toEqual([String(period), 400]);
    }
  });

  it('posts every missing month up to the period, once', async () => {
    const period = `${YEAR - 1}-03`;
    const res = await call.post('/api/v1/accounting/depreciation/run').send({ period });
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ period, posted: 3, total: 3 * M });
    const rows = (await journalsOf('depreciation')).filter((j) => j.source.assetId === 'AST000001').sort((a, b) => a.date.localeCompare(b.date));
    expect(rows.map((j) => j.date)).toEqual([`${YEAR - 1}-01-31`, `${YEAR - 1}-02-28`, `${YEAR - 1}-03-31`]);
    expect(rows[0]).toMatchObject({ debit: { account: '5500', amount: M }, credit: { account: '1590', amount: M }, auto: true, source: { type: 'depreciation', assetId: 'AST000001', month: `${YEAR - 1}-01` } });

    const again = await call.post('/api/v1/accounting/depreciation/run').send({ period });
    expect(again.body).toMatchObject({ posted: 0, total: 0 });
    expect(await journalsOf('depreciation')).toHaveLength(3);
  });

  it('is safe against two runs at the same moment', async () => {
    const period = `${YEAR - 1}-06`;
    const [a, b] = await Promise.all([
      call.post('/api/v1/accounting/depreciation/run').send({ period }),
      call.post('/api/v1/accounting/depreciation/run').send({ period }),
    ]);
    expect([a.statusCode, b.statusCode]).toEqual([201, 201]);
    expect(a.body.posted + b.body.posted).toBe(3);
    const months = (await journalsOf('depreciation')).filter((j) => j.source.assetId === 'AST000001').map((j) => j.source.month);
    expect(new Set(months).size).toBe(months.length);
    expect(months).toHaveLength(6);
  });

  it('catches up to the current month, covering new assets and existing ones from their start month', async () => {
    const res = await call.post('/api/v1/accounting/depreciation/run').send({ period: ym(0) });
    expect(res.statusCode).toBe(201);
    const list = (await call.get('/api/v1/accounting/fixed-assets')).body;
    const byId = Object.fromEntries(list.assets.map((a) => [a.id, a]));
    const monthsSince = (from) => (Number(ym(0).slice(0, 4)) - Number(from.slice(0, 4))) * 12 + Number(ym(0).slice(5)) - Number(from.slice(5)) + 1;
    expect(byId.AST000001.accumulated).toBe(monthsSince(`${YEAR - 1}-01`) * M);
    expect(byId.AST000001.bookValue).toBe(240 * M - byId.AST000001.accumulated);
    expect(byId.AST000002.accumulated).toBe(monthsSince(`${YEAR}-01`) * 250_000);
    expect(byId.AST000003.accumulated).toBe(0); // land
    expect(byId.AST000004.accumulated).toBe(40 * M + monthsSince(`${YEAR}-01`) * M);
    expect(list.totals.cost).toBe(852 * M);
    expect(list.totals.accumulated + list.totals.bookValue).toBe(list.totals.cost);
  });

  it('shows the register against the ledger so differences are visible', async () => {
    const { reconciliation } = (await call.get('/api/v1/accounting/fixed-assets')).body;
    expect(reconciliation).toEqual([
      { account: '1500', name: 'Tanah & Bangunan', ledger: 740 * M, register: 840 * M, difference: -100 * M },
      { account: '1510', name: 'Peralatan & Kendaraan', ledger: 12 * M, register: 12 * M, difference: 0 },
      { account: '1590', name: 'Akumulasi Penyusutan', ledger: expect.any(Number), register: expect.any(Number), difference: 0 },
    ]);
  });

  it('is rejected for an auditor and for staff, readable by the auditor', async () => {
    await call.post('/api/v1/master/users').send({ name: 'Auditor', email: 'auditor@assets.test', password: 'Auditor-Pass-123', role: 'auditor' }).expect(201);
    await call.post('/api/v1/master/users').send({ name: 'Staf', email: 'staf@assets.test', password: 'Staf-Pass-12345', role: 'staff' }).expect(201);
    const auditor = as(await activate(app, HOST, 'auditor@assets.test', 'Auditor-Pass-123', 'Auditor-Pass-456'));
    const staff = as(await activate(app, HOST, 'staf@assets.test', 'Staf-Pass-12345', 'Staf-Pass-67890'));
    expect((await auditor.get('/api/v1/accounting/fixed-assets')).statusCode).toBe(200);
    expect((await auditor.post('/api/v1/accounting/fixed-assets').send(building())).statusCode).toBe(403);
    expect((await auditor.post('/api/v1/accounting/depreciation/run').send({ period: ym(0) })).statusCode).toBe(403);
    expect((await staff.get('/api/v1/accounting/fixed-assets')).statusCode).toBe(403);
    expect((await staff.post('/api/v1/accounting/depreciation/run').send({ period: ym(0) })).statusCode).toBe(403);
  });
});

describe('reports after depreciation', () => {
  it('keeps the statements balanced with accumulated depreciation and expense', async () => {
    const res = await call.get(`/api/v1/accounting/reports/isak335?year=${YEAR}`);
    expect(res.statusCode).toBe(200);
    const fp = res.body.financialPosition;
    expect(fp.assets.nonCurrent.map((l) => l.code)).toEqual(['1500', '1510', '1590']);
    const accumulated = fp.assets.nonCurrent.find((l) => l.code === '1590');
    expect(accumulated).toMatchObject({ label: 'Akumulasi Penyusutan' });
    expect(accumulated.amount).toBeLessThan(0);
    expect(fp.totals.assets).toBe(fp.totals.liabilitiesAndNetAssets);
    const expense = res.body.comprehensiveIncome.unrestricted.expenses.find((l) => l.code === '5500');
    expect(expense).toMatchObject({ label: 'Beban Penyusutan' });
    expect(expense.amount).toBeGreaterThan(0);
  });

  it('keeps depreciation (non-cash) out of the cash flow statement', async () => {
    const { cashFlows } = (await call.get(`/api/v1/accounting/reports/isak335?year=${YEAR}`)).body;
    const labels = [...cashFlows.operating.lines, ...cashFlows.investing.lines, ...cashFlows.financing.lines].map((l) => l.label);
    expect(labels.some((l) => /penyusutan/i.test(l))).toBe(false);
    expect(cashFlows.investing.lines.map((l) => l.label)).toContain('Perolehan Peralatan & Kendaraan');
  });

  it('adds the fixed-asset note and the depreciation policy to the notes (CALK)', async () => {
    const { notes } = (await call.get(`/api/v1/accounting/reports/isak335?year=${YEAR}`)).body;
    const policy = notes.find((n) => n.id === 'B').paragraphs.join(' ');
    expect(policy).toMatch(/garis lurus/i);
    expect(policy).toMatch(/tanah tidak disusutkan/i);
    const note = notes.find((n) => n.id === 'G');
    expect(note.title).toBe('Aset tetap dan penyusutan');
    const rows = Object.fromEntries(note.rows.map((r) => [r.label, r.amount]));
    expect(rows['Bangunan — harga perolehan']).toBe(340 * M);
    expect(rows['Tanah — harga perolehan']).toBe(500 * M);
    expect(rows['Peralatan — harga perolehan']).toBe(12 * M);
    expect(rows['Total nilai buku']).toBe(Object.entries(rows).filter(([k]) => /nilai buku$/.test(k) && !/^Total/.test(k)).reduce((s, [, v]) => s + v, 0));
  });

  it('reports the fixed-asset note as of the end of the requested year', async () => {
    const { notes, financialPosition } = (await call.get(`/api/v1/accounting/reports/isak335?year=${YEAR - 1}`)).body;
    const rows = Object.fromEntries(notes.find((n) => n.id === 'G').rows.map((r) => [r.label, r.amount]));
    expect(rows['Bangunan — akumulasi penyusutan']).toBe(12 * M + 40 * M); // Gedung A (12 months) + opening of Gedung lama
    expect(rows['Peralatan — harga perolehan']).toBeUndefined(); // bought in the following year
    expect(financialPosition.totals.assets).toBe(financialPosition.totals.liabilitiesAndNetAssets);
  });

  it('shows the net fixed assets on the legacy balance sheet and dashboard detail', async () => {
    const bs = (await call.get('/api/v1/accounting/reports/balance-sheet')).body;
    const list = (await call.get('/api/v1/accounting/fixed-assets')).body;
    const { totals } = list;
    const accumulated = list.reconciliation.find((r) => r.account === '1590').ledger;
    expect(bs.detail.asetTetap).toBe(752 * M - accumulated);
    expect(bs.assets).toBe(bs.liabilities + bs.equity);
    const is = (await call.get('/api/v1/accounting/reports/income-statement')).body;
    expect(is.detail.bebanPenyusutan).toBeGreaterThan(0);
    expect(totals.bookValue).toBeGreaterThan(0);
  });
});
