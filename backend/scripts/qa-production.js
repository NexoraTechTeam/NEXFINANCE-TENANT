'use strict';

/**
 * Production QA (final review). Never touches a school's data:
 *   node scripts/qa-production.js count <slug>   read-only counts (users, records per collection)
 *   node scripts/qa-production.js run            throwaway tenant `qa-final-review` + full API sweep on a private app instance
 *   node scripts/qa-production.js cleanup        drops the throwaway tenant (schema, registry rows, console audit)
 * Requires QA_CONFIRM=qa-final-review. Passwords are generated here and never printed.
 */
const crypto = require('crypto');
const http = require('http');

const QA_SLUG = 'qa-final-review';
const QA_HOST = 'qa-final-review.invalid';
const QA_SCHEMA = 't_qa_final_review';

async function countTenant(knex, slug) {
  const tenant = await knex.withSchema('platform').from('tenants').where({ slug }).first('id', 'schema_name');
  if (!tenant) return { exists: false };
  const s = tenant.schema_name;
  const [{ count: users }] = await knex.withSchema(s).from('users').count('* as count');
  const rows = await knex.withSchema(s).from('records').select('collection').count('* as count').groupBy('collection');
  return {
    exists: true,
    users: Number(users),
    records: Object.fromEntries(rows.map((r) => [r.collection, Number(r.count)]).sort(([a], [b]) => a.localeCompare(b))),
  };
}

async function cleanup(knex, slug = QA_SLUG) {
  if (slug !== QA_SLUG) throw new Error(`Refusing to remove tenant "${slug}": only ${QA_SLUG} is managed by this script`);
  const tenant = await knex.withSchema('platform').from('tenants').where({ slug }).first('id', 'schema_name');
  if (tenant) {
    if (tenant.schema_name !== QA_SCHEMA) throw new Error(`Refusing: unexpected schema ${tenant.schema_name}`);
    await knex.transaction(async (trx) => {
      await trx.withSchema('platform').from('platform_audit').where({ tenant_id: tenant.id }).del();
      await trx.withSchema('platform').from('tenants').where({ id: tenant.id }).del(); // domains + assets cascade
      await trx.raw('DROP SCHEMA IF EXISTS ?? CASCADE', [QA_SCHEMA]);
    });
  }
  const { rows } = await knex.raw('SELECT 1 FROM pg_namespace WHERE nspname = ?', [QA_SCHEMA]);
  const [{ count }] = await knex.withSchema('platform').from('tenant_domains').where({ domain: QA_HOST }).count('* as count');
  const [{ count: t }] = await knex.withSchema('platform').from('tenants').where({ slug }).count('* as count');
  return { removed: Boolean(tenant), schemaLeft: rows.length > 0, rowsLeft: Number(count) + Number(t) };
}

