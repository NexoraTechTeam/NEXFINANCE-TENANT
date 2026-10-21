const { chromium } = require('playwright-core');
const fs = require('fs');
const OUT = process.argv[2];
const BASE = 'http://almusabbihin-nexfinance.nexoratech.co:3060';
const PW = 'Final-Review-2026!';
const ROLES = [
  ['super_admin', 'admin-almusabbihin', PW], ['admin', 'admin@final.test', PW], ['bendahara', 'bendahara@final.test', PW],
  ['kabag', 'kabag2@final.test', 'Sementara-2026'], ['staff', 'staff@final.test', PW], ['auditor', 'auditor@final.test', PW],
];
const PAGES = ['/dashboard', '/dashboard/spp', '/dashboard/payroll', '/dashboard/expenses', '/dashboard/procurement', '/dashboard/accounting',
  '/dashboard/reports', '/dashboard/activity-logs', '/dashboard/master/students', '/dashboard/master/employees', '/dashboard/master/access', '/dashboard/help'];
const report = {};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--host-resolver-rules=MAP *.nexoratech.co 127.0.0.1'] });
  for (const [role, user, pass] of ROLES) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    const p = await ctx.newPage();
    const r = report[role] = { pages: {}, menu: [], forced: null };
    let cur = 'login';
    const add = (k, v) => { (r.pages[cur] ||= { pageerror: [], console: [], http: [] })[k].push(v); };
    p.on('pageerror', (e) => add('pageerror', e.message.slice(0, 200)));
    p.on('console', (m) => { if (m.type() === 'error') add('console', m.text().slice(0, 200)); });
    p.on('response', (res) => { if (res.status() >= 400 && res.url().includes('/api/')) add('http', `${res.status()} ${res.request().method()} ${res.url().replace(BASE, '')}`); });
    await p.goto(`${BASE}/login`); await p.fill('#email', user); await p.fill('#password', pass); await p.click('button[type=submit]');
    await p.waitForURL('**/dashboard', { timeout: 20000 }); await p.waitForTimeout(1500);
    const dlg = p.getByRole('dialog', { name: /Ganti password sementara/ });
    if (await dlg.count()) {
      r.forced = 'shown';
      await p.screenshot({ path: `${OUT}/${role}-forced.png` });
      await p.fill('#fpc-currentPassword', pass); await p.fill('#fpc-newPassword', PW); await p.fill('#fpc-confirmPassword', PW);
      await p.getByRole('button', { name: /Simpan password/ }).click(); await dlg.waitFor({ state: 'detached' }); r.forced = 'changed';
    }
    const later = async () => { const l = p.getByRole('button', { name: 'Nanti saja' }); if (await l.count()) await l.first().click().catch(() => {}); };
    await later();
    r.menu = await p.locator('aside .nav-link').allInnerTexts().then((a) => a.map((t) => t.trim().split('\n')[0]).filter(Boolean));
    for (const path of PAGES) {
      cur = path;
      r.pages[cur] = { pageerror: [], console: [], http: [] };
      await p.goto(BASE + path); await p.waitForTimeout(1800); await later();
      const info = r.pages[cur];
      info.h1 = (await p.locator('h1').first().textContent().catch(() => '')).trim().slice(0, 60);
      info.text = (await p.locator('main').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 160);
      info.overflowPx = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      // every tab
      const tabs = p.locator('.tab-bar button, [role=tab]');
      const n = await tabs.count(); info.tabs = [];
      for (let i = 0; i < n; i += 1) { const t = tabs.nth(i); const label = (await t.innerText()).trim(); info.tabs.push(label); await t.click().catch(() => {}); await p.waitForTimeout(500); }
      // open (and close) every "create" style dialog
      const opener = p.locator('main button').filter({ hasText: /^(\+\s*)?(Tambah|Buat|Ajukan|Saldo Awal|Generate|Proses|Hitung)/ });
      const m = await opener.count(); info.modals = [];
      for (let i = 0; i < Math.min(m, 4); i += 1) {
        const btn = opener.nth(i); const label = (await btn.innerText()).trim().slice(0, 30);
        if (!(await btn.isVisible())) continue;
        await btn.click().catch(() => {}); await p.waitForTimeout(500);
        const open = await p.locator('.modal-overlay, [role=dialog]').count();
        info.modals.push(`${label}:${open ? 'open' : 'none'}`);
        await p.keyboard.press('Escape'); const cancel = p.getByRole('button', { name: /^Batal$/ }); if (await cancel.count()) await cancel.first().click().catch(() => {});
        await p.waitForTimeout(300);
      }
      if (path === '/dashboard/expenses') info.approveButtons = await p.locator('button[title="Setujui"]').count();
      info.denied = await p.getByRole('heading', { name: /Akses tidak tersedia/ }).count() > 0;
      await p.screenshot({ path: `${OUT}/${role}${path.replace(/\//g, '_')}.png`, fullPage: false });
    }
    // mobile pass for overflow
    await p.setViewportSize({ width: 390, height: 844 });
    r.mobileOverflow = {}; cur = 'mobile-pass'; r.pages[cur] = { pageerror: [], console: [], http: [] };
    for (const path of PAGES) { await p.goto(BASE + path); await p.waitForTimeout(900); r.mobileOverflow[path] = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); }
    await ctx.close();
  }
  fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
  await b.close();
})().catch((e) => { console.error(e); fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1)); process.exit(1); });
