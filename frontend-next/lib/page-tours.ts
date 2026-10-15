import { getModuleGuide, type GuideIcon } from '@/lib/help-content';
import type { TourStep } from '@/lib/tour';

/**
 * Page tours target existing layout classes so module pages need no changes.
 * Selector lists resolve to the first matching element on the page.
 */
const SEL = {
  header: '.page-header, .dashboard-header',
  stats: '.kpi-grid, .stat-grid, .spp-stat-grid, .exp-stat-grid, .acct-stat-grid, .proc-stat-grid',
  tabs: '.tab-bar',
  filters: '.filter-bar',
  table: '.table-wrapper, .acct-table-wrapper, .proc-table-wrapper, .rpt-isak35-table-wrapper',
} as const;

type StepSpec = Omit<TourStep, 'id' | 'area'> & { key: string };

const header = (body: string): StepSpec => ({ key: 'header', target: SEL.header, title: 'Judul & aksi utama', body });
const stats = (body: string): StepSpec => ({ key: 'stats', target: SEL.stats, title: 'Ringkasan angka', body });
const tabs = (body: string): StepSpec => ({ key: 'tabs', target: SEL.tabs, title: 'Pindah tampilan', body });
const filters = (body: string): StepSpec => ({ key: 'filters', target: SEL.filters, title: 'Cari & saring', body });
const table = (body: string): StepSpec => ({ key: 'table', target: SEL.table, title: 'Daftar data', body });

const PAGE_STEPS: Record<GuideIcon, StepSpec[]> = {
  dashboard: [
    { key: 'banner', target: '.executive-banner', title: 'Executive snapshot', body: 'Gambaran cepat koleksi SPP, item prioritas, dan cakupan invoice dalam satu kartu.' },
    { key: 'kpi', target: '.kpi-grid', title: 'Kartu KPI', body: 'Pendapatan, collection SPP, saldo kas, dan item perlu aksi. Klik kartu untuk membuka modul terkait.' },
    { key: 'charts', target: '.charts-row', title: 'Grafik tren & distribusi', body: 'Bandingkan pendapatan, beban, dan surplus per bulan. Ganti tampilan Area/Bar dan klik segmen distribusi beban untuk detail.' },
    { key: 'ytd', target: '.ytd-grid', title: 'Ringkasan tahun berjalan', body: 'Total pendapatan, beban, dan margin bersih sejak awal tahun.' },
  ],
  spp: [
    header('Buat invoice SPP baru dari tombol di kanan atas.'),
    stats('Pantau total invoice, yang sudah lunas, belum bayar, dan collection rate. Klik kartu status untuk menyaring daftar.'),
    table('Setiap baris adalah invoice siswa. Gunakan "Catat Pembayaran" pada invoice yang belum dibayar.'),
  ],
  payroll: [
    header('Gunakan "Hitung Gaji" untuk memproses gaji karyawan pada periode tertentu.'),
    stats('Total karyawan, total penggajian, dan take-home yang sudah diproses.'),
    table('Data karyawan dan riwayat penggajian tampil di tabel ini.'),
  ],
  expenses: [
    header('Ajukan pengeluaran baru melalui tombol di kanan atas.'),
    stats('Lihat total pengajuan, yang menunggu, dan yang disetujui. Klik kartu untuk menyaring.'),
    table('Proses pengajuan dengan tombol Setuju / Tolak (memerlukan izin approval).'),
  ],
  procurement: [
    header('Buat Purchase Request (PR) atau Purchase Order (PO) dari tombol di kanan atas.'),
    stats('Jumlah PR, PR pending, total PO, dan PO yang sudah diterima.'),
    tabs('Pindah antara daftar Purchase Request dan Purchase Order.'),
    table('Klik "Terima Barang" pada PO ketika barang sudah datang.'),
  ],
  accounting: [
    header('Tambah entri jurnal baru dengan tombol "Tambah Jurnal".'),
    stats('Ringkasan jumlah akun, jurnal, serta total debit dan kredit.'),
    tabs('Pindah antara Jurnal Umum dan Chart of Accounts.'),
    table('Entri jurnal atau daftar akun tampil di sini.'),
  ],
  reports: [
    { key: 'export', target: '.rpt-export-row', title: 'Ekspor laporan', body: 'Unduh laporan sebagai PDF, atau buka Panduan PDF untuk petunjuk format.' },
    { key: 'mapping', target: '.rpt-isak35-table-wrapper', title: 'Pemetaan akun ISAK 35', body: 'Klasifikasi akun backend yang dipakai untuk menyusun aset, kewajiban, dan aset bersih.' },
    tabs('Pindah antara Laporan Aktivitas, Posisi Keuangan, dan Arus Kas / Tren.'),
  ],
  logs: [
    header('"Bersihkan Log Lama" merapikan log yang sudah kedaluwarsa (sesuai izin).'),
    stats('Total aktivitas dan modul yang tercatat.'),
    filters('Cari user, aksi, atau deskripsi, saring per modul/aksi, lalu klik Terapkan.'),
    table('Jejak audit lengkap: waktu, user, modul, aksi, dan deskripsi.'),
  ],
  students: [
    header('Tambah siswa baru dari tombol "Tambah Siswa".'),
    stats('Jumlah siswa total dan yang aktif.'),
    filters('Cari nama/NIS dan saring berdasarkan kelas atau status.'),
    table('Edit atau hapus data siswa dari kolom Aksi.'),
  ],
  employees: [
    header('Tambah karyawan baru dari tombol "Tambah Karyawan".'),
    stats('Jumlah karyawan total dan yang aktif.'),
    filters('Cari nama/NIP dan saring berdasarkan jabatan atau status.'),
    table('Data karyawan aktif menjadi dasar perhitungan penggajian.'),
  ],
  access: [
    header('Kelola pengguna, role, dan matriks hak akses per modul dari halaman ini.'),
    table('Tambah pengguna dengan tombol "Tambah user", lalu gunakan "Edit Role" untuk mengubah role atau status.'),
  ],
};

export function getPageTour(pathname: string): TourStep[] {
  const guide = getModuleGuide(pathname);
  const prefix = `page-${guide.key}`;
  return [
    {
      id: `${prefix}-intro`,
      title: `Tur halaman: ${guide.title}`,
      body: `${guide.summary} Ikuti beberapa langkah singkat untuk mengenal bagian penting halaman ini.`,
    },
    ...PAGE_STEPS[guide.key].map(({ key, ...step }) => ({ ...step, id: `${prefix}-${key}`, area: 'main' as const })),
    {
      id: `${prefix}-done`,
      title: 'Selesai',
      body: 'Butuh bantuan lagi? Tombol bantuan di pojok kanan bawah selalu siap, dan panduan lengkap ada di menu Bantuan.',
    },
  ];
}

/** Keep centered steps and steps whose target currently exists in the document. */
export function resolveTourSteps(steps: TourStep[], root: Pick<Document, 'querySelector'> | undefined): TourStep[] {
  if (!root) return steps.filter((step) => !step.target);
  return steps.filter((step) => !step.target || root.querySelector(step.target) !== null);
}
