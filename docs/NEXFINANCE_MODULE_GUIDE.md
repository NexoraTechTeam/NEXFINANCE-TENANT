# NexFinance Module Guide

Dokumen ini adalah panduan operasional untuk seluruh modul NexFinance (frontend + backend API).

## 1. Ringkasan Sistem

- **Frontend**: React SPA
- **Backend**: Express REST API
- **Base API**: `/api/v1`
- **Auth**: JWT Bearer Token
- **Authorization**: RBAC per modul
- **Audit**: semua aksi penting dicatat ke Activity Logs

## 2. Matriks Modul

| Modul | Tujuan | Route Frontend | Endpoint Utama |
| --- | --- | --- | --- |
| Authentication | Login, register, verifikasi token | `/login` | `/auth/*` |
| Dashboard | KPI dan ringkasan finansial | `/dashboard` | `/dashboard/kpi`, `/dashboard/monthly-report` |
| SPP | Invoice, pembayaran, bukti bayar | `/spp` | `/spp/invoices`, `/spp/payment`, `/spp/reports` |
| Payroll | Hitung gaji dan histori payroll | `/payroll` | `/payroll/employees`, `/payroll/calculate`, `/payroll/history`, `/payroll/reports` |
| Expenses | Pengajuan dan approval pengeluaran | `/expenses` | `/expenses`, `/expenses/submit`, `/expenses/:id/approve`, `/expenses/:id/reject` |
| Procurement | PR, PO, penerimaan barang | `/procurement` | `/procurement/pr`, `/procurement/po`, `/procurement/po/:id/receive`, `/procurement/reports` |
| Accounting | COA, jurnal, laporan akuntansi | `/accounting` | `/accounting/chart-of-accounts`, `/accounting/journals`, `/accounting/reports/*` |
| Reports | Laporan finansial lintas modul | `/reports` | konsumsi endpoint report di modul terkait |
| Master Data | Siswa, karyawan, user, role matrix | `/master/students`, `/master/employees`, `/master/access` | `/master/students`, `/master/employees`, `/master/users`, `/master/role-permissions/*` |
| Activity Logs | Audit trail & statistik aktivitas | `/activity-logs` | `/activity`, `/activity/stats`, `/activity/clear` |
| Notifications | Konfigurasi dan kirim notif | `/notifications` | `/notifications/config`, `/notifications/send` |

## 3. Detail Per Modul

## 3.1 Authentication

**Tujuan**
- Autentikasi user dan penyediaan data role + permissions.

**Endpoint**
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/auth/verify`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/permissions`

**Catatan**
- `login/register` menghasilkan JWT.
- `me/permissions` mengembalikan permission modul berdasar role aktif.

## 3.2 Dashboard

**Tujuan**
- Menampilkan KPI utama (pemasukan, collection rate, pending items, dsb).

**Endpoint**
- `GET /api/v1/dashboard/kpi`
- `GET /api/v1/dashboard/monthly-report`

**Output kunci**
- `monthRevenue`, `collectionRate`, `pendingItems`, `breakdown`.

## 3.3 SPP

**Tujuan**
- Kelola invoice SPP, pembayaran, dan bukti bayar.

**Endpoint**
- `GET /api/v1/spp/invoices`
- `POST /api/v1/spp/invoices`
- `POST /api/v1/spp/payment`
- `GET /api/v1/spp/reports`

**Flow inti**
1. Buat invoice.
2. Rekam pembayaran (`/payment`).
3. Jika `notify=true`, sistem mengirim notifikasi email/WA.
4. Backend mengembalikan payload `receipt` untuk cetak bukti.

## 3.4 Payroll

**Tujuan**
- Hitung payroll karyawan per periode dan simpan histori.

**Endpoint**
- `GET /api/v1/payroll/employees`
- `POST /api/v1/payroll/calculate`
- `GET /api/v1/payroll/history`
- `GET /api/v1/payroll/reports`

**Catatan**
- `calculate` membutuhkan `employeeId` dan `month`.
- Hasil tersimpan sebagai payroll run.

## 3.5 Expenses

**Tujuan**
- Pengajuan biaya operasional dan approval bertingkat.

**Endpoint**
- `GET /api/v1/expenses`
- `POST /api/v1/expenses/submit`
- `POST /api/v1/expenses/:id/approve`
- `POST /api/v1/expenses/:id/reject`

**Catatan**
- Expense status: `pending`, `approved`, `rejected`.
- Approval count menentukan final status approved.

