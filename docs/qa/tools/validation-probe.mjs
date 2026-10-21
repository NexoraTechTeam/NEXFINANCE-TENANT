const B = 'http://127.0.0.1:5080/api/v1', H = 'almusabbihin-nexfinance.nexoratech.co';
const T = async (m, p, tok, body) => { const r = await fetch(B + p, { method: m, headers: { host: H, 'x-forwarded-host': H, 'content-type': 'application/json', authorization: `Bearer ${tok}` }, body: body ? JSON.stringify(body) : undefined }); return [r.status, (await r.text()).slice(0, 110)]; };
const login = async (u) => (await (await fetch(B + '/auth/login', { method: 'POST', headers: { host: H, 'x-forwarded-host': H, 'content-type': 'application/json' }, body: JSON.stringify({ email: u, password: 'Final-Review-2026!' }) })).json()).token;
const sa = await login('admin-almusabbihin'), ad = await login('admin@final.test'), be = await login('bendahara@final.test');
const users = JSON.parse((await (await fetch(B + '/master/users', { headers: { host: H, 'x-forwarded-host': H, authorization: `Bearer ${sa}` } })).text()));
const saId = (users.data || users.users || users).find((u) => u.username === 'admin-almusabbihin').id;
const out = {
  'SPP invoice negative amount': await T('POST', '/spp/invoices', be, { studentId: 'X', studentName: 'x', amount: -100, month: 'x' }),
  'SPP invoice text amount': await T('POST', '/spp/invoices', be, { studentId: 'X', studentName: 'x', amount: 'abc', month: 'x' }),
  'employee negative salary': await T('POST', '/master/employees', be, { name: 'x', position: 'x', baseSalary: -1 }),
  'PR negative cost': await T('POST', '/procurement/pr', sa, { item: 'x', quantity: -1, estimatedCost: -5 }),
  'journal invalid date': await T('POST', '/accounting/journals', be, { date: 'kemarin', description: 'x', debit: { account: '5100', amount: 1 }, credit: { account: '1000', amount: 1 } }),
  'opening balance invalid date': await T('POST', '/accounting/opening-balance', be, { date: 'x', entries: [{ account: '1000', amount: 1 }] }),
  'restricted receipt invalid date': await T('POST', '/accounting/restricted-funds/receipts', be, { date: '2026-13-45', fund: 'temporer', amount: 1, method: 'tunai', description: 'x' }),
  'admin edits super_admin name': await T('PUT', `/master/users/${saId}`, ad, { name: 'Diubah admin' }),
  'admin deactivates super_admin': await T('DELETE', `/master/users/${saId}`, ad),
  'activity negative limit': await T('GET', '/activity?limit=-5&offset=-3', sa),
  'isak335 weird year': await T('GET', '/accounting/reports/isak335?year=abc', sa),
};
for (const [k, [s, b]] of Object.entries(out)) console.log(String(s).padEnd(4), k.padEnd(34), b);