/** Full API sweep (every endpoint × 6 roles, bad inputs, ledger integrity) against a private app instance. */
async function sweep(base) {
  const findings = [];
  let checks = 0;
  const call = async (method, path, { token, body } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'x-forwarded-host': QA_HOST, 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text.slice(0, 120); }
    return { status: res.status, data };
  };
  const expect = (name, got, want) => {
    checks += 1;
    const ok = Array.isArray(want) ? want.includes(got) : got === want;
    if (!ok || got >= 500) findings.push(`${name}: got ${got}, want ${want}`);
  };
  const pw = () => `Qa-${crypto.randomBytes(9).toString('base64url')}!`;
  const login = (u, p) => call('POST', '/api/v1/auth/login', { body: { email: u, password: p } });
  const activate = async (u, temp) => {
    const first = await login(u, temp);
    const next = pw();
    await call('POST', '/api/v1/auth/change-password', { token: first.data.token, body: { currentPassword: temp, newPassword: next, confirmPassword: next } });
    return { token: (await login(u, next)).data.token, password: next, temp: first.data.token };
  };
  const year = new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10);

  // Roles
  const adminTemp = process.env.QA_ADMIN_TEMP;
  const tempOnly = (await login('qa-admin', adminTemp)).data.token;
  expect('temporary password blocked from business API', (await call('GET', '/api/v1/dashboard/kpi', { token: tempOnly })).status, 403);
  const tokens = { super_admin: (await activate('qa-admin', adminTemp)).token };
  for (const role of ['admin', 'bendahara', 'kabag', 'staff', 'auditor']) {
    const temp = pw();
    expect(`create ${role}`, (await call('POST', '/api/v1/master/users', { token: tokens.super_admin, body: { name: `QA ${role}`, email: `${role}@qa.invalid`, password: temp, role } })).status, 201);
    tokens[role] = (await activate(`${role}@qa.invalid`, temp)).token;
  }
  const A = tokens.super_admin;
  const W = async (name, role, method, path, body, want) => { const r = await call(method, path, { token: tokens[role], body }); expect(`${name} as ${role}`, r.status, want); return r.data; };

  // Base data
  await W('opening balance', 'super_admin', 'POST', '/api/v1/accounting/opening-balance', { date: `${year}-01-01`, entries: [{ account: '1000', amount: 10_000_000 }, { account: '1100', amount: 200_000_000 }, { account: '1500', amount: 500_000_000 }, { account: '2000', amount: 5_000_000 }] }, 201);
  const st = await W('create student', 'super_admin', 'POST', '/api/v1/master/students', { nis: 'QA1', name: 'Siswa QA', class: '7A' }, 201);
  const em = await W('create employee', 'super_admin', 'POST', '/api/v1/master/employees', { name: 'Guru QA', position: 'Guru', baseSalary: 4_000_000, certificationAllowance: 1_000_000 }, 201);
  const sid = st?.data?.id || st?.id;
  const eid = em?.data?.id || em?.id;

  // RBAC matrix
  const MOD = {
    dashboard: ['/dashboard/kpi', '/dashboard/monthly-report'],
    spp: ['/spp/invoices', '/spp/reports'],
    payroll: ['/payroll/employees', '/payroll/history', '/payroll/reports'],
    expenses: ['/expenses'],
    procurement: ['/procurement/pr', '/procurement/po', '/procurement/reports'],
    accounting: ['/accounting/chart-of-accounts', '/accounting/journals', '/accounting/reports/balance-sheet', '/accounting/reports/income-statement', `/accounting/reports/monthly?year=${year}`, `/accounting/reports/isak335?year=${year}`, '/accounting/opening-balance', '/accounting/restricted-funds', '/accounting/fixed-assets'],
    master: ['/master/students', '/master/employees'],
    activity: ['/activity', '/activity/stats'],
    notifications: ['/notifications/config'],
  };
  const ALLOWED = {
    super_admin: Object.keys(MOD), admin: Object.keys(MOD),
    bendahara: ['dashboard', 'spp', 'payroll', 'expenses', 'accounting', 'master', 'activity', 'notifications'],
    kabag: ['dashboard', 'expenses', 'procurement', 'activity', 'notifications'],
    staff: ['dashboard', 'expenses', 'notifications'],
    auditor: ['dashboard', 'accounting'],
  };
  for (const [role, tok] of Object.entries(tokens)) {
    for (const [mod, paths] of Object.entries(MOD)) {
      for (const p of paths) {
        const want = ALLOWED[role].includes(mod) || (role === 'auditor' && /reports\/(isak335|monthly)/.test(p)) ? 200 : 403;
        expect(`GET ${p} as ${role}`, (await call('GET', `/api/v1${p}`, { token: tok })).status, want);
      }
    }
    expect(`GET /master/users as ${role}`, (await call('GET', '/api/v1/master/users', { token: tok })).status, ['super_admin', 'admin'].includes(role) ? 200 : 403);
  }
  expect('no token', (await call('GET', '/api/v1/dashboard/kpi')).status, 401);

  // Module flows and refusals
  const inv = await W('SPP invoice', 'bendahara', 'POST', '/api/v1/spp/invoices', { studentId: sid, studentName: 'Siswa QA', amount: 750_000, month: 'QA' }, 201);
  await W('SPP payment', 'bendahara', 'POST', '/api/v1/spp/payment', { invoiceId: inv?.id, method: 'transfer' }, 200);
  await W('SPP negative', 'bendahara', 'POST', '/api/v1/spp/invoices', { studentId: sid, studentName: 'x', amount: -1, month: 'QA' }, 400);
  await W('payroll', 'bendahara', 'POST', '/api/v1/payroll/calculate', { employeeId: eid, month: 'QA' }, 201);
  await W('payroll twice', 'bendahara', 'POST', '/api/v1/payroll/calculate', { employeeId: eid, month: 'QA' }, 409);
  const ex = await W('expense', 'staff', 'POST', '/api/v1/expenses/submit', { title: 'ATK QA', amount: 500_000, category: 'ATK & Supplies' }, 201);
  await W('staff approves', 'staff', 'POST', `/api/v1/expenses/${ex?.id}/approve`, {}, 403);
  await W('approve 1', 'kabag', 'POST', `/api/v1/expenses/${ex?.id}/approve`, {}, 200);
  await W('approve 1 again', 'kabag', 'POST', `/api/v1/expenses/${ex?.id}/approve`, {}, 409);
  await W('approve 2', 'bendahara', 'POST', `/api/v1/expenses/${ex?.id}/approve`, {}, 200);
  await W('reject approved', 'kabag', 'POST', `/api/v1/expenses/${ex?.id}/reject`, { reason: 'x' }, 400);
  const pr = await W('PR', 'kabag', 'POST', '/api/v1/procurement/pr', { item: 'Kertas QA', quantity: 2, estimatedCost: 100_000 }, 201);
  const po = await W('PO', 'kabag', 'POST', '/api/v1/procurement/po', { prId: pr?.id, vendor: 'CV QA', totalCost: 90_000 }, 201);
  await W('PO unknown PR', 'kabag', 'POST', '/api/v1/procurement/po', { prId: 'NOPE', vendor: 'x', totalCost: 1 }, 404);
  await W('receive PO', 'kabag', 'POST', `/api/v1/procurement/po/${po?.id}/receive`, {}, 200);
  await W('journal', 'bendahara', 'POST', '/api/v1/accounting/journals', { date: today, description: 'QA', debit: { account: '5100', amount: 100_000 }, credit: { account: '1000', amount: 100_000 } }, 201);
  await W('journal unbalanced', 'bendahara', 'POST', '/api/v1/accounting/journals', { date: today, description: 'x', debit: { account: '5100', amount: 100 }, credit: { account: '1000', amount: 90 } }, 400);
  await W('restricted receipt', 'bendahara', 'POST', '/api/v1/accounting/restricted-funds/receipts', { date: today, fund: 'temporer', amount: 15_000_000, method: 'transfer', description: 'QA' }, 201);
  await W('restricted release', 'bendahara', 'POST', '/api/v1/accounting/restricted-funds/releases', { date: today, fund: 'temporer', amount: 5_000_000, description: 'QA' }, 201);
  await W('auditor writes', 'auditor', 'POST', '/api/v1/accounting/journals', { date: today, description: 'x', debit: { account: '5100', amount: 1 }, credit: { account: '1000', amount: 1 } }, 403);
  const users = (await call('GET', '/api/v1/master/users', { token: A })).data.data;
  const sa = users.find((u) => u.username === 'qa-admin');
  await W('admin edits super admin', 'admin', 'PUT', `/api/v1/master/users/${sa.id}`, { name: 'x' }, 403);
  const kab = users.find((u) => u.email === 'kabag@qa.invalid');
  await W('deactivate kabag', 'super_admin', 'DELETE', `/api/v1/master/users/${kab.id}`, undefined, 200);
  expect('deactivated token rejected', (await call('GET', '/api/v1/expenses', { token: tokens.kabag })).status, 401);

  // Ledger integrity
  const isak = (await call('GET', `/api/v1/accounting/reports/isak335?year=${year}`, { token: A })).data;
  const journals = (await call('GET', '/api/v1/accounting/journals', { token: A })).data.journals;
  const bad = journals.filter((j) => !(j.debit?.amount > 0) || j.debit.amount !== j.credit?.amount);
  const fp = isak.financialPosition;
  const ledger = {
    journals: journals.length,
    malformed: bad.length,
    balanced: fp.totals.assets === fp.totals.liabilitiesAndNetAssets,
    cashReconciled: isak.cashFlows.closingCash === fp.cash,
    netAssetsReconciled: isak.changesInNetAssets.total.closing === fp.totals.netAssets,
  };
  if (bad.length || !ledger.balanced || !ledger.cashReconciled || !ledger.netAssetsReconciled) findings.push(`ledger ${JSON.stringify(ledger)}`);
  return { checks, findings, ledger };
}

