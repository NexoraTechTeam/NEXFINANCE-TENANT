const { chromium } = require('playwright-core');
(async () => {
  const [html, out, plain] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + html, { waitUntil: 'networkidle' });
  await p.pdf({ path: out, format: 'A4', printBackground: true, displayHeaderFooter: !plain,
    headerTemplate: '<div style="font-size:7px;width:100%;padding:0 15mm;color:#8a97a8;font-family:Inter,sans-serif;display:flex;justify-content:space-between"><span>NexFinance — Panduan Pengguna</span><span>SIT Al Musabbihin</span></div>',
    footerTemplate: '<div style="font-size:7px;width:100%;padding:0 15mm;color:#8a97a8;font-family:Inter,sans-serif;display:flex;justify-content:space-between"><span>Nexora · nexoratech.co</span><span>Halaman <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
    preferCSSPageSize: true });
  await b.close();
})();
