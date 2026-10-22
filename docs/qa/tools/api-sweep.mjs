// Final review — API sweep for every role. Prints a JSON report; never prints passwords.
const B = 'http://127.0.0.1:5080/api/v1';
const TH = 'almusabbihin-nexfinance.nexoratech.co';
const CH = 'console-nexfinance.nexoratech.co';
const findings = []; const log = [];
const req = async (host, method, path, { token, body } = {}) => {
  const r = await fetch(B + path, { method, headers: { host, 'x-forwarded-host': host, 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let data = null; const text = await r.text(); try { data = JSON.parse(text); } catch { data = text.slice(0, 200); }
  return { status: r.status, data };
};
const T = (method, path, opts) => req(TH, method, path, opts);
const expect = (name, got, want, extra = '') => {
  const ok = Array.isArray(want) ? want.includes(got) : got === want;
  log.push({ name, got, want, ok });
  if (!ok) findings.push(`${name}: got ${got}, want ${want} ${extra}`);
  if (got >= 500) findings.push(`5xx ${name}: ${got} ${extra}`);
  return ok;
};
const YEAR = new Date().getFullYear(); const today = new Date().toISOString().slice(0, 10);

// --- setup: admin via console reset, other roles via admin
const ct = (await req(CH, 'POST', '/console/auth/login', { body: { email: 'ops@nexoratech.co', password: 'Console-Docs-2026' } })).data.token;
const tid = (await req(CH, 'GET', '/console/tenants', { token: ct })).data.tenants[0].id;
const tmp = (await req(CH, 'POST', `/console/tenants/${tid}/reset-password`, { token: ct, body: { username: 'admin-almusabbihin' } })).data.temporaryPassword;
const PW = 'Final-Review-2026!';
const login = async (u, p) => (await T('POST', '/auth/login', { body: { email: u, password: p } }));
let r = await login('admin-almusabbihin', tmp);
expect('login super_admin (temp)', r.status, 200); const tmpToken = r.data.token;
// F-A probe: temp-password session must not reach business data before the change
expect('temp password session blocked from business API', (await T('GET', '/dashboard/kpi', { token: tmpToken })).status, 403, '(must_change_password only enforced in UI?)');
expect('change password', (await T('POST', '/auth/change-password', { token: tmpToken, body: { currentPassword: tmp, newPassword: PW, confirmPassword: PW } })).status, 200);
const tokens = { super_admin: (await login('admin-almusabbihin', PW)).data.token };
for (const role of ['admin', 'bendahara', 'kabag', 'staff', 'auditor']) {
  const email = `${role}@final.test`;
  expect(`create user ${role}`, (await T('POST', '/master/users', { token: tokens.super_admin, body: { name: `User ${role}`, email, password: 'Sementara-2026', role } })).status, 201);
  const l = await login(email, 'Sementara-2026');
  await T('POST', '/auth/change-password', { token: l.data.token, body: { currentPassword: 'Sementara-2026', newPassword: PW, confirmPassword: PW } });
  tokens[role] = (await login(email, PW)).data.token;
}

// --- base data (super_admin)
const A = tokens.super_admin;
expect('opening balance', (await T('POST', '/accounting/opening-balance', { token: A, body: { date: `${YEAR}-01-01`, entries: [{ account: '1000', amount: 10_000_000 }, { account: '1100', amount: 200_000_000 }, { account: '1500', amount: 500_000_000 }, { account: '2000', amount: 5_000_000 }] } })).status, 201);
const st = await T('POST', '/master/students', { token: A, body: { nis: 'F001', name: 'Siswa Final', class: '7A', guardianName: 'Wali', phone: '0811', email: 'wali@x.test' } });
expect('create student', st.status, 201); const sid = st.data?.id || st.data?.student?.id;
const em = await T('POST', '/master/employees', { token: A, body: { nip: 'E001', name: 'Guru Final', position: 'Guru', department: 'Akademik', baseSalary: 4_000_000, certificationAllowance: 1_000_000, familyAllowance: 500_000 } });
expect('create employee', em.status, 201); const eid = em.data?.id || em.data?.employee?.id;

// --- RBAC matrix: GET endpoints per role
const MOD = {
  dashboard: ['/dashboard/kpi', '/dashboard/monthly-report'],
  spp: ['/spp/invoices', '/spp/reports'],
  payroll: ['/payroll/employees', '/payroll/history', '/payroll/reports'],
  expenses: ['/expenses'],
  procurement: ['/procurement/pr', '/procurement/po', '/procurement/reports'],
  accounting: ['/accounting/chart-of-accounts', '/accounting/journals', '/accounting/reports/balance-sheet', '/accounting/reports/income-statement', `/accounting/reports/monthly?year=${YEAR}`, `/accounting/reports/isak335?year=${YEAR}`, '/accounting/opening-balance', '/accounting/restricted-funds', '/accounting/fixed-assets'],
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
  for (const [mod, paths] of Object.entries(MOD)) for (const p of paths) {
    const res = await T('GET', p, { token: tok });
    expect(`GET ${p} as ${role}`, res.status, ALLOWED[role].includes(mod) ? 200 : 403, JSON.stringify(res.data).slice(0, 120));
  }
  for (const p of ['/auth/me', '/auth/permissions']) expect(`GET ${p} as ${role}`, (await T('GET', p, { token: tok })).status, 200);
  const adminOnly = ['super_admin', 'admin'].includes(role);
  expect(`GET /master/users as ${role}`, (await T('GET', '/master/users', { token: tok })).status, adminOnly ? 200 : 403);
  expect(`GET /master/role-permissions as ${role}`, (await T('GET', '/master/role-permissions', { token: tok })).status, role === 'super_admin' ? 200 : 403);
}
expect('GET without token', (await T('GET', '/dashboard/kpi')).status, 401);
expect('GET with garbage token', (await T('GET', '/dashboard/kpi', { token: 'x.y.z' })).status, 401);

// --- write flows per module (allowed role) + forbidden role
const W = async (name, role, method, path, body, want) => { const res = await T(method, path, { token: tokens[role], body }); expect(`${name} as ${role}`, res.status, want, JSON.stringify(res.data).slice(0, 160)); return res.data; };
const inv = await W('create SPP invoice', 'bendahara', 'POST', '/spp/invoices', { studentId: sid, studentName: 'Siswa Final', class: '7A', amount: 750000, month: 'Oktober 2026' }, 201);
await W('pay SPP', 'bendahara', 'POST', '/spp/payment', { invoiceId: inv?.id, method: 'transfer' }, 200);
await W('pay SPP twice', 'bendahara', 'POST', '/spp/payment', { invoiceId: inv?.id, method: 'transfer' }, [400, 409]);
await W('pay unknown invoice', 'bendahara', 'POST', '/spp/payment', { invoiceId: 'NOPE', method: 'tunai' }, 404);
await W('invoice missing fields', 'bendahara', 'POST', '/spp/invoices', { studentId: sid }, 400);
await W('create SPP invoice (forbidden)', 'kabag', 'POST', '/spp/invoices', { studentId: sid, studentName: 'x', amount: 1, month: 'x' }, 403);
await W('payroll calculate', 'bendahara', 'POST', '/payroll/calculate', { employeeId: eid, month: 'Oktober 2026' }, 201);
await W('payroll calculate twice same month', 'bendahara', 'POST', '/payroll/calculate', { employeeId: eid, month: 'Oktober 2026' }, [400, 409]);
await W('payroll unknown employee', 'bendahara', 'POST', '/payroll/calculate', { employeeId: 'NOPE', month: 'Oktober 2026' }, 404);
await W('payroll (forbidden)', 'staff', 'POST', '/payroll/calculate', { employeeId: eid, month: 'Oktober 2026' }, 403);
const ex1 = await W('submit expense', 'staff', 'POST', '/expenses/submit', { title: 'ATK', description: 'Kertas', amount: 500000, category: 'ATK & Supplies' }, 201);
const exId = ex1?.id || ex1?.expense?.id;
await W('approve own expense? (staff no approve right)', 'staff', 'POST', `/expenses/${exId}/approve`, {}, 403);
await W('approve 1', 'kabag', 'POST', `/expenses/${exId}/approve`, {}, 200);
await W('approve 2 same person', 'kabag', 'POST', `/expenses/${exId}/approve`, {}, [400, 409]);
await W('approve 2', 'bendahara', 'POST', `/expenses/${exId}/approve`, {}, 200);
await W('approve already approved', 'admin', 'POST', `/expenses/${exId}/approve`, {}, [400, 409]);
const ex2 = await W('submit expense 2', 'staff', 'POST', '/expenses/submit', { title: 'Konsumsi', amount: 300000, category: 'Konsumsi' }, 201);
await W('reject expense', 'kabag', 'POST', `/expenses/${ex2?.id || ex2?.expense?.id}/reject`, { reason: 'Tidak sesuai' }, 200);
await W('approve unknown expense', 'kabag', 'POST', '/expenses/NOPE/approve', {}, 404);
await W('expense missing fields', 'staff', 'POST', '/expenses/submit', { amount: 1 }, 400);
await W('expense negative amount', 'staff', 'POST', '/expenses/submit', { title: 'x', amount: -5, category: 'ATK & Supplies' }, 400);
const pr = await W('create PR', 'kabag', 'POST', '/procurement/pr', { item: 'Kertas', quantity: 10, estimatedCost: 500000, urgency: 'normal', reason: 'UTS' }, 201);
const prId = pr?.id || pr?.purchaseRequest?.id;
const po = await W('create PO', 'kabag', 'POST', '/procurement/po', { prId, vendor: 'CV Uji', totalCost: 480000 }, 201);
const poId = po?.id || po?.purchaseOrder?.id;
await W('receive PO', 'kabag', 'POST', `/procurement/po/${poId}/receive`, {}, 200);
await W('receive PO twice (idempotent, no double journal)', 'kabag', 'POST', `/procurement/po/${poId}/receive`, {}, 200);
await W('PO unknown PR', 'kabag', 'POST', '/procurement/po', { prId: 'NOPE', vendor: 'x', totalCost: 1 }, [400, 404]);
await W('PR (forbidden)', 'bendahara', 'POST', '/procurement/pr', { item: 'x', quantity: 1, estimatedCost: 1 }, 403);
await W('manual journal', 'bendahara', 'POST', '/accounting/journals', { date: today, description: 'Koreksi', debit: { account: '5100', amount: 100000 }, credit: { account: '1000', amount: 100000 } }, 201);
await W('manual journal unbalanced', 'bendahara', 'POST', '/accounting/journals', { date: today, description: 'x', debit: { account: '5100', amount: 100 }, credit: { account: '1000', amount: 90 } }, 400);
await W('manual journal unknown account', 'bendahara', 'POST', '/accounting/journals', { date: today, description: 'x', debit: { account: '9999', amount: 100 }, credit: { account: '1000', amount: 100 } }, 400);
await W('manual journal zero amount', 'bendahara', 'POST', '/accounting/journals', { date: today, description: 'x', debit: { account: '5100', amount: 0 }, credit: { account: '1000', amount: 0 } }, 400);
await W('restricted receipt', 'bendahara', 'POST', '/accounting/restricted-funds/receipts', { date: today, fund: 'temporer', amount: 15_000_000, method: 'transfer', description: 'Donasi musala' }, 201);
await W('restricted release', 'bendahara', 'POST', '/accounting/restricted-funds/releases', { date: today, fund: 'temporer', amount: 5_000_000, description: 'Tahap 1' }, 201);
await W('journal (auditor read-only)', 'auditor', 'POST', '/accounting/journals', { date: today, description: 'x', debit: { account: '5100', amount: 1 }, credit: { account: '1000', amount: 1 } }, 403);
await W('notification send (no channel)', 'bendahara', 'POST', '/notifications/send', { message: 'x' }, 400);
// master CRUD
await W('update student', 'bendahara', 'PUT', `/master/students/${sid}`, { name: 'Siswa Final Edit', class: '7B' }, 200);
await W('update unknown student', 'bendahara', 'PUT', '/master/students/NOPE', { name: 'x' }, 404);
await W('student missing fields', 'bendahara', 'POST', '/master/students', {}, 400);
await W('update employee', 'bendahara', 'PUT', `/master/employees/${eid}`, { position: 'Guru Senior' }, 200);
await W('employee missing fields', 'bendahara', 'POST', '/master/employees', {}, 400);
await W('student (forbidden)', 'staff', 'POST', '/master/students', { name: 'x' }, 403);
const tmpS = await W('create student 2', 'admin', 'POST', '/master/students', { nis: 'F002', name: 'Siswa Hapus', class: '7A' }, 201);
await W('delete student', 'admin', 'DELETE', `/master/students/${tmpS?.id || tmpS?.student?.id}`, undefined, 200);
// users
const users = (await T('GET', '/master/users', { token: A })).data;
const staffUser = (users.data || users.users || users).find((u) => u.email === 'staff@final.test');
await W('update user (admin)', 'admin', 'PUT', `/master/users/${staffUser.id}`, { name: 'Staf Final' }, 200);
await W('role change (admin not allowed)', 'admin', 'PATCH', `/master/users/${staffUser.id}/role`, { role: 'kabag' }, 403);
await W('role invalid', 'super_admin', 'PATCH', `/master/users/${staffUser.id}/role`, { role: 'root' }, 400);
await W('duplicate user email', 'super_admin', 'POST', '/master/users', { name: 'dup', email: 'staff@final.test', password: 'Sementara-2026', role: 'staff' }, [400, 409]);
await W('weak password user', 'super_admin', 'POST', '/master/users', { name: 'weak', email: 'weak@final.test', password: '123', role: 'staff' }, 400);
await W('role-permissions update', 'super_admin', 'PATCH', '/master/role-permissions/staff', { permissions: ['dashboard', 'expenses', 'notifications'] }, 200);
await W('activity clear (forbidden)', 'bendahara', 'DELETE', '/activity/clear', undefined, 403);
await W('activity clear', 'admin', 'DELETE', '/activity/clear', undefined, 200);
await W('activity filter', 'admin', 'GET', '/activity?module=spp&search=Siswa&limit=10', undefined, 200);
// F-B probe: deactivated user keeps access?
const kab = (users.data || users.users || users).find((u) => u.email === 'kabag@final.test');
await W('deactivate kabag', 'super_admin', 'DELETE', `/master/users/${kab.id}`, undefined, 200);
expect('deactivated user token rejected', (await T('GET', '/dashboard/kpi', { token: tokens.kabag })).status, 401, '(JWT still valid after deactivation?)');
expect('deactivated user cannot log in', (await login('kabag@final.test', PW)).status, [401, 403]);
expect('wrong password', (await login('bendahara@final.test', 'salah')).status, 401);
expect('unknown route', (await T('GET', '/nope', { token: A })).status, 404);

// --- DB / ledger integrity
const isak = (await T('GET', `/accounting/reports/isak335?year=${YEAR}`, { token: A })).data;
const fp = isak.financialPosition;
const j = (await T('GET', '/accounting/journals', { token: A })).data.journals;
const bad = j.filter((x) => !(x.debit?.amount > 0) || x.debit.amount !== x.credit?.amount || !x.debit.account || !x.credit.account);
if (bad.length) findings.push(`ledger: ${bad.length} malformed journals ${JSON.stringify(bad[0]).slice(0, 200)}`);
const coa = (await T('GET', '/accounting/chart-of-accounts', { token: A })).data.accounts;
const unknown = j.filter((x) => !coa[x.debit.account] || !coa[x.credit.account]);
if (unknown.length) findings.push(`ledger: ${unknown.length} journals on unknown accounts e.g. ${JSON.stringify(unknown[0]).slice(0, 200)}`);
if (fp.totals.assets !== fp.totals.liabilitiesAndNetAssets) findings.push(`position unbalanced ${JSON.stringify(fp.totals)}`);
if (isak.cashFlows.closingCash !== fp.cash) findings.push(`cash flow closing ${isak.cashFlows.closingCash} != cash ${fp.cash}`);
if (isak.changesInNetAssets.total.closing !== fp.totals.netAssets) findings.push('changes in net assets do not reconcile');
const kpi = (await T('GET', '/dashboard/kpi', { token: A })).data;
const dumpNaN = JSON.stringify({ isak, kpi }).match(/NaN|null,"amount"|Infinity/);
if (dumpNaN) findings.push(`NaN/Infinity in reports: ${dumpNaN[0]}`);
console.log(JSON.stringify({ checks: log.length, passed: log.filter((x) => x.ok).length, journals: j.length, totals: fp.totals, kpi: { cash: kpi.cashBalance }, findings }, null, 1));