async function run(knex) {
  const { provisionTenant } = require('../src/services/tenants');
  const { createApp } = require('../src/app');
  await cleanup(knex); // leftovers of an interrupted run
  const temp = `Qa-${crypto.randomBytes(9).toString('base64url')}!`;
  await provisionTenant(knex, {
    slug: QA_SLUG, name: 'QA Final Review', domains: [QA_HOST],
    admin: { username: 'qa-admin', name: 'QA Admin', password: temp },
  });
  const app = createApp({ knex, config: { loginRateLimit: { max: 1000 }, tenantCacheTtlMs: 0 } });
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  process.env.QA_ADMIN_TEMP = temp;
  try {
    return await sweep(`http://127.0.0.1:${server.address().port}`);
  } finally {
    delete process.env.QA_ADMIN_TEMP;
    await new Promise((resolve) => server.close(resolve));
  }
}

async function main() {
  const [command, slug] = process.argv.slice(2);
  if (process.env.QA_CONFIRM !== QA_SLUG) throw new Error(`Set QA_CONFIRM=${QA_SLUG}`);
  const { createKnex } = require('../src/db/connection');
  const knex = createKnex();
  try {
    let out;
    if (command === 'count') out = await countTenant(knex, slug);
    else if (command === 'run') out = await run(knex);
    else if (command === 'cleanup') out = await cleanup(knex);
    else throw new Error('Usage: qa-production.js count <slug> | run | cleanup');
    console.log(JSON.stringify({ command, ...out }, null, 1));
    if (out.findings?.length || out.schemaLeft || out.rowsLeft) process.exitCode = 1;
  } finally {
    await knex.destroy();
  }
}

if (require.main === module) main().catch((err) => { console.error(`❌ ${err.message}`); process.exit(1); });

module.exports = { QA_SLUG, QA_HOST, countTenant, cleanup, run };
