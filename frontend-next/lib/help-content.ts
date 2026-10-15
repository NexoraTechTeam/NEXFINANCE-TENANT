export type GuideIcon =
  | 'dashboard' | 'spp' | 'payroll' | 'expenses' | 'procurement' | 'accounting'
  | 'reports' | 'logs' | 'students' | 'employees' | 'access';

export interface ModuleGuide {
  key: GuideIcon;
  href: string;
  title: string;
  summary: string;
  steps: string[];
}

export interface Faq {
  category: string;
  question: string;
  answer: string;
}

export const MODULE_GUIDES: ModuleGuide[] = [
  {
    key: 'dashboard',
    href: '/dashboard',
    title: 'Dashboard Eksekutif',
    summary: 'Ringkasan KPI keuangan, tren bulanan, dan distribusi beban sekolah.',
    steps: [
      'Pantau kartu KPI di bagian atas: saldo kas, pendapatan, collection SPP, dan item perlu aksi.',
      'Klik kartu KPI untuk langsung membuka modul terkait.',
      'Arahkan kursor ke grafik untuk melihat angka detail per bulan; klik segmen distribusi beban untuk detailnya.',
    ],
  },
  {
    key: 'spp',
    href: '/dashboard/spp',
    title: 'Manajemen SPP',
    summary: 'Buat invoice SPP, catat pembayaran, dan pantau collection rate siswa.',
    steps: [
      'Klik "Buat Invoice SPP", pilih siswa, bulan, dan jumlah, lalu simpan.',
      'Pada invoice yang belum dibayar, klik "Catat Pembayaran" dan pilih metode pembayaran.',
      'Gunakan kotak pencarian dan kartu status (Sudah Lunas / Belum Bayar) untuk menyaring daftar.',
    ],
  },
  {
    key: 'payroll',
    href: '/dashboard/payroll',
    title: 'Manajemen Penggajian',
    summary: 'Hitung gaji karyawan dan simpan riwayat slip gaji per periode.',
    steps: [
      'Klik "Hitung Gaji", pilih karyawan dan periode bulan.',
      'Periksa rincian gaji pokok, tunjangan, dan gaji bersih (take-home) sebelum menyimpan.',
      'Lihat slip yang sudah diproses pada bagian Riwayat Penggajian.',
    ],
  },
  {
    key: 'expenses',
    href: '/dashboard/expenses',
    title: 'Pengeluaran',
    summary: 'Ajukan pengeluaran dan proses persetujuan sesuai hak akses.',
    steps: [
      'Klik "Ajukan Pengeluaran", isi kategori, jumlah, dan keterangan.',
      'Pengajuan berstatus Menunggu sampai disetujui atau ditolak oleh role yang berwenang.',
      'Gunakan tombol Setuju / Tolak pada baris pengajuan (memerlukan izin approval).',
    ],
  },
  {
    key: 'procurement',
    href: '/dashboard/procurement',
    title: 'Pengadaan',
    summary: 'Kelola Purchase Request (PR), Purchase Order (PO), dan penerimaan barang.',
    steps: [
      'Buat permintaan pembelian lewat tombol "Buat PR".',
      'Setelah PR disetujui, terbitkan order melalui tombol "Buat PO".',
      'Saat barang datang, klik "Terima Barang" pada PO untuk menandai diterima.',
    ],
  },
  {
    key: 'accounting',
    href: '/dashboard/accounting',
    title: 'Akuntansi',
    summary: 'Catat jurnal umum dan kelola bagan akun (Chart of Accounts).',
    steps: [
      'Pilih tab Jurnal Umum untuk melihat atau menambah entri jurnal.',
      'Saat menambah jurnal, pilih akun debit dan kredit, isi jumlah dan deskripsi.',
      'Tab Chart of Accounts menampilkan daftar akun yang dapat digunakan pada jurnal.',
    ],
  },
  {
    key: 'reports',
    href: '/dashboard/reports',
    title: 'Laporan Keuangan',
    summary: 'Laporan Posisi Keuangan, Aktivitas, dan Arus Kas sesuai ISAK 35.',
    steps: [
      'Pindah antar jenis laporan melalui tab di bagian atas halaman.',
      'Klik "Unduh PDF" untuk mengekspor laporan siap cetak.',
      'Buka "Panduan PDF" untuk petunjuk format dan penggunaan hasil ekspor.',
    ],
  },
  {
    key: 'logs',
    href: '/dashboard/activity-logs',
    title: 'Log Historis',
    summary: 'Audit trail aktivitas pengguna untuk monitoring dan investigasi.',
    steps: [
      'Cari berdasarkan user, aksi, atau deskripsi pada kotak pencarian.',
      'Saring berdasarkan modul atau aksi, lalu klik "Terapkan".',
      'Gunakan "Bersihkan Log Lama" untuk merapikan log yang sudah kedaluwarsa (sesuai izin).',
    ],
  },
  {
    key: 'students',
    href: '/dashboard/master/students',
    title: 'Master Data Siswa',
    summary: 'Kelola data siswa, kelas, wali, dan status keaktifan.',
    steps: [
      'Tambah siswa baru melalui tombol Tambah di kanan atas halaman.',
      'Cari berdasarkan nama/NIS dan saring berdasarkan kelas atau status.',
      'Gunakan ikon edit atau hapus pada kolom Aksi untuk memperbarui data.',
    ],
  },
  {
    key: 'employees',
    href: '/dashboard/master/employees',
    title: 'Master Data Karyawan',
    summary: 'Kelola data karyawan, jabatan, gaji pokok, dan tunjangan.',
    steps: [
      'Tambah karyawan baru beserta jabatan, departemen, dan komponen gaji.',
      'Cari berdasarkan nama/NIP dan saring berdasarkan jabatan atau status.',
      'Data karyawan aktif menjadi dasar perhitungan di modul Penggajian.',
    ],
  },
  {
    key: 'access',
    href: '/dashboard/master/access',
    title: 'Role & Akses',
    summary: 'Atur pengguna, role, dan matriks hak akses per modul.',
    steps: [
      'Lihat daftar user beserta role dan statusnya.',
      'Klik "Edit Role" untuk mengubah role atau status pengguna.',
      'Super Admin dapat menyesuaikan hak akses tiap role terhadap menu aplikasi.',
    ],
  },
];

