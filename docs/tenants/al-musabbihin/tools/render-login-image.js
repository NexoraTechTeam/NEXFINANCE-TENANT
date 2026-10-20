// Renders login-image.html to ../login.jpg (1920×1080). Needs playwright-core and a Chromium
// (CHROMIUM_PATH or /opt/pw-browsers/chromium), e.g. from docs/guide/tools: NODE_PATH=../../../guide/tools/node_modules
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

(async () => {
  const exe = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium'].find((p) => p && fs.existsSync(p));
  const browser = await chromium.launch({ executablePath: exe });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`file://${path.join(__dirname, 'login-image.html')}`, { waitUntil: 'networkidle' });
  const out = path.join(__dirname, '..', 'login.jpg');
  await page.screenshot({ path: out, type: 'jpeg', quality: 86 });
  await browser.close();
  console.log(`✅ ${out}`);
})().catch((e) => { console.error(e); process.exit(1); });
