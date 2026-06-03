# NexFinance — Yayasan ISAk 35 School Finance System

Sistem keuangan sekolah berbasis web dengan fokus operasional harian, kontrol akses berbasis role (RBAC), audit log, dan notifikasi multi-channel (Email + WhatsApp).

## Highlights

- **Dashboard finansial** dengan KPI pemasukan/pengeluaran dan distribusi beban
- **Manajemen SPP**: invoice, pembayaran, bukti pembayaran, dan pelaporan koleksi
- **Payroll**: perhitungan gaji, histori run payroll, dan ringkasan biaya SDM
- **Expense & Procurement**: alur pengajuan, approval, PR/PO, dan penerimaan barang
- **Accounting & Reports**: jurnal, neraca, laba-rugi, serta ringkasan lintas modul
- **Master Data**: siswa, karyawan, user, role, dan matriks akses role → menu
- **Activity Logs**: jejak aktivitas lintas modul
- **Notifications**: pengiriman notifikasi via Email dan WhatsApp

## Arsitektur Singkat

- **Frontend**: React (`frontend/`)
- **Backend API**: Express (`backend/`)
- **Auth**: JWT + RBAC per modul
- **Data saat ini**: in-memory store di `backend/src/db.js` (siap diadaptasi ke DB persisten)

## Daftar Modul

| Modul | Route Frontend | Prefix API |
| --- | --- | --- |
| Dashboard | `/dashboard` | `/api/v1/dashboard` |
| SPP | `/spp` | `/api/v1/spp` |
| Payroll | `/payroll` | `/api/v1/payroll` |
| Expenses | `/expenses` | `/api/v1/expenses` |
| Procurement | `/procurement` | `/api/v1/procurement` |
| Accounting | `/accounting` | `/api/v1/accounting` |
| Reports | `/reports` | kombinasi endpoint laporan modul |
| Master (Siswa/Karyawan/Akses) | `/master/*` | `/api/v1/master` |
| Activity Logs | `/activity-logs` | `/api/v1/activity` |
| Notifications | `/notifications` | `/api/v1/notifications` |

## Role & Permission

Role default:

- `super_admin`
- `admin`
- `bendahara`
- `kabag`
- `staff`
- `auditor`

Definisi permission role ada di:

- `backend/src/middleware/rbac.js`
- dapat dikelola dari UI **Master → Hak Akses Role** (editable untuk Super Admin)

## Quick Start (Local Development)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend berjalan di `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend berjalan di `http://localhost:3000`.

## Environment Variables Penting

Contoh backend ada di `backend/.env.example`.

Variabel notifikasi:

- `EMAIL_PROVIDER_URL` / `EMAIL_WEBHOOK_URL`
- `EMAIL_PROVIDER_TOKEN`
- `WHATSAPP_META_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_WEBHOOK_URL` (fallback opsional)

Variabel frontend:

- `REACT_APP_API_URL` (default: `http://localhost:5000/api/v1`)

## Akun Demo (seed in-memory)

Sumber: `backend/src/db.js`

- `superadmin@nexfinance.com` / `superadmin123`
- `admin@nexfinance.com` / `admin123`
- `bendahara@nexfinance.com` / `bendahara123`
- `kabag@nexfinance.com` / `kabag123`
- `staff@nexfinance.com` / `staff123`
- `auditor@nexfinance.com` / `auditor123`

## Dokumentasi

- [API Documentation](docs/API_DOCUMENTATION.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [ISAK35 Compliance](docs/ISAK35_COMPLIANCE.md)
- [Module Guide (Markdown)](docs/NEXFINANCE_MODULE_GUIDE.md)
- **Module Guide (PDF)**: `docs/NEXFINANCE_MODULE_GUIDE.pdf`
- [User Manual Book (Markdown)](docs/NEXFINANCE_USER_MANUAL_BOOK.md)
- **User Manual Book (PDF)**: `docs/NEXFINANCE_USER_MANUAL_BOOK.pdf`

## Scripts

### Backend

```bash
cd backend
npm run dev
npm run start
npm run test
npm run lint
```

### Frontend

```bash
cd frontend
npm start
npm run build
npm test
```

## Status

Project aktif dan terus dikembangkan untuk kebutuhan operasional keuangan sekolah Yayasan ISAk 35.
