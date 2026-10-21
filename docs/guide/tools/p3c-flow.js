const fs = require('fs');
const { launch, shot, routeHttps, modal, field, loginTenant, go, OUT } = require('./lib');
(async () => {
  const b = await launch(); const errors = [];
  const ctxFor = async () => { const c = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }); await routeHttps(c); return c; };
  // C. Staf: first login (forced change) + submit expenses
  const sc = await ctxFor(); const sp = await sc.newPage();
  await sp.goto(require('./lib').local(require('./lib').TENANT, '/login')); await sp.fill('#email', 'staff@al-musabbihin.sch.id'); await sp.fill('#password', 'Sementara-2026'); await sp.click('button[type=submit]');
  await sp.waitForURL('**/dashboard'); await sp.getByRole('dialog', { name: /Ganti password sementara/ }).waitFor(); await shot(sp, '27-staff-first-login-force');
  await sp.close();
  const s = await loginTenant(sc, 'staff@al-musabbihin.sch.id', 'Sementara-2026', 'Staf-AlM-2026!'); s.on('pageerror', (e) => errors.push(e.message));
  await shot(s, '28-staff-dashboard');
  await go(s, '/dashboard/expenses');
  for (const [i, [t, amt, cat, note]] of [['Pembelian ATK semester ganjil', '750000', 'ATK & Supplies', 'Kertas, spidol, map'], ['Konsumsi rapat komite', '1200000', 'Konsumsi', 'Rapat komite sekolah Oktober']].entries()) {
    await s.getByRole('button', { name: /Ajukan Pengeluaran/ }).click(); const m = modal(s);
    await field(m, 'Judul Pengeluaran').fill(t); await field(m, 'Jumlah').fill(amt); await field(m, 'Kategori').selectOption(cat); await field(m, 'Keterangan').fill(note);
    if (i === 0) await shot(s, '29-staff-expense-submit');
    await m.getByRole('button', { name: /^Ajukan$/ }).click(); await s.waitForTimeout(900);
  }
  await shot(s, '30-staff-expenses-pending');
  // D. Kabag: approve (1st) + PR → PO → receive
  const kc = await ctxFor(); const k = await loginTenant(kc, 'kabag@al-musabbihin.sch.id', 'Sementara-2026', 'Kabag-AlM-2026!'); k.on('pageerror', (e) => errors.push(e.message));
  await shot(k, '31-kabag-dashboard');
  await go(k, '/dashboard/expenses');
  await shot(k, '32-kabag-expense-approve');
  await k.locator('button[title="Setujui"]').nth(0).click(); await k.waitForTimeout(700);
  await shot(k, '32b-kabag-approval-1of2');
  await k.waitForTimeout(2600);
  await k.locator('button[title="Setujui"]').nth(0).click(); await k.waitForTimeout(700);
  await shot(k, '32c-kabag-dual-control-blocked');
  await k.waitForTimeout(2600);
  await k.locator('button[title="Setujui"]').nth(1).click(); await k.waitForTimeout(900);
  await go(k, '/dashboard/procurement');
  await k.getByRole('button', { name: /Buat PR/ }).first().click(); let m = modal(k);
  await field(m, 'Nama Item').fill('Kertas A4 80gr (rim)'); await field(m, 'Estimasi Biaya').fill('2250000'); await field(m, 'Jumlah').fill('50'); await field(m, 'Alasan Pengadaan').fill('Kebutuhan ujian tengah semester');
  await shot(k, '33-kabag-pr-create');
  await m.getByRole('button', { name: /Buat PR/ }).click(); await k.waitForTimeout(900);
  await shot(k, '33b-kabag-pr-list');
  const prId = (await k.locator('text=/PR\\d+/').first().textContent()).match(/PR\d+/)[0];
  await k.getByRole('button', { name: /Purchase Order \(PO\)/ }).click(); await k.waitForTimeout(400);
  await k.getByRole('button', { name: /Buat PO/ }).first().click(); m = modal(k);
  await field(m, 'ID Purchase Request').fill(prId); await field(m, 'Nama Vendor').fill('CV Sumber Ilmu Bandung'); await field(m, 'Total Biaya').fill('2150000');
  await shot(k, '34-kabag-po-create');
  await m.getByRole('button', { name: /Buat PO/ }).click(); await k.waitForTimeout(900);
  await k.getByRole('button', { name: /Terima Barang/ }).first().click(); await k.waitForTimeout(1200);
  await shot(k, '35-kabag-po-received');
  // E. Bendahara: 2nd approval, journals, reports + PDF
  const bc = await ctxFor(); const bp = await loginTenant(bc, 'bendahara@al-musabbihin.sch.id', 'Bendahara-AlM-2026!'); bp.on('pageerror', (e) => errors.push(e.message));
  await go(bp, '/dashboard/expenses');
  for (let i = 0; i < 2; i += 1) { await bp.locator('button[title="Setujui"]').first().click(); await bp.waitForTimeout(900); }
  await shot(bp, '36-bendahara-expenses-approved');
  await go(bp, '/dashboard/accounting'); await shot(bp, '37-bendahara-journals', { full: true });
  // Restricted funds (ISAK 335): two receipts, one release, one refused overdraw
  await bp.getByRole('button', { name: 'Dana Terikat', exact: true }).click(); await bp.waitForTimeout(800);
  const rec = bp.getByRole('form', { name: 'Terima dana terikat' });
  const receive = async (fund, amount, method, note, snap) => {
    await rec.getByLabel('Jenis dana').selectOption(fund); await rec.getByLabel('Jumlah (Rp)').fill(amount);
    await rec.getByLabel('Diterima ke').selectOption(method); await rec.getByLabel('Keterangan').fill(note);
    if (snap) { await rec.scrollIntoViewIfNeeded(); await shot(bp, snap); }
    await rec.getByRole('button', { name: 'Simpan penerimaan' }).click(); await bp.getByText('Penerimaan dana terikat tersimpan.').waitFor();
  };
  await receive('temporer', '15000000', 'transfer', 'Donasi komite untuk renovasi musala', '37b-bendahara-dana-terikat-terima');
  await receive('permanen', '25000000', 'transfer', 'Wakaf tunai pembangunan ruang kelas');
  const rel = bp.getByRole('form', { name: 'Lepaskan pembatasan' });
  await rel.getByLabel('Jumlah (Rp)').fill('20000000'); await rel.getByLabel('Keterangan').fill('Renovasi musala');
  await rel.getByRole('button', { name: 'Lepaskan pembatasan' }).click(); await bp.getByText(/Melebihi saldo dana terikat/).waitFor();
  await bp.getByText(/Melebihi saldo dana terikat/).scrollIntoViewIfNeeded(); await shot(bp, '37c-bendahara-dana-terikat-melebihi');
  await rel.getByLabel('Jumlah (Rp)').fill('6000000'); await rel.getByLabel('Keterangan').fill('Renovasi musala tahap 1 selesai');
  await rel.getByRole('button', { name: 'Lepaskan pembatasan' }).click(); await bp.getByText('Pembatasan dilepaskan.').waitFor();
  await shot(bp, '37d-bendahara-dana-terikat-saldo', { full: true });
  // ISAK 335 reports: every statement + notes
  await go(bp, '/dashboard/reports'); await bp.waitForTimeout(1500); await shot(bp, '38-bendahara-report-position', { full: true });
  for (const [tab, name] of [['Penghasilan Komprehensif', '39-bendahara-report-income'], ['Perubahan Aset Neto', '39b-bendahara-report-netassets'],
    ['Arus Kas', '39c-bendahara-report-cashflow'], ['Catatan (CALK)', '39d-bendahara-report-notes']]) {
    await bp.getByRole('button', { name: tab, exact: true }).click(); await bp.waitForTimeout(700); await shot(bp, name, { full: true });
  }
  const [dl] = await Promise.all([bp.waitForEvent('download'), bp.locator('button.rpt-action-btn').click()]);
  await dl.saveAs(`${OUT}/laporan.pdf`); console.log('pdf', dl.suggestedFilename());
  // F. Auditor
  const ac = await ctxFor(); const au = await loginTenant(ac, 'auditor@al-musabbihin.sch.id', 'Sementara-2026', 'Auditor-AlM-2026!'); au.on('pageerror', (e) => errors.push(e.message));
  await shot(au, '40-auditor-dashboard');
  await go(au, '/dashboard/reports'); await shot(au, '41-auditor-reports');
  await go(au, '/dashboard/accounting'); await au.getByRole('button', { name: 'Dana Terikat', exact: true }).click(); await au.waitForTimeout(800);
  await shot(au, '41b-auditor-dana-terikat-readonly');
  // G. Admin: dashboard after, activity log, help, mobile
  const dc = await ctxFor(); const ad = await loginTenant(dc, 'admin-almusabbihin', 'AlMusabbihin-2026!'); ad.on('pageerror', (e) => errors.push(e.message));
  await ad.waitForTimeout(1500); await shot(ad, '42-admin-dashboard-live', { full: true });
  await go(ad, '/dashboard/activity-logs'); await shot(ad, '43-admin-activity-log');
  await go(ad, '/dashboard/help'); await shot(ad, '44-help-center');
  const mc = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true }); await routeHttps(mc);
  const mp = await mc.newPage(); await mp.goto(require('./lib').local(require('./lib').TENANT, '/login')); await mp.waitForTimeout(1200); await shot(mp, '45-mobile-login');
  await mp.fill('#email', 'admin-almusabbihin'); await mp.fill('#password', 'AlMusabbihin-2026!'); await mp.click('button[type=submit]'); await mp.waitForURL('**/dashboard');
  await mp.waitForTimeout(1500); const later = mp.getByRole('button', { name: 'Nanti saja' }); if (await later.count()) await later.click();
  await mp.waitForTimeout(800); await shot(mp, '46-mobile-dashboard');
  console.log('errors', errors);
  await b.close();
})().catch((e) => { console.error(e.message.split('\n').slice(0, 3).join(' ')); process.exit(1); });
