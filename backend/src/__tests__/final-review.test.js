'use strict';

/**
 * Regression tests for the 2026-10-21 final review (E2E sweep of every role).
 * Each block names the root cause it guards.
 */
const request = require('supertest');
const { bootstrap } = require('./helpers/setup');
const { provisionTenant } = require('../services/tenants');

const HOST = 'review.localhost';
const PW = 'Review-Pass-2026!';
let app;
let knex;
const tokens = {};
const ids = {};

const call = (token) => new Proxy({}, {
  get: (_, method) => (path) => request(app)[method](path).set('Host', HOST).set('Authorization', `Bearer ${token}`),
});
const login = async (email, password) => request(app).post('/api/v1/auth/login').set('Host', HOST).send({ email, password });
const activate = async (email, temp) => {
  const first = await login(email, temp);
  await call(first.body.token).post('/api/v1/auth/change-password')
    .send({ currentPassword: temp, newPassword: PW, confirmPassword: PW }).expect(200);
  return (await login(email, PW)).body.token;
};

beforeAll(async () => {
  ({ app, knex } = await bootstrap({ demo: false }));
  await provisionTenant(knex, {
    slug: 'review', name: 'Review School', domains: [HOST],
    admin: { username: 'admin-review', name: 'Admin', password: 'Temp-Pass-123' },
  });
  tokens.super_admin = await activate('admin-review', 'Temp-Pass-123');
  for (const role of ['admin', 'bendahara', 'kabag', 'staff']) {
    await call(tokens.super_admin).post('/api/v1/master/users')
      .send({ name: role, email: `${role}@review.test`, password: 'Sementara-2026', role }).expect(201);
    tokens[role] = await activate(`${role}@review.test`, 'Sementara-2026');
  }
  const users = (await call(tokens.super_admin).get('/api/v1/master/users')).body.data;
  for (const u of users) ids[u.email || u.username] = u.id;
  const emp = await call(tokens.super_admin).post('/api/v1/master/employees')
    .send({ name: 'Guru', position: 'Guru', baseSalary: 4_000_000 });
  ids.employee = emp.body.data?.id || emp.body.id;
});

afterAll(async () => {
  await knex.destroy();
});

describe('RC1 — server-side validation of amounts and dates', () => {
  const today = new Date().toISOString().slice(0, 10);
  it.each([
    ['SPP invoice, negative amount', 'bendahara', '/api/v1/spp/invoices', { studentId: 'S1', studentName: 'x', amount: -100, month: 'Okt' }],
    ['SPP invoice, text amount', 'bendahara', '/api/v1/spp/invoices', { studentId: 'S1', studentName: 'x', amount: 'abc', month: 'Okt' }],
    ['expense, negative amount', 'staff', '/api/v1/expenses/submit', { title: 'x', amount: -5, category: 'ATK & Supplies' }],
    ['employee, negative salary', 'bendahara', '/api/v1/master/employees', { name: 'x', position: 'x', baseSalary: -1 }],
    ['PR, negative quantity/cost', 'kabag', '/api/v1/procurement/pr', { item: 'x', quantity: -1, estimatedCost: -5 }],
    ['journal, unbalanced', 'bendahara', '/api/v1/accounting/journals', { date: today, description: 'x', debit: { account: '5100', amount: 100 }, credit: { account: '1000', amount: 90 } }],
    ['journal, unknown account', 'bendahara', '/api/v1/accounting/journals', { date: today, description: 'x', debit: { account: '9999', amount: 100 }, credit: { account: '1000', amount: 100 } }],
    ['journal, zero amount', 'bendahara', '/api/v1/accounting/journals', { date: today, description: 'x', debit: { account: '5100', amount: 0 }, credit: { account: '1000', amount: 0 } }],
    ['journal, same account both sides', 'bendahara', '/api/v1/accounting/journals', { date: today, description: 'x', debit: { account: '1000', amount: 5 }, credit: { account: '1000', amount: 5 } }],
    ['journal, invalid date', 'bendahara', '/api/v1/accounting/journals', { date: 'kemarin', description: 'x', debit: { account: '5100', amount: 1 }, credit: { account: '1000', amount: 1 } }],
    ['opening balance, invalid date', 'bendahara', '/api/v1/accounting/opening-balance', { date: 'x', entries: [{ account: '1000', amount: 1 }] }],
    ['restricted receipt, impossible date', 'bendahara', '/api/v1/accounting/restricted-funds/receipts', { date: '2026-13-45', fund: 'temporer', amount: 1, method: 'tunai', description: 'x' }],
  ])('%s → 400', async (_, role, path, body) => {
    const res = await call(tokens[role]).post(path).send(body);
    expect(res.statusCode).toBe(400);
  });

  it('accepts a valid balanced journal', async () => {
    await call(tokens.bendahara).post('/api/v1/accounting/journals')
      .send({ date: today, description: 'Koreksi', debit: { account: '5100', amount: 1000 }, credit: { account: '1000', amount: 1000 } })
      .expect(201);
  });
});