export const FAQS: Faq[] = [
  {
    category: 'Akun',
    question: 'Bagaimana cara mengubah password saya?',
    answer: 'Buka sidebar, klik "Ubah password" di bagian profil bawah, isi password saat ini, password baru (minimal 8 karakter), dan konfirmasinya, lalu klik "Simpan password".',
  },
  {
    category: 'Akun',
    question: 'Mengapa saya tiba-tiba diarahkan ke halaman login?',
    answer: 'Sesi login berakhir atau token tidak lagi valid. Silakan masuk kembali dengan email dan password Anda.',
  },
  {
    category: 'Akses',
    question: 'Mengapa sebagian tombol atau menu tidak bisa saya gunakan?',
    answer: 'Hak akses diatur per role (Super Admin, Admin, Bendahara, Kepala Bagian, Staff, Auditor). Hubungi Super Admin bila Anda memerlukan akses tambahan.',
  },
  {
    category: 'SPP',
    question: 'Bagaimana mencatat pembayaran SPP?',
    answer: 'Di halaman SPP, temukan invoice berstatus Belum Bayar, klik "Catat Pembayaran", pilih metode pembayaran, lalu simpan. Status invoice akan berubah menjadi Lunas.',
  },
  {
    category: 'Pengeluaran',
    question: 'Siapa yang dapat menyetujui pengeluaran?',
    answer: 'Persetujuan hanya tersedia bagi role yang memiliki izin approval pada modul Pengeluaran. Pengajuan Anda akan tetap berstatus Menunggu sampai diproses.',
  },
  {
    category: 'Laporan',
    question: 'Bagaimana cara mengekspor laporan keuangan ke PDF?',
    answer: 'Buka menu Laporan lalu klik "Unduh PDF". Petunjuk lengkap format ekspor tersedia melalui tombol "Panduan PDF".',
  },
  {
    category: 'Panduan',
    question: 'Bagaimana mengulang tur aplikasi?',
    answer: 'Buka menu Bantuan di sidebar lalu klik "Mulai tur aplikasi", atau gunakan tombol bantuan cepat di pojok kanan bawah layar.',
  },
  {
    category: 'Perangkat',
    question: 'Apakah NexFinance bisa dipakai di ponsel?',
    answer: 'Bisa. Pada layar kecil, buka menu melalui ikon garis tiga di kiri atas. Tabel lebar dapat digeser ke samping.',
  },
];

export const SHORTCUTS: Array<{ keys: string[]; description: string }> = [
  { keys: ['→'], description: 'Langkah tur berikutnya' },
  { keys: ['←'], description: 'Langkah tur sebelumnya' },
  { keys: ['Esc'], description: 'Tutup tur, panel bantuan, atau menu samping' },
  { keys: ['Tab'], description: 'Berpindah antar elemen yang dapat diklik' },
];

export function getModuleGuide(pathname: string): ModuleGuide {
  const match = MODULE_GUIDES
    .filter((guide) => guide.href !== '/dashboard')
    .sort((a, b) => b.href.length - a.href.length)
    .find((guide) => pathname === guide.href || pathname.startsWith(`${guide.href}/`));
  return match ?? MODULE_GUIDES[0];
}

export function searchFaqs(query: string): Faq[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return FAQS;
  return FAQS.filter((faq) =>
    `${faq.category} ${faq.question} ${faq.answer}`.toLowerCase().includes(needle),
  );
}
