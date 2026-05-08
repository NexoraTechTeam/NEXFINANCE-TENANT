// Shared in-memory store — all routes import from here so dashboard sees live data

const now = new Date();
const m = (mo, d) => { const dt = new Date(2026, mo - 1, d); return dt.toISOString().split('T')[0]; };
const rp = (n) => n;

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
const calcPayroll = (emp, month) => {
  const gross = emp.baseSalary + emp.certificationAllowance + emp.familyAllowance;
  const bpjsKes = Math.round(gross * 0.01);
  const bpjsTk  = Math.round(gross * 0.057);
  const pph     = Math.round(gross * 0.05);
  const net     = gross - bpjsKes - bpjsTk - pph;
  return { employeeId: emp.id, employeeName: emp.name, month, baseSalary: emp.baseSalary, certificationAllowance: emp.certificationAllowance, familyAllowance: emp.familyAllowance, grossSalary: gross, bpjsKesehatan: bpjsKes, bpjsKetenagakerjaan: bpjsTk, pphTER: pph, netSalary: net, status: 'paid', paidAt: new Date().toISOString() };
};
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

module.exports = { sppInvoices, employees, payrollRuns, expenses, purchaseRequests, purchaseOrders, chartOfAccounts, journals, calcPayroll };
