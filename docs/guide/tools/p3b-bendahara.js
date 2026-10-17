const { launch, shot, routeHttps, modal, field, loginTenant, go } = require('./lib');
const INV = [['STU001', 'Ahmad Fauzan', '7A'], ['STU002', 'Aisyah Putri', '7A'], ['STU003', 'Muhammad Rizki', '7B']];
(async () => {
  const b = await launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await routeHttps(ctx);
  const p = await loginTenant(ctx, 'bendahara@al-musabbihin.sch.id', 'Sementara-2026', 'Bendahara-AlM-2026!');
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await shot(p, '22-bendahara-dashboard');
  await go(p, '/dashboard/spp');
  for (const [i, [id, name, kelas]] of INV.entries()) {
    await p.getByRole('button', { name: /Buat Invoice/ }).first().click(); const m = modal(p);
    await field(m, 'ID Siswa').fill(id); await field(m, 'Nama Siswa').fill(name); await field(m, 'Kelas').selectOption(kelas);
    await field(m, 'Jumlah SPP').fill('750000'); await field(m, 'Bulan').selectOption('Oktober 2026');
    if (i === 0) await shot(p, '23-bendahara-spp-create');
    await m.getByRole('button', { name: /Buat Invoice/ }).click(); await p.waitForTimeout(900);
  }
  for (let k = 0; k < 2; k += 1) {
    await p.locator('.spp-pay-btn').first().click(); await p.waitForTimeout(600); const m = modal(p);
    if (k === 0) { console.log('pay modal buttons:', (await m.locator('button').allInnerTexts()).join(' | ')); await shot(p, '24-bendahara-spp-pay'); }
    await m.getByRole('button', { name: /Konfirmasi|Bayar|Simpan|Lunas/ }).last().click(); await p.waitForTimeout(1000);
  }
  await shot(p, '25-bendahara-spp-list');
  await go(p, '/dashboard/payroll');
  await p.getByRole('button', { name: /Hitung Baru/ }).click(); await p.waitForTimeout(500);
  await p.locator('input[type=month]').fill('2026-10');
  await p.getByRole('button', { name: /^Hitung Gaji$/ }).last().click(); await p.waitForTimeout(1500);
  await shot(p, '26-bendahara-payroll-slip', { full: true });
  console.log('errors', errors);
  await b.close();
})().catch((e) => { console.error(e.message.split('\n')[0]); process.exit(1); });
