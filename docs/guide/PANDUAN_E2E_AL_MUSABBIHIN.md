# Panduan End-to-End NexFinance Tenant
## Studi kasus: SIT Al Musabbihin — dari setup tenant di Console sampai sekolah beroperasi

| | |
| --- | --- |
| **Produk** | NexFinance Tenant (SaaS multi-tenant) — oleh Nexora |
| **Repo** | `NexoraTechTeam/NEXFINANCE-TENANT` |
| **Tenant contoh** | Sekolah Islam Terpadu Al Musabbihin (`al-musabbihin`) |
| **Versi dokumen** | 1.5 — 22 Oktober 2026 (Aset Tetap & penyusutan bulanan, Catatan G, tombol header Akuntansi dirapikan) |
| **Sumber screenshot** | Uji end-to-end otomatis (Playwright) pada build `dev`, database PostgreSQL nyata, nama host produksi. Semua angka di dokumen ini adalah hasil transaksi nyata dalam uji tersebut. |

> **Cara membaca dokumen ini.** Bagian 1–3 memberi gambaran umum (untuk semua orang). Bagian 4–9 adalah
> manual per peran (POV) — cukup baca bagian sesuai peran Anda. Bagian 10–13 adalah referensi (hak akses,
> jurnal otomatis, checklist go-live, FAQ).
>
> **Dua versi dari satu sumber.** File Markdown ini adalah versi **lengkap (internal Nexora)**, termasuk detail
> teknis, checklist go-live dan catatan kualitas. Versi **PDF** dibangun dari file ini untuk **dibagikan ke
> sekolah**: blok bertanda *Internal Nexora* serta bagian 12 dan 14 tidak ikut, dan build PDF gagal bila
> masih ada istilah teknis (lihat `tools/README.md`).

---

