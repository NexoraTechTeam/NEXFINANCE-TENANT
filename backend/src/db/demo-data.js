// Demo dataset (originally the in-memory store of single-tenant NexFinance).
// Only seeded into tenants provisioned with `seedDemo: true` (e.g. the sales demo tenant).

const m = (mo, d) => { const dt = new Date(2026, mo - 1, d); return dt.toISOString().split('T')[0]; };

// ── SPP ─────────────────────────────────────────────────────────────────────
const sppInvoices = [
  { id: 'INV001', studentId: 'STU001', studentName: 'Ahmad Pratama',    class: '7A', amount: 1200000, month: 'Januari 2026',  status: 'paid',   dueDate: m(1,10), paidAt: m(1,8),  paymentMethod: 'Transfer' },
  { id: 'INV002', studentId: 'STU002', studentName: 'Siti Rahayu',      class: '7A', amount: 1200000, month: 'Januari 2026',  status: 'paid',   dueDate: m(1,10), paidAt: m(1,9),  paymentMethod: 'Tunai' },
  { id: 'INV003', studentId: 'STU003', studentName: 'Budi Santoso',     class: '7B', amount: 1200000, month: 'Januari 2026',  status: 'paid',   dueDate: m(1,10), paidAt: m(1,7),  paymentMethod: 'Transfer' },
  { id: 'INV004', studentId: 'STU004', studentName: 'Dewi Lestari',     class: '8A', amount: 1300000, month: 'Februari 2026', status: 'paid',   dueDate: m(2,10), paidAt: m(2,8),  paymentMethod: 'Transfer' },
  { id: 'INV005', studentId: 'STU005', studentName: 'Eko Prasetyo',     class: '8A', amount: 1300000, month: 'Februari 2026', status: 'unpaid', dueDate: m(2,10) },
  { id: 'INV006', studentId: 'STU006', studentName: 'Fitri Handayani',  class: '8B', amount: 1300000, month: 'Maret 2026',    status: 'paid',   dueDate: m(3,10), paidAt: m(3,9),  paymentMethod: 'Transfer' },
  { id: 'INV007', studentId: 'STU007', studentName: 'Galang Ramadhan',  class: '9A', amount: 1400000, month: 'Maret 2026',    status: 'unpaid', dueDate: m(3,10) },
  { id: 'INV008', studentId: 'STU008', studentName: 'Hana Safitri',     class: '9A', amount: 1400000, month: 'April 2026',    status: 'paid',   dueDate: m(4,10), paidAt: m(4,7),  paymentMethod: 'Tunai' },
  { id: 'INV009', studentId: 'STU009', studentName: 'Irfan Maulana',    class: '9B', amount: 1400000, month: 'April 2026',    status: 'unpaid', dueDate: m(4,10) },
  { id: 'INV010', studentId: 'STU010', studentName: 'Juwita Sari',      class: '7B', amount: 1200000, month: 'Mei 2026',      status: 'paid',   dueDate: m(5,10), paidAt: m(5,5),  paymentMethod: 'Transfer' },
  { id: 'INV011', studentId: 'STU011', studentName: 'Kevin Hidayat',    class: '8A', amount: 1300000, month: 'Mei 2026',      status: 'unpaid', dueDate: m(5,10) },
  { id: 'INV012', studentId: 'STU012', studentName: 'Laila Nurhaliza',  class: '9A', amount: 1400000, month: 'Mei 2026',      status: 'paid',   dueDate: m(5,10), paidAt: m(5,8),  paymentMethod: 'Transfer' },
];