describe('RC2 — workflow state and duplicates', () => {
  it('refuses a second payroll for the same employee and month', async () => {
    await call(tokens.bendahara).post('/api/v1/payroll/calculate').send({ employeeId: ids.employee, month: 'Oktober 2026' }).expect(201);
    const again = await call(tokens.bendahara).post('/api/v1/payroll/calculate').send({ employeeId: ids.employee, month: 'Oktober 2026' });
    expect(again.statusCode).toBe(409);
  });

  it('needs an existing PR for a PO, and only one PO per PR', async () => {
    expect((await call(tokens.kabag).post('/api/v1/procurement/po').send({ prId: 'NOPE', vendor: 'x', totalCost: 1 })).statusCode).toBe(404);
    const pr = await call(tokens.kabag).post('/api/v1/procurement/pr').send({ item: 'Kertas', quantity: 2, estimatedCost: 100_000 }).expect(201);
    await call(tokens.kabag).post('/api/v1/procurement/po').send({ prId: pr.body.id, vendor: 'CV', totalCost: 90_000 }).expect(201);
    expect((await call(tokens.kabag).post('/api/v1/procurement/po').send({ prId: pr.body.id, vendor: 'CV', totalCost: 90_000 })).statusCode).toBe(409);
    expect((await call(tokens.kabag).post('/api/v1/procurement/po').send({ prId: pr.body.id, vendor: 'CV', totalCost: 0 })).statusCode).toBe(400);
  });

  it('cannot reject an expense that is no longer pending (its journal is already posted)', async () => {
    const ex = await call(tokens.staff).post('/api/v1/expenses/submit').send({ title: 'ATK', amount: 50_000, category: 'ATK & Supplies' }).expect(201);
    await call(tokens.kabag).post(`/api/v1/expenses/${ex.body.id}/approve`).expect(200);
    await call(tokens.bendahara).post(`/api/v1/expenses/${ex.body.id}/approve`).expect(200);
    expect((await call(tokens.kabag).post(`/api/v1/expenses/${ex.body.id}/reject`).send({ reason: 'x' })).statusCode).toBe(400);
  });
});

describe('RC3 — approval authority (dual control)', () => {
  it('staff cannot approve or reject, and nobody approves their own submission', async () => {
    const ex = await call(tokens.staff).post('/api/v1/expenses/submit').send({ title: 'Konsumsi', amount: 75_000, category: 'Konsumsi' }).expect(201);
    expect((await call(tokens.staff).post(`/api/v1/expenses/${ex.body.id}/approve`)).statusCode).toBe(403);
    expect((await call(tokens.staff).post(`/api/v1/expenses/${ex.body.id}/reject`).send({})).statusCode).toBe(403);
    const own = await call(tokens.bendahara).post('/api/v1/expenses/submit').send({ title: 'Transport', amount: 20_000, category: 'Transportasi' }).expect(201);
    expect((await call(tokens.bendahara).post(`/api/v1/expenses/${own.body.id}/approve`)).statusCode).toBe(403);
    await call(tokens.kabag).post(`/api/v1/expenses/${own.body.id}/approve`).expect(200);
  });
});

