const fs = require('fs');
const { launch, shot, local, TENANT, OUT, routeHttps, dismissTour } = require('./lib');
const NEWPASS = 'AlMusabbihin-2026!';
(async () => {
  const b = await launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await routeHttps(ctx);
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const temp = fs.readFileSync(`${OUT}/.temp-pass`, 'utf8').trim();
  await p.goto(local(TENANT, '/login')); await p.locator('#email').waitFor(); await p.waitForTimeout(800);
  await shot(p, '10-tenant-login');
  await p.fill('#email', 'admin-almusabbihin'); await p.fill('#password', temp); await p.click('button[type=submit]');
  await p.waitForURL('**/dashboard');
  await p.getByRole('dialog', { name: /Ganti password sementara/ }).waitFor();
  await shot(p, '11-tenant-force-password');
  await p.fill('#fpc-currentPassword', temp); await p.fill('#fpc-newPassword', NEWPASS); await p.fill('#fpc-confirmPassword', NEWPASS);
  await p.getByRole('button', { name: /Simpan password/ }).click();
  await p.getByRole('dialog', { name: /Ganti password sementara/ }).waitFor({ state: 'detached' });
  await p.waitForTimeout(800);
  if (await p.getByRole('button', { name: 'Nanti saja' }).count()) await shot(p, '12-tenant-onboarding-welcome');
  const start = p.getByRole('button', { name: /Mulai tur/ });
  if (await start.count()) { await start.click(); await p.waitForTimeout(900); await shot(p, '13-tenant-tour-step');
    const skip = p.getByRole('button', { name: /Lewati|Tutup|Selesai/ }).first(); if (await skip.count()) await skip.click(); }
  await dismissTour(p); await p.waitForTimeout(800);
  await shot(p, '14-tenant-dashboard-empty');
  for (const [name, path] of [['x-students', '/dashboard/master/students'], ['x-employees', '/dashboard/master/employees'], ['x-access', '/dashboard/master/access'],
    ['x-spp', '/dashboard/spp'], ['x-payroll', '/dashboard/payroll'], ['x-expenses', '/dashboard/expenses'], ['x-procurement', '/dashboard/procurement'],
    ['x-accounting', '/dashboard/accounting'], ['x-reports', '/dashboard/reports'], ['x-activity', '/dashboard/activity-logs'], ['x-help', '/dashboard/help']]) {
    await p.goto(local(TENANT, path)); await p.waitForTimeout(1800); await dismissTour(p); await shot(p, name, { full: true });
  }
  console.log('errors', errors);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