// ── Employees ────────────────────────────────────────────────────────────────
const employees = [
  { id: 'EMP001', name: 'Budi Santoso',      position: 'Guru Matematika',   baseSalary: 4500000, certificationAllowance: 4500000, familyAllowance: 300000, status: 'active' },
  { id: 'EMP002', name: 'Sari Dewi',         position: 'Guru Bahasa Indonesia', baseSalary: 4000000, certificationAllowance: 4000000, familyAllowance: 250000, status: 'active' },
  { id: 'EMP003', name: 'Ahmad Fauzi',       position: 'Kepala Sekolah',    baseSalary: 7000000, certificationAllowance: 7000000, familyAllowance: 500000, status: 'active' },
  { id: 'EMP004', name: 'Nurul Hidayah',     position: 'Guru IPA',          baseSalary: 4000000, certificationAllowance: 4000000, familyAllowance: 200000, status: 'active' },
  { id: 'EMP005', name: 'Hendra Wijaya',     position: 'Guru Agama',        baseSalary: 4200000, certificationAllowance: 4200000, familyAllowance: 350000, status: 'active' },
  { id: 'EMP006', name: 'Rina Melati',       position: 'Tata Usaha',        baseSalary: 3000000, certificationAllowance: 0,       familyAllowance: 150000, status: 'active' },
  { id: 'EMP007', name: 'Doni Prasetya',     position: 'Penjaga Sekolah',   baseSalary: 2500000, certificationAllowance: 0,       familyAllowance: 100000, status: 'active' },
];

// ── Payroll History ──────────────────────────────────────────────────────────
const { calcPayroll } = require('../services/payroll');
const payrollRuns = [
  calcPayroll(employees[0], 'Maret 2026'),
  calcPayroll(employees[1], 'Maret 2026'),
  calcPayroll(employees[2], 'Maret 2026'),
  calcPayroll(employees[0], 'April 2026'),
  calcPayroll(employees[1], 'April 2026'),
  calcPayroll(employees[2], 'April 2026'),
  calcPayroll(employees[3], 'April 2026'),
];

// ── Expenses ─────────────────────────────────────────────────────────────────
const expenses = [
  { id: 'EXP001', description: 'Pembelian ATK bulanan — kertas HVS, toner, spidol', amount: 2500000, category: 'ATK & Supplies', status: 'approved', submittedBy: 'admin@nexfinance.com', submittedAt: m(4,5), approvals: [{ approver: 'kabag@nexfinance.com', approvedAt: m(4,6) }, { approver: 'bendahara@nexfinance.com', approvedAt: m(4,7) }] },
  { id: 'EXP002', description: 'Biaya listrik dan internet April 2026', amount: 3200000, category: 'Utilitas', status: 'approved', submittedBy: 'admin@nexfinance.com', submittedAt: m(4,10), approvals: [{ approver: 'kabag@nexfinance.com', approvedAt: m(4,11) }, { approver: 'bendahara@nexfinance.com', approvedAt: m(4,12) }] },
  { id: 'EXP003', description: 'Konsumsi rapat koordinasi guru', amount: 850000, category: 'Konsumsi', status: 'approved', submittedBy: 'admin@nexfinance.com', submittedAt: m(4,15), approvals: [{ approver: 'kabag@nexfinance.com', approvedAt: m(4,16) }, { approver: 'bendahara@nexfinance.com', approvedAt: m(4,17) }] },
  { id: 'EXP004', description: 'Perbaikan AC ruang kelas 8A', amount: 1500000, category: 'Pemeliharaan', status: 'pending', submittedBy: 'admin@nexfinance.com', submittedAt: m(5,2), approvals: [] },
  { id: 'EXP005', description: 'Transportasi kunjungan studi banding', amount: 4500000, category: 'Transportasi', status: 'pending', submittedBy: 'admin@nexfinance.com', submittedAt: m(5,3), approvals: [{ approver: 'kabag@nexfinance.com', approvedAt: m(5,4) }] },
  { id: 'EXP006', description: 'Pembelian buku referensi perpustakaan', amount: 3750000, category: 'ATK & Supplies', status: 'approved', submittedBy: 'admin@nexfinance.com', submittedAt: m(5,1), approvals: [{ approver: 'kabag@nexfinance.com', approvedAt: m(5,2) }, { approver: 'bendahara@nexfinance.com', approvedAt: m(5,3) }] },
  { id: 'EXP007', description: 'Biaya kebersihan dan sanitasi rutin', amount: 600000, category: 'Operasional', status: 'rejected', submittedBy: 'admin@nexfinance.com', submittedAt: m(4,20), approvals: [], rejectedAt: m(4,21), rejectedReason: 'Sudah tercover anggaran bulanan' },
  { id: 'EXP008', description: 'Pengadaan seragam staf tata usaha', amount: 2100000, category: 'Operasional', status: 'pending', submittedBy: 'admin@nexfinance.com', submittedAt: m(5,7), approvals: [] },
];