describe('RC4 — sessions follow the account state in the database', () => {
  it('blocks business APIs until a temporary password is changed', async () => {
    await call(tokens.super_admin).post('/api/v1/master/users')
      .send({ name: 'Baru', email: 'baru@review.test', password: 'Sementara-2026', role: 'bendahara' }).expect(201);
    const temp = (await login('baru@review.test', 'Sementara-2026')).body.token;
    const blocked = await call(temp).get('/api/v1/dashboard/kpi');
    expect(blocked.statusCode).toBe(403);
    expect(blocked.body.code).toBe('PASSWORD_CHANGE_REQUIRED');
    await call(temp).get('/api/v1/auth/me').expect(200);
    await call(temp).post('/api/v1/auth/change-password')
      .send({ currentPassword: 'Sementara-2026', newPassword: PW, confirmPassword: PW }).expect(200);
    await call(temp).get('/api/v1/dashboard/kpi').expect(200);
  });

  it('rejects the token of a deactivated user immediately', async () => {
    const t = await activate('kabag2@review.test', await (async () => {
      await call(tokens.super_admin).post('/api/v1/master/users').send({ name: 'K2', email: 'kabag2@review.test', password: 'Sementara-2026', role: 'kabag' }).expect(201);
      return 'Sementara-2026';
    })());
    await call(t).get('/api/v1/expenses').expect(200);
    const users = (await call(tokens.super_admin).get('/api/v1/master/users')).body.data;
    await call(tokens.super_admin).delete(`/api/v1/master/users/${users.find((u) => u.email === 'kabag2@review.test').id}`).expect(200);
    expect((await call(t).get('/api/v1/expenses')).statusCode).toBe(401);
  });

  it('applies a role change to existing sessions', async () => {
    expect((await call(tokens.staff).get('/api/v1/spp/invoices')).statusCode).toBe(403);
    await call(tokens.super_admin).patch(`/api/v1/master/users/${ids['staff@review.test']}/role`).send({ role: 'bendahara' }).expect(200);
    await call(tokens.staff).get('/api/v1/spp/invoices').expect(200);
    await call(tokens.super_admin).patch(`/api/v1/master/users/${ids['staff@review.test']}/role`).send({ role: 'staff' }).expect(200);
  });
});

describe('RC5 — user hierarchy', () => {
  it('an admin cannot edit or deactivate a super admin, nor set an invalid status', async () => {
    const sa = ids['admin-review'];
    expect((await call(tokens.admin).put(`/api/v1/master/users/${sa}`).send({ name: 'Diubah' })).statusCode).toBe(403);
    expect((await call(tokens.admin).delete(`/api/v1/master/users/${sa}`)).statusCode).toBe(403);
    expect((await call(tokens.admin).put(`/api/v1/master/users/${ids['kabag@review.test']}`).send({ status: 'hacked' })).statusCode).toBe(400);
    await call(tokens.admin).put(`/api/v1/master/users/${ids['kabag@review.test']}`).send({ name: 'Kabag Baru' }).expect(200);
  });
});

describe('RC6 — report access follows the "reports" module too', () => {
  it('a role with reports (but not accounting) can read the ISAK 335 package and monthly series', async () => {
    await call(tokens.super_admin).patch('/api/v1/master/role-permissions/kabag')
      .send({ permissions: ['dashboard', 'expenses', 'procurement', 'activity', 'notifications', 'reports'] }).expect(200);
    await call(tokens.kabag).get(`/api/v1/accounting/reports/isak335?year=${new Date().getFullYear()}`).expect(200);
    await call(tokens.kabag).get(`/api/v1/accounting/reports/monthly?year=${new Date().getFullYear()}`).expect(200);
    expect((await call(tokens.kabag).get('/api/v1/accounting/journals')).statusCode).toBe(403);
  });

  it('clamps activity pagination', async () => {
    const res = await call(tokens.super_admin).get('/api/v1/activity?limit=-5&offset=-3').expect(200);
    expect(res.body.limit).toBeGreaterThan(0);
    expect(res.body.offset).toBe(0);
  });
});

describe('logging', () => {
  it('does not print stack traces for expected client errors (4xx)', async () => {
    const env = process.env.NODE_ENV;
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NODE_ENV = 'production';
    try {
      const res = await call(tokens.bendahara).post('/api/v1/accounting/restricted-funds/releases')
        .send({ date: new Date().toISOString().slice(0, 10), fund: 'temporer', amount: 999_999_999, description: 'x' });
      expect(res.statusCode).toBe(400);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = env;
      spy.mockRestore();
    }
  });
});