## Daftar isi
1. [Ringkasan](#1-ringkasan)
2. [Alamat (URL) & lingkungan](#2-alamat-url--lingkungan)
3. [Alur end-to-end dalam satu halaman](#3-alur-end-to-end-dalam-satu-halaman)
4. [POV Operator Nexora — Console (CMS master)](#4-pov-operator-nexora--console-cms-master)
5. [POV Admin Sekolah (Super Admin)](#5-pov-admin-sekolah-super-admin)
6. [POV Bendahara](#6-pov-bendahara)
7. [POV Staf](#7-pov-staf)
8. [POV Kepala Bagian](#8-pov-kepala-bagian)
9. [POV Auditor & hasil akhir](#9-pov-auditor--hasil-akhir)
10. [Matriks hak akses default](#10-matriks-hak-akses-default)
11. [Jurnal otomatis (ISAK 335)](#11-jurnal-otomatis-isak-335)
12. [Checklist go-live Al Musabbihin](#12-checklist-go-live-al-musabbihin)
13. [FAQ & troubleshooting](#13-faq--troubleshooting)
14. [Catatan kualitas uji E2E](#14-catatan-kualitas-uji-e2e)

---

## 1. Ringkasan

<!-- nexora -->
NexFinance Tenant menjalankan **satu aplikasi untuk banyak sekolah**. Setiap sekolah (tenant) punya:

- **alamat sendiri** — alamat `<nama-sekolah>-nexfinance.nexoratech.co`, opsional domain sekolah sendiri;
- **data terpisah** — data setiap sekolah disimpan terpisah dan tidak pernah tercampur dengan sekolah lain;
- **identitas sendiri** — nama, logo, warna tema (dibuat otomatis dari logo), kop laporan PDF;
- **pengguna & hak akses sendiri** — 6 peran (Super Admin, Administrator, Bendahara, Kepala Bagian, Staf, Auditor).

Sekolah baru disiapkan oleh **Operator Nexora** lewat **Console** (CMS master) dalam ±3 menit dan
langsung bisa dipakai.
<!-- /nexora -->
<!-- school -->
**NexFinance** adalah aplikasi keuangan SIT Al Musabbihin untuk SPP, penggajian, pengeluaran, pengadaan,
akuntansi, dan laporan keuangan ISAK 335 (d/h ISAK 35) — dapat dibuka dari komputer maupun ponsel.

- **alamat sekolah sendiri** — `https://almusabbihin-nexfinance.nexoratech.co`;
- **data sekolah aman dan terpisah** — hanya pengguna SIT Al Musabbihin yang dapat mengaksesnya;
- **identitas sekolah** — nama, logo, warna, foto halaman login, dan kop laporan PDF sekolah;
- **pengguna & hak akses** — 6 peran (Super Admin, Administrator, Bendahara, Kepala Bagian, Staf, Auditor).

Akun **Super Admin** sekolah (`admin-almusabbihin`) diserahkan oleh tim Nexora bersama password sementara;
Super Admin kemudian membuat akun untuk peran lainnya.
<!-- /school -->

<!-- internal -->
> **🔧 Internal Nexora (tidak ikut di PDF tenant):** satu schema PostgreSQL per sekolah (`t_al_musabbihin`) + registry `platform`; tenant dikenali dari host. Onboarding tidak butuh perubahan kode maupun deploy ulang (kecuali menambah host baru ke `SAAS_HOSTS` selama belum ada wildcard DNS/TLS).
<!-- /internal -->

| Peran | Siapa | Bekerja di | Tugas utama |
| --- | --- | --- | --- |
| Operator Nexora | Tim Nexora | Console | Membuat & mengelola tenant, logo/tema, domain, reset password admin <!--nx--> |
| Super Admin | Admin sekolah (`admin-almusabbihin`) | Aplikasi sekolah | Saldo awal, user & hak akses, data master |
| Bendahara | Siti Rahmawati | Aplikasi sekolah | SPP, penggajian, persetujuan, jurnal, laporan |
| Kepala Bagian | Hendra Gunawan | Aplikasi sekolah | Persetujuan pengeluaran, pengadaan (PR → PO → terima barang) |
| Staf | Rina Marlina | Aplikasi sekolah | Mengajukan pengeluaran |
| Auditor | Dewi Kusuma | Aplikasi sekolah | Melihat laporan & akuntansi (baca saja) |

## 2. Alamat (URL)

> ✅ **Sudah aktif sejak 19 Oktober 2026.** Buka alamat di bawah dari browser komputer atau ponsel —
> koneksi aman (HTTPS), tidak perlu memasang aplikasi apa pun.

| Kebutuhan | Alamat | Dipakai oleh |
| --- | --- | --- |
| Aplikasi SIT Al Musabbihin | `https://almusabbihin-nexfinance.nexoratech.co` | Semua pengguna sekolah |
| Halaman login | `https://almusabbihin-nexfinance.nexoratech.co/login` | Semua pengguna sekolah |
| Dashboard | `https://almusabbihin-nexfinance.nexoratech.co/dashboard` | Semua pengguna sekolah |
| Domain sekolah (menyusul) | `https://al-musabbihin.sch.id` | Semua pengguna sekolah |
| Console | `https://console-nexfinance.nexoratech.co/console` | Khusus tim Nexora <!--nx--> |

<!-- internal -->
> **🔧 Internal Nexora (tidak ikut di PDF tenant):** lingkungan uji (staging) dan pola alamat:

| Kebutuhan | Produksi | Staging |
| --- | --- | --- |
| Console | `console-nexfinance.nexoratech.co` | `console-nexfinance-staging.nexoratech.co` |
| Aplikasi sekolah | `almusabbihin-nexfinance.nexoratech.co` | `almusabbihin-nexfinance-staging.nexoratech.co` |
| Sekolah berikutnya | `<slug tanpa tanda minus>-nexfinance.nexoratech.co` | `<slug tanpa tanda minus>-nexfinance-staging.nexoratech.co` |
<!-- /internal -->

Halaman di aplikasi sekolah (semua di bawah `https://almusabbihin-nexfinance.nexoratech.co`):

| Menu | Path | Menu | Path |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | Akuntansi | `/dashboard/accounting` |
| SPP | `/dashboard/spp` | Laporan | `/dashboard/reports` |
| Penggajian | `/dashboard/payroll` | Log Historis | `/dashboard/activity-logs` |
| Pengeluaran | `/dashboard/expenses` | Master Siswa | `/dashboard/master/students` |
| Pengadaan | `/dashboard/procurement` | Master Karyawan | `/dashboard/master/employees` |
| Bantuan | `/dashboard/help` | Role & Akses | `/dashboard/master/access` |

> Domain milik sekolah (`al-musabbihin.sch.id`) dapat diaktifkan bersama tim Nexora — pengelola domain sekolah
> cukup mengikuti instruksi singkat yang kami kirimkan.

<!-- internal -->
> **🔧 Internal Nexora (tidak ikut di PDF tenant):** domain sekolah = tambah di Console → domain + A record DNS (oleh sekolah) → tambahkan ke `SAAS_HOSTS` → deploy ulang. Detail: `docs/OPERATIONS.md`.
<!-- /internal -->

## 3. Alur end-to-end dalam satu halaman

| # | Peran | Langkah | Hasil |
| --- | --- | --- | --- |
| 1 | Operator | Login Console → **Tenant baru** (identitas → logo & warna → admin & domain) | Tenant aktif, subdomain siap, password sementara admin <!--nx--> |
| 2 | Operator | Lengkapi kepala sekolah/bendahara, tambah domain sekolah, kirim kredensial lewat kanal aman | Data kop laporan lengkap <!--nx--> |
| 1–2 | Tim Nexora | Menyiapkan aplikasi sekolah (logo, warna, data sekolah) dan menyerahkan akun Super Admin | Aplikasi sekolah siap dipakai <!--sch--> |
| 3 | Super Admin | Login pertama → **wajib ganti password** → tur aplikasi | Akun aman, kenal navigasi |
| 4 | Super Admin | **Saldo awal** → buat user per peran → data siswa & karyawan | Sekolah siap bertransaksi |
| 5 | Bendahara | Buat invoice SPP → catat pembayaran → hitung gaji | Piutang, kas, beban gaji terjurnal otomatis |
| 6 | Staf | Ajukan pengeluaran | Pengeluaran menunggu 2 persetujuan |
| 7 | Kepala Bagian | Persetujuan ke-1 → PR → PO → terima barang | Persediaan & hutang usaha terjurnal |
| 8 | Bendahara | Persetujuan ke-2 (orang berbeda) → cek jurnal → dana terikat → aset tetap & penyusutan → laporan & PDF | Beban & penyusutan terjurnal, laporan ISAK 335 berkop sekolah |
| 9 | Auditor / Admin | Tinjau laporan, dashboard, log historis | Transparansi & jejak audit |

---

<!-- nexora -->
## 4. POV Operator Nexora — Console (CMS master)

Bagian ini menunjukkan bagaimana tim Nexora menyiapkan sekolah Anda di **Console** — dari data sekolah,
logo dan warna, sampai akun admin pertama.

**Alamat:** `https://console-nexfinance.nexoratech.co/console` · **Akun:** akun operator Nexora.

> Console khusus untuk tim Nexora. Pengguna sekolah tidak memerlukan dan tidak dapat membukanya.

<!-- internal -->
> **🔧 Internal Nexora (tidak ikut di PDF tenant):** akun operator dibuat otomatis saat deploy dari secret `SAAS_CONSOLE_ADMIN_EMAIL` / `SAAS_CONSOLE_ADMIN_PASSWORD`. `/console` di host sekolah selalu 404 (`requireConsoleHost`).
<!-- /internal -->

### 4.1 Login Console
1. Buka alamat Console, isi email & password operator, klik **Masuk**.

![Login Console](img/01-console-login.jpg)

2. Halaman **Sekolah (tenant)** menampilkan semua tenant (status, domain, jumlah user, tanggal dibuat).
   Saat pertama kali, daftar masih kosong.

![Daftar tenant kosong](img/02-console-list-empty.jpg)

### 4.2 Wizard "Tenant baru" — langkah 1: Identitas sekolah
Klik **Tenant baru**. Isi:

| Isian | Contoh Al Musabbihin | Keterangan |
| --- | --- | --- |
| Nama sekolah | Sekolah Islam Terpadu Al Musabbihin | Tampil di kop laporan & judul halaman |
| Nama singkat | SIT Al Musabbihin | Tampil di sidebar & login |
| Slug | `al-musabbihin` | Menentukan alamat sekolah. **Huruf kecil, angka, tanda minus. Tidak bisa diubah.** |
| Kota, Alamat, NPSN | Bandung · Jl. Contoh Pendidikan No. 1 · 20200001 | Untuk kop laporan |

![Wizard langkah 1 — identitas](img/03-console-wizard-identity.jpg)

> **Penting:** slug terisi otomatis dari nama sekolah (mis. `sekolah-islam-terpadu-al-musabbihin`).
> Ubah ke bentuk pendek yang mudah diingat (`al-musabbihin`) **sebelum** menekan Lanjut.

### 4.3 Langkah 2: Logo & warna
1. Unggah logo (PNG/JPG/SVG, maks. 2 MB).
2. Warna tema dibuat otomatis dari logo dan sudah dicek kontrasnya (WCAG AA). Untuk Al Musabbihin:
   **Primer `#196fb0`** (biru), **Sekunder `#5ebd69`** (hijau), **Sidebar `#153147`**.
3. Pratinjau di kanan menunjukkan tampilan aplikasi sekolah. Warna masih bisa diubah manual.

![Wizard langkah 2 — logo & palet](img/04-console-wizard-logo-palette.jpg)

### 4.4 Langkah 3: Admin & domain
| Isian | Contoh |
| --- | --- |
| Username admin | `admin-almusabbihin` (peran **Super Admin**) |
| Nama admin | Administrator Al Musabbihin |
| Email admin (opsional) | admin@al-musabbihin.sch.id |
| Domain sekolah (opsional) | `al-musabbihin.sch.id` — bisa juga ditambahkan nanti |

Alamat `almusabbihin-nexfinance.nexoratech.co` dibuat otomatis. Klik **Buat tenant**.

![Wizard langkah 3 — admin & domain](img/05-console-wizard-admin-domain.jpg)

### 4.5 Tenant aktif — kirim kredensial
Console menampilkan alamat, username admin, dan **password sementara (hanya tampil sekali)** — tombol
**Salin** tersedia. Kirim ke admin sekolah lewat kanal aman (bukan grup chat umum). Admin **wajib**
menggantinya saat login pertama.

![Tenant berhasil dibuat](img/06-console-created.jpg)

Saat tenant dibuat, sistem langsung menyiapkan **bagan akun (Chart of Accounts) ISAK 335 (d/h ISAK 35)**, **6 peran beserta
hak aksesnya**, dan **akun admin** sekolah — semuanya sekaligus.

<!-- internal -->
> **🔧 Internal Nexora (tidak ikut di PDF tenant):** provisioning atomik dalam satu transaksi: schema `t_al_musabbihin` + COA + role_permissions + admin; gagal satu langkah → semuanya di-rollback.
<!-- /internal -->

### 4.6 Kelola tenant
Klik nama sekolah di daftar untuk membuka halaman kelola:

- **Identitas sekolah** — lengkapi *Kepala sekolah* (Ust. Ahmad Fauzi, S.Pd.I) dan *Bendahara*
  (Siti Rahmawati, S.E.) agar muncul di laporan → **Simpan identitas**.
- **Logo & tema** — ganti logo (centang *Pertahankan warna* bila warna tidak ingin berubah), atur warna
  **Primer, Sekunder, Aksen** dan **Sidebar** → **Simpan warna**.
  Warna Sidebar juga mewarnai latar halaman login; warna yang terlalu terang otomatis digelapkan agar menu tetap terbaca.
- **Atribusi** — centang/hapus centang *Tampilkan atribusi di halaman login & sidebar*; ubah **Teks atribusi** (bawaan
  "NexFinance") dengan tombol **B** / *I* / U untuk tebal, miring, garis bawah (maks. 120 karakter, kosongkan untuk logo
  Nexora saja) → **Simpan atribusi**. Pratinjau tampil di sebelahnya.
- **Halaman login** — unggah foto sekolah (JPG/PNG/WEBP, maks. 8 MB, disarankan lanskap ±1920×1080). Foto tampil
  di halaman login sekolah; **Hapus gambar login** mengembalikan tampilan tanpa foto. Isi **Judul sambutan** dan
  **Pesan sambutan** bila ingin teks sendiri (kosongkan untuk teks bawaan "Selamat datang di …") → **Simpan teks login**.
- **Domain** — tambah domain sekolah, hapus domain (domain terakhir tidak bisa dihapus).
- **Nonaktifkan / Aktifkan** — tenant nonaktif langsung tidak bisa login (berguna bila tagihan tertunggak).

![Kelola tenant](img/07-console-tenant-detail.jpg)

- **Akses admin → Reset password** — isi username **atau email** user mana pun di sekolah itu (mis.
  `admin-almusabbihin` atau `bendahara@al-musabbihin.sch.id`) → password sementara baru tampil sekali;
  user wajib menggantinya saat login.

![Reset password admin](img/09-console-reset-password-form.jpg)

Pengaturan **Logo & tema** dan **Halaman login**:

![Logo, warna sidebar dan gambar halaman login](img/07b-console-login-theme.jpg)

Hasilnya di halaman login sekolah — foto tampil sebagai kartu, latar mengikuti warna sidebar:

![Halaman login dengan foto sekolah](img/10b-tenant-login-photo.jpg)

Daftar tenant setelah Al Musabbihin dibuat:

![Daftar tenant](img/08-console-list.jpg)

### 4.7 Jejak audit
Setiap tindakan tim Nexora di Console (membuat sekolah, mengubah logo atau domain, reset password,
menonaktifkan) tercatat lengkap dengan waktu dan pelakunya.

<!-- internal -->
> **🔧 Internal Nexora (tidak ikut di PDF tenant):** audit di `GET /api/v1/console/audit` (token operator). Onboarding tanpa klik: `docs/tenants/<slug>/tenant.json` + `logo.png` di repo, variabel `ONBOARD_TENANTS=al-musabbihin` di environment GitHub — setiap deploy membuat tenant yang belum ada (password sementara **tidak** dicetak di log; terbitkan lewat **Reset password**).
<!-- /internal -->

---
<!-- /nexora -->

## 5. POV Admin Sekolah (Super Admin)

**Alamat:** `https://almusabbihin-nexfinance.nexoratech.co/login` · **Akun:** `admin-almusabbihin`

### 5.1 Login pertama
Halaman login sudah memakai **foto, logo, nama, dan warna sekolah**. Login bisa memakai **email atau username**.

![Login sekolah](img/10b-tenant-login-photo.jpg)

Setelah login dengan password sementara, muncul dialog **Ganti password sementara** yang tidak bisa
dilewati. Isi password sementara, password baru (min. 8 karakter), konfirmasi → **Simpan password**.

![Wajib ganti password](img/11-tenant-force-password.jpg)

> Untuk keamanan, login dibatasi (rate-limit) bila terlalu banyak percobaan salah dari alamat yang sama.

### 5.2 Tur aplikasi & bantuan
Pengguna baru disambut **tur singkat (±1 menit, 8 langkah)**. Bisa dilewati dan dibuka lagi kapan saja dari
tombol **?** di kanan bawah atau menu **Bantuan**.

![Sambutan pengguna baru](img/12-tenant-onboarding-welcome.jpg)

![Langkah tur](img/13-tenant-tour-step.jpg)

### 5.3 Dashboard awal (sekolah baru = data bersih)
Semua angka mulai dari **nol** — tidak ada angka contoh. Grafik terisi otomatis setelah transaksi.

![Dashboard kosong](img/14-tenant-dashboard-empty.jpg)

### 5.4 Saldo awal (wajib sebelum transaksi)
Menu **Akuntansi** → **Saldo Awal**. Isi posisi keuangan sekolah per tanggal mulai memakai NexFinance.
Selisih aset dan kewajiban otomatis dicatat sebagai *Dana Tidak Terikat* (aset bersih).
Isi tanah & bangunan sebesar **harga perolehan**; akumulasi penyusutannya dicatat di tab **Aset Tetap** (6.7).

| Akun | Contoh Al Musabbihin (per 1 Juli 2026) |
| --- | --- |
| 1000 Kas | Rp 25.000.000 |
| 1100 Rekening Bank | Rp 175.000.000 |
| 1300 Persediaan ATK | Rp 5.000.000 |
| 1500 Tanah & Bangunan | Rp 1.200.000.000 (tanah Rp 700 jt + gedung Rp 500 jt) |
| 2000 Hutang Usaha | Rp 10.000.000 |

![Form saldo awal](img/15-admin-opening-balance.jpg)

### 5.5 Membuat user per peran
Menu **Role & Akses** → **Tambah user** → isi Nama, Email, **Password awal**, Role → **Simpan**.
User baru **wajib mengganti password awal** saat login pertama.

![Tambah user](img/16-admin-add-user.jpg)

Hasil: 5 user dengan peran berbeda. Di bawahnya, **Matriks Akses Role → Modul** — klik badge *Bisa/Tidak*
untuk mengubah hak akses suatu peran (khusus Super Admin; tersimpan per sekolah).

![Daftar user & matriks akses](img/17-admin-users-roles.jpg)

### 5.6 Data master siswa & karyawan
**Master Siswa** → **Tambah Siswa** (NIS, kelas, nama, wali, kontak):

![Tambah siswa](img/18-admin-add-student.jpg)

![Daftar siswa](img/19-admin-students.jpg)

**Master Karyawan** → **Tambah Karyawan** (NIP, jabatan, gaji pokok, tunjangan) — dipakai untuk penggajian:

![Tambah karyawan](img/20-admin-add-employee.jpg)

![Daftar karyawan](img/21-admin-employees.jpg)

---

## 6. POV Bendahara

**Akun contoh:** `bendahara@al-musabbihin.sch.id` (login pertama → ganti password).

![Dashboard bendahara](img/22-bendahara-dashboard.jpg)

### 6.1 Membuat invoice SPP
Menu **SPP** → **Buat Invoice** → ID siswa (mis. `STU001`), nama, kelas, jumlah (Rp 750.000), bulan
(Oktober 2026) → **Buat Invoice**. Jurnal otomatis: *Piutang SPP* (D) / *Pendapatan SPP* (K).

![Buat invoice SPP](img/23-bendahara-spp-create.jpg)

### 6.2 Mencatat pembayaran
Klik **Bayar** pada invoice → pilih metode (**Transfer / Tunai / QRIS**) → **Konfirmasi**.
Jurnal otomatis: *Rekening Bank* atau *Kas* (D) / *Piutang SPP* (K).

![Catat pembayaran](img/24-bendahara-spp-pay.jpg)

Hasil: 3 invoice, 2 lunas, *collection rate* 66,7%.

![Daftar SPP](img/25-bendahara-spp-list.jpg)

### 6.3 Penggajian
Menu **Penggajian** → **Hitung Baru** → pilih karyawan & bulan → **Hitung Gaji**. Slip menampilkan
pendapatan bruto, potongan (BPJS/PPh 21) dan *take-home pay*. Contoh: Ust. Abdul Karim — bruto
Rp 6.500.000, potongan Rp 760.500, diterima Rp 5.739.500. Jurnal beban gaji, pembayaran dan potongan
terutang dibuat otomatis.

![Slip gaji](img/26-bendahara-payroll-slip.jpg)

### 6.4 Persetujuan kedua pengeluaran
Setelah Kepala Bagian menyetujui (lihat POV Kepala Bagian), Bendahara memberi **persetujuan kedua** → status menjadi
**Disetujui** dan beban langsung terjurnal.

![Pengeluaran disetujui](img/36-bendahara-expenses-approved.jpg)

### 6.5 Jurnal umum (otomatis)
Menu **Akuntansi** → **Jurnal Umum**: setiap transaksi modul tercatat lengkap dengan akun debit/kredit dan
referensi dokumennya. Total debit = total kredit (Rp 1.429.350.000 pada contoh ini).
Tombol **Tambah Jurnal** (jurnal manual/penyesuaian) dan **Saldo Awal** ada di kanan atas halaman Akuntansi.

![Jurnal umum](img/37-bendahara-journals.jpg)

### 6.6 Dana terikat (sumbangan dengan pembatasan)
Menu **Akuntansi** → tab **Dana Terikat**. Sumbangan yang dibatasi pemberinya (mis. donasi renovasi musala, wakaf)
dicatat sebagai **aset neto dengan pembatasan**, terpisah dari dana operasional sekolah.

- **Terima dana terikat** — pilih jenis dana (*Dibatasi waktu/tujuan* atau *Dibatasi permanen*), tanggal, jumlah,
  diterima ke **rekening bank** atau **kas tunai**, dan keterangan → **Simpan penerimaan**.
- **Lepaskan pembatasan** — saat tujuan dana terpenuhi (mis. renovasi selesai), lepaskan sebesar dana yang sudah
  terpakai. Dana pindah menjadi aset neto tanpa pembatasan. Biaya renovasinya sendiri tetap dicatat lewat
  **Pengeluaran** seperti biasa.
- Jumlah yang dilepaskan **tidak bisa melebihi saldo** dana, dan dana **permanen** (wakaf) tidak dapat dilepaskan.

![Mencatat penerimaan dana terikat](img/37b-bendahara-dana-terikat-terima.jpg)

Pelepasan Rp 20.000.000 ditolak karena saldo dana renovasi hanya Rp 15.000.000:

![Pelepasan melebihi saldo ditolak](img/37c-bendahara-dana-terikat-melebihi.jpg)

Setelah melepaskan Rp 6.000.000 (renovasi tahap 1 selesai), saldo dan riwayatnya:

![Saldo dan riwayat dana terikat](img/37d-bendahara-dana-terikat-saldo.jpg)

### 6.7 Aset tetap & penyusutan
Menu **Akuntansi** → tab **Aset Tetap**. ISAK 335 menyajikan aset tetap sebesar **harga perolehan dikurangi akumulasi
penyusutan**. Daftarkan setiap aset, lalu catat penyusutan bulanan (metode **garis lurus**) hingga bulan berjalan.

| Isian | Keterangan |
| --- | --- |
| **Kategori** | Tanah (tidak disusutkan), Bangunan (saran 240 bulan), Peralatan (48 bulan), Kendaraan (96 bulan) — masa manfaat bisa diubah |
| **Status aset** | *Baru dibeli* → pembelian langsung terjurnal dari rekening bank/kas tunai. *Sudah dimiliki* → aset yang sudah ada di saldo awal; isi bulan mulai disusutkan dan akumulasi penyusutan saat ini |
| **Nilai residu** | Perkiraan nilai sisa di akhir masa manfaat (boleh 0) |

Contoh Al Musabbihin: tanah Rp 700.000.000 dan gedung Rp 500.000.000 (dibangun Juli 2015, masa manfaat 240 bulan,
akumulasi penyusutan Rp 275.000.000 per 30 Juni 2026) didaftarkan sebagai *sudah dimiliki*; laptop lab komputer
Rp 24.000.000 dibeli 5 Oktober 2026.

![Mendaftarkan gedung yang sudah dimiliki](img/37e-bendahara-aset-tetap-form.jpg)

Tombol **Catat penyusutan s.d. <bulan berjalan>** mencatat semua bulan yang tertunda sekaligus (contoh: 5 jurnal,
Rp 8.833.332 — gedung Juli–Oktober Rp 2.083.333/bulan dan laptop Oktober Rp 500.000). Menekannya lagi tidak
mencatat ganda. Kotak **Kesesuaian daftar aset dengan buku besar** memastikan daftar aset sama dengan saldo akun
1500, 1510, dan 1590; bila ada selisih, periksa saldo awal atau daftar aset.

![Daftar aset tetap setelah penyusutan](img/37f-bendahara-aset-tetap-register.jpg)

> Kebijakan masa manfaat dan bulan mulai penyusutan sebaiknya dikonfirmasi bendahara/akuntan sekolah sebelum
> penyusutan pertama dicatat.

### 6.8 Laporan keuangan ISAK 335 & PDF
Menu **Laporan** → pilih **tahun**. Laporan disusun sesuai **ISAK 335 (d/h ISAK 35)** — standar penyajian laporan
keuangan entitas berorientasi nonlaba — dan semua angkanya dihitung dari jurnal. Aset neto selalu disajikan dalam
dua kelas: **tanpa pembatasan** dan **dengan pembatasan** dari pemberi sumber daya.

| Tab | Isi |
| --- | --- |
| **Posisi Keuangan** | Aset (lancar & tidak lancar — aset tetap neto setelah akumulasi penyusutan), liabilitas, dan aset neto per kelas |
| **Penghasilan Komprehensif** | Pendapatan & beban tanpa pembatasan, pendapatan dengan pembatasan, total penghasilan komprehensif |
| **Perubahan Aset Neto** | Saldo awal, surplus tahun berjalan, aset neto yang dibebaskan dari pembatasan, saldo akhir |
| **Arus Kas** | Metode langsung: aktivitas operasi, investasi, dan pendanaan sampai saldo kas akhir |
| **Catatan (CALK)** | Catatan A–G (termasuk G. Aset tetap dan penyusutan) yang disusun otomatis — tinjau dan lengkapi oleh bendahara/akuntan sebelum diterbitkan |
| **Tren Bulanan** | Grafik pendapatan, beban, dan surplus per bulan (pendukung, bukan bagian laporan resmi) |

Di bawahnya, tabel **Klasifikasi akun** menunjukkan kelas aset neto dan aktivitas arus kas setiap akun.

![Laporan posisi keuangan](img/38-bendahara-report-position.jpg)

![Laporan penghasilan komprehensif](img/39-bendahara-report-income.jpg)

![Laporan perubahan aset neto](img/39b-bendahara-report-netassets.jpg)

![Laporan arus kas](img/39c-bendahara-report-cashflow.jpg)

![Catatan atas laporan keuangan](img/39d-bendahara-report-notes.jpg)

Pada contoh ini total aset Rp 1.157.877.168 (aset tetap neto Rp 940.166.668), total aset neto Rp 1.144.966.668
(tanpa pembatasan Rp 1.110.966.668, dengan pembatasan Rp 34.000.000), dan kas akhir Rp 209.810.500.

Tombol **Unduh PDF** menghasilkan `al-musabbihin_Laporan_Keuangan_2026.pdf` (7 halaman: ringkasan, empat laporan,
dan Catatan A–G) dengan **kop sekolah** dan warna tema sekolah:

![PDF halaman 1 — ringkasan](img/47-report-pdf-1.jpg)

![PDF halaman 2 — posisi keuangan](img/47-report-pdf-2.jpg)

![PDF halaman 6 — catatan atas laporan keuangan](img/47-report-pdf-6.jpg)

![PDF halaman 7 — catatan G, aset tetap dan penyusutan](img/47-report-pdf-7.jpg)

---

## 7. POV Staf

**Akun contoh:** `staff@al-musabbihin.sch.id`. Login pertama memakai password awal dari admin → wajib ganti:

![Staf login pertama](img/27-staff-first-login-force.jpg)

Staf hanya melihat menu sesuai haknya (Dashboard dan Pengeluaran):

![Dashboard staf](img/28-staff-dashboard.jpg)

### 7.1 Mengajukan pengeluaran
Menu **Pengeluaran** → **Ajukan Pengeluaran** → judul, jumlah, kategori, keterangan → **Ajukan**.

![Ajukan pengeluaran](img/29-staff-expense-submit.jpg)

Pengajuan berstatus **Menunggu** sampai mendapat **2 persetujuan dari 2 orang berbeda**:

![Pengeluaran menunggu](img/30-staff-expenses-pending.jpg)

---

## 8. POV Kepala Bagian

**Akun contoh:** `kabag@al-musabbihin.sch.id`.

![Dashboard kepala bagian](img/31-kabag-dashboard.jpg)

### 8.1 Persetujuan pertama (kontrol ganda)
Menu **Pengeluaran** → **Setuju** pada baris pengajuan.

![Daftar untuk disetujui](img/32-kabag-expense-approve.jpg)

Notifikasi menegaskan bahwa ini **persetujuan 1 dari 2** — masih menunggu orang kedua:

![Persetujuan 1 dari 2](img/32b-kabag-approval-1of2.jpg)

Bila orang yang sama mencoba menyetujui lagi, sistem **menolak** — persetujuan kedua harus dari orang lain:

![Kontrol ganda menolak persetujuan ulang](img/32c-kabag-dual-control-blocked.jpg)

### 8.2 Pengadaan: PR → PO → terima barang
1. **Pengadaan** → **Buat PR** → nama item, estimasi biaya, jumlah, alasan → **Buat PR**.

![Buat PR](img/33-kabag-pr-create.jpg)

![Daftar PR](img/33b-kabag-pr-list.jpg)

2. **Buat PO** → pilih **Purchase Request** dari daftar (hanya PR yang belum punya PO; estimasi biaya terisi otomatis), isi vendor dan total biaya → **Buat PO**.

![Buat PO](img/34-kabag-po-create.jpg)

3. Saat barang datang → **Terima Barang**. Jurnal otomatis: *Persediaan* (D) / *Hutang Usaha* (K).

![PO diterima](img/35-kabag-po-received.jpg)

---

## 9. POV Auditor & hasil akhir

### 9.1 Auditor (baca saja)
**Akun contoh:** `auditor@al-musabbihin.sch.id`. Auditor melihat Dashboard, Akuntansi dan Laporan — tanpa
tombol yang mengubah data. Tombol tambah jurnal, saldo awal, formulir dana terikat, serta formulir aset tetap dan tombol penyusutan tidak tampil; sistem juga
menolak perubahan bila dicoba dari luar tampilan.

![Dashboard auditor](img/40-auditor-dashboard.jpg)

![Laporan untuk auditor](img/41-auditor-reports.jpg)

![Dana terikat untuk auditor (baca saja)](img/41b-auditor-dana-terikat-readonly.jpg)

### 9.2 Dashboard setelah transaksi (Super Admin)
Semua angka berasal dari jurnal: pendapatan bulan ini Rp 1.500.000, collection SPP 66,7%,
**Saldo Kas & Bank Rp 209.810.500** (200 jt saldo awal + 1,5 jt SPP + 40 jt dana terikat − 5,74 jt gaji − 1,95 jt
pengeluaran − 24 jt laptop), beban penyusutan Rp 8,8 jt di distribusi beban, grafik tren bulanan dan distribusi beban. Ringkasan dashboard menjumlahkan semua pendapatan termasuk dana
terikat; pemisahan resmi per kelas aset neto ada di menu **Laporan**.

![Dashboard live](img/42-admin-dashboard-live.jpg)

### 9.3 Log historis
Menu **Log Historis**: siapa melakukan apa dan kapan (login, ganti password, transaksi, persetujuan).

![Log historis](img/43-admin-activity-log.jpg)

### 9.4 Pusat bantuan
Menu **Bantuan**: panduan per modul, tur aplikasi, tur per halaman, dan panduan PDF.

![Pusat bantuan](img/44-help-center.jpg)

### 9.5 Tampilan ponsel
Semua halaman responsif — login dan dashboard di ponsel:

| Login (ponsel, dengan foto sekolah) | Dashboard (ponsel) |
| --- | --- |
| ![Login ponsel](img/45b-mobile-login-photo.jpg) | ![Dashboard ponsel](img/46-mobile-dashboard.jpg) |

---

## 10. Matriks hak akses default

Dapat diubah Super Admin per sekolah (Role & Akses → klik badge). **Menu di sidebar mengikuti matriks ini**: setiap
pengguna hanya melihat modul yang boleh ia buka. Bila sebuah alamat halaman dibuka langsung tanpa hak akses, aplikasi
menampilkan **"Akses tidak tersedia"**. Persetujuan pengeluaran hanya dapat diberikan oleh Kepala Bagian, Bendahara,
Administrator, dan Super Admin — dan tidak pernah untuk pengajuan sendiri.

| Modul | Super Admin | Administrator | Bendahara | Kepala Bagian | Staf | Auditor |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| Dashboard | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| SPP | ✔ | ✔ | ✔ | – | – | – |
| Penggajian | ✔ | ✔ | ✔ | – | – | – |
| Pengeluaran | ✔ | ✔ | ✔ | ✔ | ✔ | – |
| Pengadaan | ✔ | ✔ | – | ✔ | – | – |
| Akuntansi (termasuk Dana Terikat & Aset Tetap) | ✔ | ✔ | ✔ | – | – | 👁 |
| Laporan | ✔ | ✔ | ✔ | – | – | 👁 |
| Master data | ✔ | ✔ | ✔ | – | – | – |
| Log aktivitas | ✔ | ✔ | ✔ | ✔ | – | – |
| Notifikasi | ✔ | ✔ | ✔ | ✔ | ✔ | – |

✔ = akses penuh · 👁 = hanya melihat (baca saja) · – = tidak ada akses

## 11. Jurnal otomatis (ISAK 335)

| Kejadian | Debit | Kredit |
| --- | --- | --- |
| Saldo awal aset | Akun aset (1000/1100/1300/1500) | 3000 Dana Tidak Terikat |
| Saldo awal kewajiban | 3000 Dana Tidak Terikat | Akun kewajiban (2000/2100) |
| Invoice SPP dibuat | 1200 Piutang SPP | 4000 Pendapatan SPP |
| Pembayaran SPP | 1100 Bank / 1000 Kas | 1200 Piutang SPP |
| Gaji dibayar | 5000 Beban Gaji & Honor | 1100 Rekening Bank |
| Potongan gaji terutang | 5000 Beban Gaji & Honor | 2100 Hutang Gaji |
| Pengeluaran disetujui (2/2) | Beban sesuai kategori (5100/5300/…) | 1100 Rekening Bank |
| Barang PO diterima | 1300 Persediaan | 2000 Hutang Usaha |
| Dana terikat diterima (waktu/tujuan) | 1100 Bank / 1000 Kas | 4100 Pendapatan Infaq/Sedekah |
| Dana terikat diterima (permanen) | 1100 Bank / 1000 Kas | 4200 Pendapatan Donasi |
| Pembatasan dilepaskan | 3100 Dana Terikat Temporer | 3000 Dana Tidak Terikat |
| Aset tetap baru dibeli | 1500 Tanah & Bangunan / 1510 Peralatan & Kendaraan | 1100 Rekening Bank / 1000 Kas |
| Akumulasi penyusutan aset yang sudah dimiliki | 3000 Dana Tidak Terikat | 1590 Akumulasi Penyusutan |
| Penyusutan bulanan (akhir bulan) | 5500 Beban Penyusutan | 1590 Akumulasi Penyusutan |

Setiap jurnal otomatis mencatat sumbernya (ID invoice/slip/pengeluaran/PO) dan **tidak pernah terposting
dua kali** untuk dokumen yang sama.

<!-- internal -->
## 12. Checklist go-live Al Musabbihin

> **🔧 Internal Nexora** — bagian ini tidak ikut di PDF tenant.

**Tim Nexora (sekali, ±30 menit):**
- [x] DNS A record: `console-nexfinance.nexoratech.co`, `almusabbihin-nexfinance.nexoratech.co` → IP VPS (2026-10-19).
- [x] Deploy staging → produksi hijau, TLS valid, NexFinance demo tidak tersentuh (19 Oktober 2026, lewat ops bridge
      `ops/tenant-deploy` di repo NEXFINANCE — lihat `docs/OPERATIONS.md`).
- [x] Login Console pertama: `ops@nexoratech.co` (password dikirim ke Imam via Telegram); tenant Al Musabbihin aktif.
- [ ] Console → **Reset password** `admin-almusabbihin` → kirim ke sekolah lewat kanal aman.
- [ ] Opsional: runner khusus repo ini (`deploy/register-runner.sh`), lalu hapus branch `ops/tenant-deploy`.

**Sekolah (hari pertama):**
- [ ] Admin login & ganti password, ikuti tur.
- [ ] Isi **Saldo Awal** sesuai neraca terakhir sekolah.
- [ ] Buat user per peran; tinjau matriks hak akses.
- [ ] Input data siswa & karyawan.
- [ ] Uji satu siklus: invoice SPP → bayar → cek dashboard & laporan.

**Nanti (opsional):** domain `al-musabbihin.sch.id` — sekolah membuat A record, operator menambah domain di
Console dan di `SAAS_HOSTS`, lalu deploy ulang.
<!-- /internal -->

## 13. FAQ & troubleshooting

| Pertanyaan / gejala | Jawaban |
| --- | --- |
| Lupa password admin sekolah | Hubungi tim Nexora. Kami menerbitkan password sementara baru yang wajib Anda ganti saat login. |
| Lupa password user lain (bendahara, staf, …) | Hubungi tim Nexora dengan menyebutkan email atau username user tersebut. Password sementara baru wajib diganti saat login. |
| Muncul "Tenant not found" saat membuka alamat sekolah | Alamat belum aktif atau salah ketik. Periksa alamatnya, lalu hubungi tim Nexora bila masih muncul. <!--nx--> |
| Halaman tidak ditemukan saat membuka alamat sekolah | Periksa ejaan alamat: `almusabbihin-nexfinance.nexoratech.co`. Hubungi tim Nexora bila masih muncul. <!--sch--> |
| Muncul "Layanan untuk sekolah ini sedang dinonaktifkan" | Layanan sekolah sedang dinonaktifkan. Hubungi tim Nexora. |
| Terlalu banyak percobaan login | Demi keamanan, login dikunci sementara. Tunggu beberapa menit lalu coba lagi. |
| Angka dashboard masih nol | Isi **Saldo Awal** dan mulai bertransaksi — sekolah baru tidak memakai angka contoh. |
| Pengeluaran tidak berubah menjadi Disetujui | Butuh 2 persetujuan dari **2 orang berbeda** (mis. Kepala Bagian lalu Bendahara). |
| Ingin mengganti logo atau warna aplikasi | Kirim logo baru ke tim Nexora — warna tema dibuat ulang otomatis dari logo. |
| Ingin mengganti foto atau teks sambutan halaman login | Kirim foto sekolah (lanskap, ±1920×1080) dan teks sambutan yang diinginkan ke tim Nexora. |
| Ingin memakai domain sekolah (mis. `al-musabbihin.sch.id`) | Hubungi tim Nexora; pengelola domain sekolah cukup mengikuti instruksi singkat yang kami kirimkan. |
| Apa itu ISAK 335? Bedanya dengan ISAK 35? | Standar penyajian laporan keuangan entitas berorientasi nonlaba dari IAI. ISAK 35 dinomori ulang menjadi ISAK 335 sejak 1 Januari 2024 tanpa perubahan isi. |
| Donasi pembangunan / wakaf dicatat di mana? | Menu **Akuntansi** → **Dana Terikat** → *Terima dana terikat*. Jangan dicatat sebagai SPP atau pendapatan biasa. |
| Dana terikat sudah dipakai sesuai tujuannya | Catat biayanya di **Pengeluaran**, lalu **Lepaskan pembatasan** sebesar dana yang terpakai. |
| Mengapa nilai gedung di laporan lebih kecil dari harga belinya? | Aset tetap disajikan sebesar harga perolehan dikurangi akumulasi penyusutan (nilai buku), sesuai ISAK 335. |
| Kapan penyusutan dicatat? | Setiap awal bulan, buka **Akuntansi** → **Aset Tetap** → **Catat penyusutan**. Bulan yang tertunda ikut tercatat; tidak ada pencatatan ganda. |
| Tanah ikut disusutkan? | Tidak. Tanah dicatat sebesar harga perolehan tanpa penyusutan. |
| Kotak kesesuaian menunjukkan "selisih" | Daftar aset belum sama dengan saldo akun aset tetap. Lengkapi daftar aset atau periksa saldo awal. |
| Catatan atas Laporan Keuangan siap diterbitkan? | Catatan disusun otomatis dari pembukuan; tinjau dan lengkapi oleh bendahara/akuntan sekolah sebelum diterbitkan. |
| Keamanan dan cadangan data | Data sekolah dicadangkan otomatis setiap hari. Hubungi tim Nexora untuk ekspor atau pemulihan data. |

<!-- internal -->
> **🔧 Internal Nexora (jawaban teknis):** reset password → Console → tenant → **Reset password** (username
> atau email). "Tenant not found" → host belum terdaftar di Console atau DNS/`SAAS_HOSTS` belum diatur.
> Nonaktif → Console → **Aktifkan**. Login dikunci → rate-limit per tenant + IP (`LOGIN_RATE_LIMIT_MAX`).
> Logo/warna → Console → Logo & tema. Backup → `pg_dump` per schema harian (retensi 14 hari), restore per
> sekolah: `docs/OPERATIONS.md` → Backups & restore.
<!-- /internal -->

<!-- internal -->
## 14. Catatan kualitas uji E2E

> **🔧 Internal Nexora** — bagian ini tidak ikut di PDF tenant.

Dokumen ini dihasilkan dari uji end-to-end penuh lintas 6 peran di atas database bersih. Selama uji, cacat
berikut ditemukan **dan diperbaiki** (dengan test otomatis) sebelum dokumen final dibuat:

| Temuan | Dampak | Perbaikan |
| --- | --- | --- |
| Satu orang bisa memberi 2 persetujuan pengeluaran | Kontrol ganda jebol | Persetujuan kedua wajib dari user berbeda (berdasarkan ID user) |
| User buatan admin tidak wajib ganti password | Password awal diketahui admin | Wajib ganti password saat login pertama |
| Modul Pengadaan selalu kosong (beda nama field API) | PR/PO tidak terlihat | Frontend membaca format respons API |
| PR/PO dari form gagal disimpan (field `item`/`totalCost`) | Pengadaan tidak bisa dipakai | Backend menerima kedua format, data lama tetap terbaca |
| Tombol "Terima Barang" tidak pernah muncul | Persediaan tidak terjurnal | Status `issued` dikenali sebagai PO terbuka |
| Judul pengeluaran hilang | Daftar & jurnal kurang jelas | Judul disimpan dan dipakai di jurnal |
| Hydration mismatch di halaman Role & Akses | Peringatan/render ulang di browser | Data user dibaca setelah mount |
| Reset password Console hanya cocok ke username | User berbasis email tidak bisa di-reset | Isian dicocokkan ke username **dan** email |
| Notifikasi "disetujui" pada persetujuan pertama | Menyesatkan | Pesan "Persetujuan 1 dari 2 …" + pesan error dari server |
| (v1.3) Donasi/infaq terikat ikut menambah Dana Tidak Terikat | Laporan tidak sesuai ISAK 335 | Dua kelas aset neto; pendapatan terikat tetap di kelas dengan pembatasan |
| (v1.3) Auditor ("baca saja") bisa membuat jurnal, saldo awal, dan dana terikat lewat API | Kontrol akses jebol | Semua aksi tulis Akuntansi ditolak untuk auditor (403) + tombol disembunyikan |
| (v1.3) Pesan "melebihi saldo" menampilkan angka mentah | Kurang jelas | Saldo tersedia ditampilkan dalam format Rupiah |
| (v1.4) Final review semua peran: 15 temuan (validasi nominal/tanggal & jurnal tidak seimbang, gaji ganda per bulan, PO tanpa PR, staf bisa menyetujui pengeluaran sendiri, sesi password sementara & user nonaktif masih bisa memakai API, admin bisa menonaktifkan Super Admin, menu tidak sesuai peran, ID PR diketik manual, dll.) | Data & kontrol akses | Semua diperbaiki dengan tes; rincian akar masalah di `docs/qa/FINAL_REVIEW_2026-10-21.md` |

| (v1.5) Setelah menyimpan aset, kategori kembali ke Bangunan tetapi masa manfaat tetap 48 bulan | Masa manfaat aset berikutnya bisa salah | Kategori dan masa manfaat sarannya dipertahankan (tes `fixed-assets.test.tsx`) |
| (v1.5) Header Akuntansi: dua tombol "Tambah Jurnal" dan tombol berantakan | Tampilan membingungkan | Satu grup aksi kanan atas, tombol duplikat di keadaan kosong dihapus (tes `accounting-header.test.tsx`) |

**Rekomendasi berikutnya (belum dikerjakan):** pilih siswa dari master saat membuat invoice SPP (saat ini
ID & nama diketik), alur persetujuan PR, dan wildcard DNS/TLS agar tenant baru langsung online tanpa deploy.
<!-- /internal -->