// ── Procurement ──────────────────────────────────────────────────────────────
const purchaseRequests = [
  { id: 'PR20260401', description: 'Pengadaan meja dan kursi siswa kelas 9', quantity: 40, estimatedCost: 24000000, urgency: 'normal', status: 'approved', createdBy: 'admin@nexfinance.com', createdAt: m(4,1) },
  { id: 'PR20260402', description: 'Proyektor LCD untuk ruang multimedia', quantity: 2, estimatedCost: 16000000, urgency: 'normal', status: 'approved', createdBy: 'admin@nexfinance.com', createdAt: m(4,5) },
  { id: 'PR20260501', description: 'Pembelian laptop guru untuk e-learning', quantity: 5, estimatedCost: 35000000, urgency: 'urgent', status: 'pending', createdBy: 'admin@nexfinance.com', createdAt: m(5,3) },
  { id: 'PR20260502', description: 'Papan tulis whiteboard kelas baru', quantity: 8, estimatedCost: 4800000, urgency: 'normal', status: 'pending', createdBy: 'admin@nexfinance.com', createdAt: m(5,5) },
  { id: 'PR20260503', description: 'Sound system aula serbaguna', quantity: 1, estimatedCost: 18500000, urgency: 'normal', status: 'pending', createdBy: 'admin@nexfinance.com', createdAt: m(5,7) },
];

const purchaseOrders = [
  { id: 'PO20260401', prId: 'PR20260401', vendor: 'CV Mebel Jaya Abadi', totalAmount: 23500000, status: 'received', createdAt: m(4,3), receivedAt: m(4,15) },
  { id: 'PO20260402', prId: 'PR20260402', vendor: 'PT Teknindo Solusi', totalAmount: 15800000, status: 'issued', createdAt: m(4,7) },
];

// ── Accounting / Journals ────────────────────────────────────────────────────
const chartOfAccounts = {
  '1000': { name: 'Kas',                        type: 'Asset',     isak35: 'Aset Lancar' },
  '1100': { name: 'Rekening Bank',              type: 'Asset',     isak35: 'Aset Lancar' },
  '1200': { name: 'Piutang SPP',               type: 'Asset',     isak35: 'Aset Lancar' },
  '1300': { name: 'Persediaan ATK',             type: 'Asset',     isak35: 'Aset Lancar' },
  '1500': { name: 'Tanah & Bangunan',           type: 'Asset',     isak35: 'Aset Tetap' },
  '1510': { name: 'Peralatan & Kendaraan',      type: 'Asset',     isak35: 'Aset Tetap' },
  '1590': { name: 'Akumulasi Penyusutan',       type: 'Asset',     isak35: 'Aset Tetap' },
  '2000': { name: 'Hutang Usaha',               type: 'Liability', isak35: 'Kewajiban Jangka Pendek' },
  '2100': { name: 'Hutang Gaji',                type: 'Liability', isak35: 'Kewajiban Jangka Pendek' },
  '3000': { name: 'Dana Tidak Terikat',         type: 'Equity',    isak35: 'Aset Bersih Tidak Terikat' },
  '3100': { name: 'Dana Terikat Temporer',      type: 'Equity',    isak35: 'Aset Bersih Terikat Temporer' },
  '3200': { name: 'Dana Terikat Permanen',      type: 'Equity',    isak35: 'Aset Bersih Terikat Permanen' },
  '4000': { name: 'Pendapatan SPP',             type: 'Revenue',   isak35: 'Pendapatan Tidak Terikat' },
  '4100': { name: 'Pendapatan Infaq/Sedekah',   type: 'Revenue',   isak35: 'Pendapatan Terikat Temporer' },
  '4200': { name: 'Pendapatan Donasi',          type: 'Revenue',   isak35: 'Pendapatan Terikat Permanen' },
  '5000': { name: 'Beban Gaji & Honor',         type: 'Expense',   isak35: 'Beban Program' },
  '5100': { name: 'Beban Operasional',          type: 'Expense',   isak35: 'Beban Program' },
  '5200': { name: 'Beban Pemeliharaan',         type: 'Expense',   isak35: 'Beban Pendukung' },
  '5300': { name: 'Beban ATK & Supplies',       type: 'Expense',   isak35: 'Beban Pendukung' },
  '5400': { name: 'Beban Utilitas',             type: 'Expense',   isak35: 'Beban Pendukung' },
  '5500': { name: 'Beban Penyusutan',           type: 'Expense',   isak35: 'Beban Program' },
};

