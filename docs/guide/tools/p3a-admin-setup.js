const { launch, shot, routeHttps, modal, field, loginTenant, go } = require('./lib');
const USERS = [
  ['Siti Rahmawati', 'bendahara@al-musabbihin.sch.id', 'bendahara'],
  ['Hendra Gunawan', 'kabag@al-musabbihin.sch.id', 'kabag'],
  ['Rina Marlina', 'staff@al-musabbihin.sch.id', 'staff'],
  ['Dewi Kusuma', 'auditor@al-musabbihin.sch.id', 'auditor'],
];
const STUDENTS = [['2026001', '7A', 'Ahmad Fauzan', 'Bpk. Fauzi'], ['2026002', '7A', 'Aisyah Putri', 'Ibu Laila'], ['2026003', '7B', 'Muhammad Rizki', 'Bpk. Hasan']];
const EMPLOYEES = [['198501012010', 'Guru', 'Ust. Abdul Karim', 'Akademik', 4500000, 1500000, 500000], ['199002022015', 'Staf Tata Usaha', 'Nurul Hidayah', 'Administrasi', 3500000, 0, 300000]];
(async () => {
  const b = await launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await routeHttps(ctx);
  const p = await loginTenant(ctx, 'admin-almusabbihin', 'AlMusabbihin-2026!');
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  // Opening balance
  await go(p, '/dashboard/accounting');
  await p.getByRole('button', { name: /Saldo Awal/ }).click();
  await p.locator('#ob-date').fill('2026-07-01');
  for (const [acc, v] of [['1000', '25000000'], ['1100', '175000000'], ['1300', '5000000'], ['1500', '1200000000'], ['2000', '10000000']]) await p.fill(`#ob-${acc}`, v);
  await shot(p, '15-admin-opening-balance');
  await p.getByRole('button', { name: /Simpan saldo awal/ }).click(); await p.waitForTimeout(1500);
  // Users per role
  await go(p, '/dashboard/master/access');
  for (const [i, [name, email, role]] of USERS.entries()) {
    await p.getByRole('button', { name: /Tambah user/ }).click(); const m = modal(p);
    await field(m, 'Nama').fill(name); await field(m, 'Email').fill(email); await field(m, 'Password awal').fill('Sementara-2026');
    await field(m, 'Role').selectOption(role);
    if (i === 0) await shot(p, '16-admin-add-user');
    await m.getByRole('button', { name: 'Simpan' }).click(); await p.waitForTimeout(900);
  }
  await shot(p, '17-admin-users-roles', { full: true });
  // Students
  await go(p, '/dashboard/master/students');
  for (const [i, [nis, kelas, nama, wali]] of STUDENTS.entries()) {
    await p.getByRole('button', { name: /Tambah Siswa/ }).click(); const m = modal(p);
    await field(m, 'NIS').fill(nis); await field(m, 'Kelas').selectOption(kelas); await field(m, 'Nama Siswa').fill(nama); await field(m, 'Nama Wali').fill(wali);
    await field(m, 'No. HP').fill('08123456789' + i);
    if (i === 0) await shot(p, '18-admin-add-student');
    await m.getByRole('button', { name: 'Simpan' }).click(); await p.waitForTimeout(900);
  }
  await shot(p, '19-admin-students');
  // Employees
  await go(p, '/dashboard/master/employees');
  for (const [i, [nip, jab, nama, dept, gp, ts, tk]] of EMPLOYEES.entries()) {
    await p.getByRole('button', { name: /Tambah Karyawan/ }).click(); const m = modal(p);
    await field(m, 'NIP').fill(nip); await field(m, 'Jabatan').selectOption(jab); await field(m, 'Nama Karyawan').fill(nama); await field(m, 'Departemen').fill(dept);
    await field(m, 'Gaji Pokok').fill(String(gp)); await field(m, 'Tunjangan Sertifikasi').fill(String(ts)); await field(m, 'Tunjangan Keluarga').fill(String(tk));
    if (i === 0) await shot(p, '20-admin-add-employee');
    await m.getByRole('button', { name: 'Simpan' }).click(); await p.waitForTimeout(900);
  }
  await shot(p, '21-admin-employees');
  console.log('errors', errors);
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
