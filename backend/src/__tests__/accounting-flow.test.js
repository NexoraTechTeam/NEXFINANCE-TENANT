'use strict';

const request = require('supertest');
const { bootstrap } = require('./helpers/setup');
const { provisionTenant } = require('../services/tenants');

const HOST = 'flow.localhost';
let app;
let knex;
let token;

beforeAll(async () => {
  ({ app, knex } = await bootstrap({ demo: false }));
  await provisionTenant(knex, {
    slug: 'flow', name: 'Flow School', domains: [HOST],
    admin: { username: 'admin-flow', name: 'Admin', password: 'Flow-Pass-123' },
  });
  const res = await request(app).post('/api/v1/auth/login').set('Host', HOST)
    .send({ email: 'admin-flow', password: 'Flow-Pass-123' });
  token = res.body.token;
});

afterAll(async () => {
  await knex.destroy();
});

const api = new Proxy({}, {
  get: (_, method) => (path) => request(app)[method](path).set('Host', HOST).set('Authorization', `Bearer ${token}`),
});

const bs = async () => (await api.get('/api/v1/accounting/reports/balance-sheet')).body;
const is = async () => (await api.get('/api/v1/accounting/reports/income-statement')).body;

describe('real financial numbers for a clean tenant', () => {
  it('starts at zero everywhere (no dummy figures)', async () => {
    expect(await bs()).toMatchObject({ assets: 0, liabilities: 0, equity: 0 });
    expect(await is()).toMatchObject({ revenue: 0, expenses: 0, netIncome: 0 });
    const kpi = (await api.get('/api/v1/dashboard/kpi')).body;
    expect(kpi.cashBalance).toBe(0);
    const monthly = (await api.get('/api/v1/dashboard/monthly-report')).body;
    expect(monthly.breakdown.donations).toBe(0);
  });

  it('records an opening balance against unrestricted net assets', async () => {
    const res = await api.post('/api/v1/accounting/opening-balance').send({
      date: '2026-07-01',
      entries: [
        { account: '1000', amount: 5_000_000 },
        { account: '1100', amount: 120_000_000 },
        { account: '2000', amount: 10_000_000 },
      ],
    });
    expect(res.statusCode).toBe(201);
    const sheet = await bs();
    expect(sheet).toMatchObject({ assets: 125_000_000, liabilities: 10_000_000, equity: 115_000_000 });
  });

  it('rejects an opening balance with unknown accounts', async () => {
    const res = await api.post('/api/v1/accounting/opening-balance')
      .send({ date: '2026-07-01', entries: [{ account: '9999', amount: 1 }] });
    expect(res.statusCode).toBe(400);
  });

  it('posts SPP invoicing (receivable) and payment (cash) automatically', async () => {
    const inv = await api.post('/api/v1/spp/invoices')
      .send({ studentId: 'STU001', studentName: 'Siswa A', class: '7A', amount: 1_500_000, month: 'Juli 2026' });
    expect(inv.statusCode).toBe(201);
    expect((await bs()).detail.piutangSPP).toBe(1_500_000);
    expect((await is()).detail.pendapatanSPP).toBe(1_500_000);

    await api.post('/api/v1/spp/payment').send({ invoiceId: inv.body.id, method: 'Tunai' });
    const sheet = await bs();
    expect(sheet.detail.piutangSPP).toBe(0);
    expect(sheet.detail.kas).toBe(6_500_000);
    expect((await api.get('/api/v1/dashboard/kpi')).body.cashBalance).toBe(126_500_000);
  });

  it('posts payroll, approved expenses and received POs', async () => {
    const emp = await api.post('/api/v1/master/employees')
      .send({ name: 'Guru A', position: 'Guru', baseSalary: 4_000_000 });
    const pay = await api.post('/api/v1/payroll/calculate').send({ employeeId: emp.body.data.id, month: 'Juli 2026' });
    expect(pay.statusCode).toBe(201);
    expect((await is()).detail.bebanGaji).toBe(4_000_000);
    expect((await bs()).detail.hutangGaji).toBe(4_000_000 - pay.body.netSalary);

    const exp = await api.post('/api/v1/expenses/submit')
      .send({ description: 'Listrik', amount: 700_000, category: 'Utilitas' });
    await api.post(`/api/v1/expenses/${exp.body.id}/approve`);
    expect((await is()).detail.bebanLain).toBe(0); // one approval: still pending
    await api.post(`/api/v1/expenses/${exp.body.id}/approve`);
    expect((await is()).detail.bebanLain).toBe(700_000);

    const pr = await api.post('/api/v1/procurement/pr').send({ description: 'Meja', quantity: 2, estimatedCost: 2_000_000 });
    const po = await api.post('/api/v1/procurement/po').send({ prId: pr.body.id, vendor: 'CV A', totalAmount: 1_800_000 });
    await api.post(`/api/v1/procurement/po/${po.body.id}/receive`);
    const sheet = await bs();
    expect(sheet.detail.persediaan).toBe(1_800_000);
    expect(sheet.detail.hutangUsaha).toBe(10_000_000 + 1_800_000);
  });

  it('keeps the books balanced and lists auto journals', async () => {
    const sheet = await bs();
    expect(sheet.assets).toBe(sheet.liabilities + sheet.equity);
    const journals = (await api.get('/api/v1/accounting/journals')).body.journals;
    expect(journals.some((jr) => jr.source?.type === 'spp_payment')).toBe(true);
    expect(journals.every((jr) => jr.debit.amount === jr.credit.amount)).toBe(true);
  });

  it('exposes a monthly series for charts', async () => {
    // Auto postings are dated on the transaction day.
    const now = new Date();
    const res = await api.get(`/api/v1/accounting/reports/monthly?year=${now.getFullYear()}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.months).toHaveLength(12);
    const current = res.body.months[now.getMonth()];
    expect(current.pendapatan).toBe(1_500_000);
    expect(current.beban).toBe(4_000_000 + 700_000);
    expect(res.body.expenseDistribution.map((e) => e.account).sort()).toEqual(['5000', '5400']);
  });
});