const journals = [
  { id: 'JRN001', date: m(1,5),  description: 'Penerimaan SPP Januari — 3 siswa kelas 7A', debit: { account: '1100', name: 'Rekening Bank', amount: 3600000 }, credit: { account: '4000', name: 'Pendapatan SPP', amount: 3600000 }, createdAt: m(1,5) },
  { id: 'JRN002', date: m(1,31), description: 'Pembayaran gaji karyawan Januari 2026', debit: { account: '5000', name: 'Beban Gaji & Honor', amount: 45000000 }, credit: { account: '1100', name: 'Rekening Bank', amount: 45000000 }, createdAt: m(1,31) },
  { id: 'JRN003', date: m(2,5),  description: 'Penerimaan SPP Februari — kelas 8A', debit: { account: '1100', name: 'Rekening Bank', amount: 2600000 }, credit: { account: '4000', name: 'Pendapatan SPP', amount: 2600000 }, createdAt: m(2,5) },
  { id: 'JRN004', date: m(2,10), description: 'Pembelian ATK bulanan', debit: { account: '5300', name: 'Beban ATK & Supplies', amount: 2500000 }, credit: { account: '1100', name: 'Rekening Bank', amount: 2500000 }, createdAt: m(2,10) },
  { id: 'JRN005', date: m(3,5),  description: 'Penerimaan SPP Maret — kelas 8B dan 9A', debit: { account: '1100', name: 'Rekening Bank', amount: 2700000 }, credit: { account: '4000', name: 'Pendapatan SPP', amount: 2700000 }, createdAt: m(3,5) },
  { id: 'JRN006', date: m(3,15), description: 'Penerimaan infaq & sedekah bulanan', debit: { account: '1000', name: 'Kas', amount: 5000000 }, credit: { account: '4100', name: 'Pendapatan Infaq/Sedekah', amount: 5000000 }, createdAt: m(3,15) },
  { id: 'JRN007', date: m(4,7),  description: 'Pembayaran rekening listrik & internet', debit: { account: '5400', name: 'Beban Utilitas', amount: 3200000 }, credit: { account: '1000', name: 'Kas', amount: 3200000 }, createdAt: m(4,7) },
  { id: 'JRN008', date: m(4,15), description: 'Penerimaan PO meja kursi — CV Mebel Jaya', debit: { account: '1300', name: 'Persediaan ATK', amount: 23500000 }, credit: { account: '2000', name: 'Hutang Usaha', amount: 23500000 }, createdAt: m(4,15) },
];