## 3.6 Procurement

**Tujuan**
- Kelola pengadaan dari Purchase Request ke Purchase Order.

**Endpoint**
- `GET /api/v1/procurement/pr`
- `POST /api/v1/procurement/pr`
- `GET /api/v1/procurement/po`
- `POST /api/v1/procurement/po`
- `POST /api/v1/procurement/po/:id/receive`
- `GET /api/v1/procurement/reports`

**Flow inti**
1. Buat PR.
2. Buat PO dari PR.
3. Tandai PO diterima.

## 3.7 Accounting

**Tujuan**
- Pencatatan akuntansi dan output laporan keuangan.

**Endpoint**
- `GET /api/v1/accounting/chart-of-accounts`
- `GET /api/v1/accounting/journals`
- `POST /api/v1/accounting/journals`
- `GET /api/v1/accounting/reports/balance-sheet`
- `GET /api/v1/accounting/reports/income-statement`

## 3.8 Reports

**Tujuan**
- Menyediakan dashboard laporan lintas modul.

**Sumber data**
- SPP reports
- Payroll reports
- Procurement reports
- Accounting reports
- Dashboard monthly report

## 3.9 Master Data

**Tujuan**
- Menjadi pusat data referensi (siswa, karyawan, user, role permissions).

**Sub modul**
- **Master Siswa**: CRUD + filter/search.
- **Master Karyawan**: CRUD data karyawan.
- **Hak Akses Role**:
  - kelola role user (khusus super admin untuk edit role user)
  - kelola matriks akses role → module (khusus super admin)

**Endpoint**
- `GET/POST/PUT/DELETE /api/v1/master/students`
- `GET/POST/PUT/DELETE /api/v1/master/employees`
- `GET/POST/PUT/PATCH /api/v1/master/users*`
- `GET /api/v1/master/role-permissions`
- `PATCH /api/v1/master/role-permissions/:role`

## 3.10 Activity Logs

**Tujuan**
- Menyimpan jejak aktivitas untuk audit dan troubleshooting.

**Endpoint**
- `GET /api/v1/activity`
- `GET /api/v1/activity/stats`
- `DELETE /api/v1/activity/clear` (admin)

**Filter**
- `module`, `action`, `search`, `limit`, `offset`

## 3.11 Notifications

**Tujuan**
- Kirim notifikasi manual/otomatis via Email dan WhatsApp.

**Endpoint**
- `GET /api/v1/notifications/config`
- `POST /api/v1/notifications/send`

**Payload minimum**
- `channels` (`email`, `whatsapp`)
- `message`
- `to.email` dan/atau `to.phone`

## 4. RBAC dan Hak Akses

Role default:
- `super_admin`, `admin`, `bendahara`, `kabag`, `staff`, `auditor`

Permission map utama berada di:
- `backend/src/middleware/rbac.js`

Matriks akses bersifat dinamis melalui endpoint:
- `PATCH /api/v1/master/role-permissions/:role`

## 5. Integrasi Notifikasi (Email & WhatsApp)

Konfigurasi di `backend/.env`:

- Email:
  - `EMAIL_PROVIDER_URL` atau `EMAIL_WEBHOOK_URL`
  - `EMAIL_PROVIDER_TOKEN` (opsional sesuai provider)
- WhatsApp:
  - `WHATSAPP_META_TOKEN`
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_WEBHOOK_URL` (fallback opsional)

## 6. Standar Operasional Harian (Saran)

1. Login dengan role sesuai tugas.
2. Monitor KPI di Dashboard.
3. Proses transaksi harian (SPP/Payroll/Expenses/Procurement).
4. Review laporan di Reports/Accounting.
5. Cek Activity Logs untuk audit.
6. Gunakan Notifications untuk reminder atau bukti kirim info.

## 7. Troubleshooting Cepat

- **401 Unauthorized**: cek token login / masa berlaku JWT.
- **403 Access denied**: role tidak memiliki akses modul.
- **Notifikasi gagal**: validasi env provider dan endpoint webhook.
- **Data tidak muncul**: cek filter aktif, role permission, dan log activity.

## 8. Referensi File Kode

- Backend routes: `backend/src/routes/*.js`
- RBAC middleware: `backend/src/middleware/rbac.js`
- Frontend routes: `frontend/src/App.js`
- Service API frontend: `frontend/src/services/api.js`

---

Dokumen ini dapat dijadikan SOP teknis awal untuk onboarding, operasional harian, dan audit internal modul NexFinance.
