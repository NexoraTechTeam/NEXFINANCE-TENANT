const fs = require('fs');
const { chromium } = require('playwright-core');
const OUT = process.env.OUT;
const PORT = 3060;
const CONSOLE = 'console.nexfinance.nexoratech.co';
const TENANT = 'al-musabbihin.nexfinance.nexoratech.co';
const manifestPath = `${OUT}/manifest.json`;
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath)) : {};
const local = (host, path = '/') => `http://${host}:${PORT}${path}`;
async function launch() {
  return chromium.launch({ args: [`--host-resolver-rules=MAP *.nexoratech.co 127.0.0.1`] });
}
async function shot(page, name, { full = false, mask = [] } = {}) {
  await page.waitForTimeout(500);
  const u = new URL(page.url());
  const displayUrl = `https://${u.hostname}${u.pathname}${u.search}`;
  for (const sel of mask) await page.locator(sel).evaluateAll((els) => els.forEach((e) => { e.style.filter = 'blur(5px)'; }));
  const vp = page.viewportSize();
  if (full) {
    const h = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
    await page.setViewportSize({ width: vp.width, height: Math.min(Math.max(h, vp.height), 2600) }); await page.waitForTimeout(400);
  }
  await page.screenshot({ path: `${OUT}/${name}.png` });
  if (full) await page.setViewportSize(vp);
  manifest[name] = { url: displayUrl, w: page.viewportSize().width };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('📸', name, displayUrl);
}
async function dismissTour(page) {
  const later = page.getByRole('button', { name: 'Nanti saja' });
  if (await later.count()) { await later.click(); await page.waitForTimeout(300); }
}
module.exports = { launch, shot, local, CONSOLE, TENANT, OUT, dismissTour };
// Serve https://<host>/... (used by console logo previews) from the local dev server.
async function routeHttps(ctx) {
  await ctx.route(/^https:\/\/[^/]*nexoratech\.co\//, async (route) => {
    const u = new URL(route.request().url());
    const resp = await route.fetch({ url: `http://127.0.0.1:3060${u.pathname}${u.search}`, headers: { ...route.request().headers(), host: u.hostname } });
    await route.fulfill({ response: resp });
  });
}
module.exports.routeHttps = routeHttps;
const modal = (p) => p.locator('.modal-box, [role=dialog], .modal').last();
const field = (scope, label) => scope.locator(`xpath=(.//label[starts-with(normalize-space(.), "${label}")])[1]`).locator('xpath=(./descendant::input | ./descendant::select | ./descendant::textarea | ./following::input | ./following::select | ./following::textarea)[1]');
async function loginTenant(ctx, user, pass, newPass) {
  const p = await ctx.newPage();
  await p.goto(local(TENANT, '/login')); await p.locator('#email').waitFor();
  await p.fill('#email', user); await p.fill('#password', pass); await p.click('button[type=submit]');
  await p.waitForURL('**/dashboard'); await p.waitForTimeout(900);
  const dlg = p.getByRole('dialog', { name: /Ganti password sementara/ });
  if (await dlg.count()) {
    await p.fill('#fpc-currentPassword', pass); await p.fill('#fpc-newPassword', newPass); await p.fill('#fpc-confirmPassword', newPass);
    await p.getByRole('button', { name: /Simpan password/ }).click(); await dlg.waitFor({ state: 'detached' });
  }
  await dismissTour(p);
  return p;
}
async function go(p, path) { await p.goto(local(TENANT, path)); await p.waitForTimeout(1500); await dismissTour(p); }
Object.assign(module.exports, { modal, field, loginTenant, go });
