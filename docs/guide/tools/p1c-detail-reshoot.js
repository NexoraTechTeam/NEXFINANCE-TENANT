const { launch, shot, local, CONSOLE, routeHttps } = require('./lib');
(async () => {
  const b = await launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await routeHttps(ctx);
  const p = await ctx.newPage();
  await p.goto(local(CONSOLE, '/console'));
  await p.fill('#console-email', 'ops@nexoratech.co'); await p.fill('#console-password', 'Console-Docs-2026'); await p.click('button[type=submit]');
  await p.getByRole('heading', { name: 'Sekolah (tenant)' }).waitFor();
  await p.getByText('Sekolah Islam Terpadu Al Musabbihin').first().click(); await p.locator('#td-name').waitFor(); await p.waitForTimeout(1200);
  await shot(p, '07-console-tenant-detail', { full: true });
  await p.fill('#td-reset', 'bendahara@al-musabbihin.sch.id'); await p.locator('#td-reset').evaluate((e) => e.blur());
  await shot(p, '09-console-reset-password-form');
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