// ── Students ─────────────────────────────────────────────────────────────────
const students = [
  { id: 'STU001', nis: '2026001', name: 'Ahmad Pratama',    class: '7A', parentName: 'Prasetyo',        phone: '08111000001', email: 'pratama@mail.com',   address: 'Jl. Merdeka No.1, Bandung',      status: 'active',   enrolledAt: '2024-07-15' },
  { id: 'STU002', nis: '2026002', name: 'Siti Rahayu',      class: '7A', parentName: 'Rahayu Sr.',      phone: '08111000002', email: 'rahayu@mail.com',    address: 'Jl. Sudirman No.12, Bandung',    status: 'active',   enrolledAt: '2024-07-15' },
  { id: 'STU003', nis: '2026003', name: 'Budi Santoso',     class: '7B', parentName: 'Santoso Sr.',     phone: '08111000003', email: 'bsantoso@mail.com',  address: 'Jl. Diponegoro No.7, Bandung',   status: 'active',   enrolledAt: '2024-07-16' },
  { id: 'STU004', nis: '2025001', name: 'Dewi Lestari',     class: '8A', parentName: 'Lestari Sr.',     phone: '08111000004', email: 'dewi@mail.com',      address: 'Jl. Ahmad Yani No.3, Bandung',   status: 'active',   enrolledAt: '2023-07-14' },
  { id: 'STU005', nis: '2025002', name: 'Eko Prasetyo',     class: '8A', parentName: 'Prasetyo Sr.',    phone: '08111000005', email: 'eko@mail.com',       address: 'Jl. Gatot Subroto No.9, Bandung', status: 'active',  enrolledAt: '2023-07-14' },
  { id: 'STU006', nis: '2025003', name: 'Fitri Handayani',  class: '8B', parentName: 'Handayani Sr.',   phone: '08111000006', email: 'fitri@mail.com',     address: 'Jl. Imam Bonjol No.22, Bandung', status: 'active',   enrolledAt: '2023-07-15' },
  { id: 'STU007', nis: '2024001', name: 'Galang Ramadhan',  class: '9A', parentName: 'Ramadhan Sr.',    phone: '08111000007', email: 'galang@mail.com',    address: 'Jl. Veteran No.5, Bandung',      status: 'active',   enrolledAt: '2022-07-13' },
  { id: 'STU008', nis: '2024002', name: 'Hana Safitri',     class: '9A', parentName: 'Safitri Sr.',     phone: '08111000008', email: 'hana@mail.com',      address: 'Jl. Cihampelas No.18, Bandung',  status: 'active',   enrolledAt: '2022-07-13' },
  { id: 'STU009', nis: '2024003', name: 'Irfan Maulana',    class: '9B', parentName: 'Maulana Sr.',     phone: '08111000009', email: 'irfan@mail.com',     address: 'Jl. Setiabudi No.44, Bandung',   status: 'active',   enrolledAt: '2022-07-14' },
  { id: 'STU010', nis: '2026004', name: 'Juwita Sari',      class: '7B', parentName: 'Sari Sr.',        phone: '08111000010', email: 'juwita@mail.com',    address: 'Jl. Riau No.11, Bandung',        status: 'active',   enrolledAt: '2024-07-16' },
  { id: 'STU011', nis: '2025004', name: 'Kevin Hidayat',    class: '8A', parentName: 'Hidayat Sr.',     phone: '08111000011', email: 'kevin@mail.com',     address: 'Jl. Braga No.6, Bandung',        status: 'active',   enrolledAt: '2023-07-15' },
  { id: 'STU012', nis: '2024004', name: 'Laila Nurhaliza',  class: '9A', parentName: 'Nurhaliza Sr.',   phone: '08111000012', email: 'laila@mail.com',     address: 'Jl. Asia Afrika No.30, Bandung', status: 'active',   enrolledAt: '2022-07-13' },
  { id: 'STU013', nis: '2026005', name: 'Muhammad Rizki',   class: '7A', parentName: 'Rizki Sr.',       phone: '08111000013', email: 'mrizki@mail.com',    address: 'Jl. Dago No.15, Bandung',        status: 'active',   enrolledAt: '2024-07-17' },
  { id: 'STU014', nis: '2025005', name: 'Nadia Putri',      class: '8B', parentName: 'Putri Sr.',       phone: '08111000014', email: 'nadia@mail.com',     address: 'Jl. Buah Batu No.8, Bandung',    status: 'active',   enrolledAt: '2023-07-16' },
  { id: 'STU015', nis: '2024005', name: 'Omar Abdullah',    class: '9B', parentName: 'Abdullah Sr.',    phone: '08111000015', email: 'omar@mail.com',      address: 'Jl. Cibiru No.20, Bandung',      status: 'inactive', enrolledAt: '2022-07-14' },
];

// ── Users ────────────────────────────────────────────────────────────────────
const users = [
  { id: 'USR000', email: 'superadmin@nexfinance.com', password: 'superadmin123', role: 'super_admin', name: 'Super Administrator', status: 'active' },
  { id: 'USR001', email: 'admin@nexfinance.com',     password: 'admin123',     role: 'admin',     name: 'Administrator',      status: 'active' },
  { id: 'USR002', email: 'bendahara@nexfinance.com', password: 'bendahara123', role: 'bendahara', name: 'Bendahara Sekolah',   status: 'active' },
  { id: 'USR003', email: 'kabag@nexfinance.com',     password: 'kabag123',     role: 'kabag',     name: 'Kepala Bagian',       status: 'active' },
  { id: 'USR004', email: 'staff@nexfinance.com',     password: 'staff123',     role: 'staff',     name: 'Staff TU',            status: 'active' },
  { id: 'USR005', email: 'auditor@nexfinance.com',   password: 'auditor123',   role: 'auditor',   name: 'Auditor Eksternal',   status: 'active' },
];

// ── Activity Logs ────────────────────────────────────────────────────────────
const activityLogs = [
  { id: 'LOG0000000001aaa', userId: 'USR001', userEmail: 'admin@nexfinance.com',     action: 'login',             module: 'auth',          description: 'User admin@nexfinance.com logged in',                    metadata: { role: 'admin' },                    ipAddress: '192.168.1.10', timestamp: '2026-05-01T07:55:00.000Z', level: 'info' },
  { id: 'LOG0000000002bbb', userId: 'USR002', userEmail: 'bendahara@nexfinance.com', action: 'create_invoice',    module: 'spp',           description: 'Created SPP invoice INV013 for Maret 2026',              metadata: { invoiceId: 'INV013' },              ipAddress: '192.168.1.11', timestamp: '2026-05-01T08:10:00.000Z', level: 'info' },
  { id: 'LOG0000000003ccc', userId: 'USR002', userEmail: 'bendahara@nexfinance.com', action: 'record_payment',    module: 'spp',           description: 'Recorded payment for Ahmad Pratama — Maret 2026',        metadata: { studentId: 'STU001', amount: 1200000 }, ipAddress: '192.168.1.11', timestamp: '2026-05-01T08:25:00.000Z', level: 'info' },
  { id: 'LOG0000000004ddd', userId: 'USR004', userEmail: 'staff@nexfinance.com',     action: 'submit_expense',    module: 'expenses',      description: 'Submitted expense EXP008 — Pengadaan seragam staf TU', metadata: { expenseId: 'EXP008', amount: 2100000 }, ipAddress: '192.168.1.14', timestamp: '2026-05-07T09:00:00.000Z', level: 'info' },
  { id: 'LOG0000000005eee', userId: 'USR003', userEmail: 'kabag@nexfinance.com',     action: 'approve_expense',   module: 'expenses',      description: 'Approved expense EXP005 — Transportasi kunjungan',       metadata: { expenseId: 'EXP005' },              ipAddress: '192.168.1.13', timestamp: '2026-05-04T10:15:00.000Z', level: 'info' },
  { id: 'LOG0000000006fff', userId: 'USR002', userEmail: 'bendahara@nexfinance.com', action: 'calculate_payroll', module: 'payroll',       description: 'Calculated payroll for April 2026 — 4 employees',        metadata: { month: 'April 2026', count: 4 },    ipAddress: '192.168.1.11', timestamp: '2026-05-02T14:00:00.000Z', level: 'info' },
  { id: 'LOG0000000007ggg', userId: 'USR003', userEmail: 'kabag@nexfinance.com',     action: 'create_pr',         module: 'procurement',   description: 'Created PR20260503 — Sound system aula serbaguna',       metadata: { prId: 'PR20260503' },               ipAddress: '192.168.1.13', timestamp: '2026-05-07T11:30:00.000Z', level: 'info' },
  { id: 'LOG0000000008hhh', userId: 'USR002', userEmail: 'bendahara@nexfinance.com', action: 'create_journal',    module: 'accounting',    description: 'Created journal entry JRN008 — PO meja kursi',           metadata: { journalId: 'JRN008' },              ipAddress: '192.168.1.11', timestamp: '2026-04-15T13:45:00.000Z', level: 'info' },
  { id: 'LOG0000000009iii', userId: 'USR005', userEmail: 'auditor@nexfinance.com',   action: 'view_reports',      module: 'reports',       description: 'Auditor viewed financial summary report April 2026',     metadata: { reportType: 'financial_summary' },  ipAddress: '192.168.1.15', timestamp: '2026-05-06T09:00:00.000Z', level: 'info' },
  { id: 'LOG0000000010jjj', userId: 'USR001', userEmail: 'admin@nexfinance.com',     action: 'logout',            module: 'auth',          description: 'User admin@nexfinance.com logged out',                   metadata: {},                                   ipAddress: '192.168.1.10', timestamp: '2026-05-01T17:00:00.000Z', level: 'info' },
  { id: 'LOG0000000011kkk', userId: 'USR003', userEmail: 'kabag@nexfinance.com',     action: 'reject_expense',    module: 'expenses',      description: 'Rejected expense EXP007 — anggaran sudah tercakup',      metadata: { expenseId: 'EXP007', reason: 'Sudah tercover anggaran bulanan' }, ipAddress: '192.168.1.13', timestamp: '2026-04-21T10:00:00.000Z', level: 'warning' },
  { id: 'LOG0000000012lll', userId: 'USR002', userEmail: 'bendahara@nexfinance.com', action: 'record_payment',    module: 'spp',           description: 'Recorded payment for Juwita Sari — Mei 2026',           metadata: { studentId: 'STU010', amount: 1200000 }, ipAddress: '192.168.1.11', timestamp: '2026-05-05T08:30:00.000Z', level: 'info' },
  { id: 'LOG0000000013mmm', userId: 'USR004', userEmail: 'staff@nexfinance.com',     action: 'submit_expense',    module: 'expenses',      description: 'Submitted expense EXP004 — Perbaikan AC kelas 8A',      metadata: { expenseId: 'EXP004', amount: 1500000 }, ipAddress: '192.168.1.14', timestamp: '2026-05-02T09:30:00.000Z', level: 'info' },
  { id: 'LOG0000000014nnn', userId: 'USR001', userEmail: 'admin@nexfinance.com',     action: 'login',             module: 'auth',          description: 'User admin@nexfinance.com logged in',                    metadata: { role: 'admin' },                    ipAddress: '192.168.1.10', timestamp: '2026-05-07T08:00:00.000Z', level: 'info' },
  { id: 'LOG0000000015ooo', userId: 'USR002', userEmail: 'bendahara@nexfinance.com', action: 'approve_payment',   module: 'spp',           description: 'Approved batch SPP payment for 5 students Mei 2026',    metadata: { count: 5, month: 'Mei 2026' },      ipAddress: '192.168.1.11', timestamp: '2026-05-08T07:50:00.000Z', level: 'info' },
];

module.exports = { sppInvoices, employees, payrollRuns, expenses, purchaseRequests, purchaseOrders, chartOfAccounts, journals, students, users, activityLogs };
