import type { Isak335Package } from '@/lib/isak335';

const M = 1_000_000;
/** Same scenario as backend/src/__tests__/isak335.test.js (2026). */
export const PKG: Isak335Package = {
  standard: 'ISAK 335 (d/h ISAK 35)',
  framework: 'SAK Entitas Privat',
  period: { year: 2026, start: '2026-01-01', end: '2026-12-31' },
  financialPosition: {
    date: '2026-12-31',
    assets: {
      current: [{ code: '1000', label: 'Kas', amount: 25 * M }, { code: '1100', label: 'Rekening Bank', amount: 149 * M }, { code: '1200', label: 'Piutang SPP', amount: 5 * M }],
      nonCurrent: [{ code: '1500', label: 'Tanah & Bangunan', amount: 512 * M }],
    },
    liabilities: [{ code: '2100', label: 'Hutang Gaji', amount: 1 * M }],
    netAssets: { unrestricted: 618 * M, restricted: 72 * M, total: 690 * M, restrictedDetail: [{ label: 'Dibatasi waktu/tujuan', amount: 22 * M }, { label: 'Dibatasi permanen', amount: 50 * M }] },
    cash: 174 * M,
    totals: { assets: 691 * M, liabilities: 1 * M, netAssets: 690 * M, liabilitiesAndNetAssets: 691 * M },
  },
  comprehensiveIncome: {
    unrestricted: {
      revenue: [{ code: '4000', label: 'Pendapatan SPP', amount: 30 * M }], totalRevenue: 30 * M,
      expenses: [{ code: '5000', label: 'Beban Gaji & Honor', amount: 16 * M }, { code: '5100', label: 'Beban Operasional', amount: 4 * M }], totalExpenses: 20 * M,
      surplus: 10 * M,
    },
    restricted: {
      revenue: [{ code: '4100', label: 'Pendapatan Infaq/Sedekah', amount: 10 * M }, { code: '4200', label: 'Pendapatan Donasi', amount: 50 * M }], totalRevenue: 60 * M,
      expenses: [], totalExpenses: 0, surplus: 60 * M,
    },
    otherComprehensiveIncome: 0,
    totalComprehensiveIncome: 70 * M,
  },
  changesInNetAssets: {
    unrestricted: { opening: 600 * M, surplus: 10 * M, released: 8 * M, other: 0, closing: 618 * M },
    restricted: { opening: 20 * M, surplus: 60 * M, released: -8 * M, other: 0, closing: 72 * M },
    total: { opening: 620 * M, closing: 690 * M },
  },
  cashFlows: {
    method: 'direct',
    operating: { lines: [{ label: 'Penerimaan Piutang SPP', amount: 25 * M }, { label: 'Pembayaran Gaji & Honor', amount: -15 * M }, { label: 'Pembayaran Operasional', amount: -4 * M }, { label: 'Penerimaan Infaq/Sedekah', amount: 10 * M }], net: 16 * M },
    investing: { lines: [{ label: 'Perolehan Tanah & Bangunan', amount: -12 * M }], net: -12 * M },
    financing: { lines: [{ label: 'Penerimaan Donasi', amount: 50 * M }], net: 50 * M },
    netChange: 54 * M, openingCash: 120 * M, closingCash: 174 * M,
  },
  notes: [
    { id: 'A', title: 'Informasi umum', paragraphs: ['SIT Contoh adalah entitas berorientasi nonlaba di bidang pendidikan.'] },
    { id: 'B', title: 'Ikhtisar kebijakan akuntansi', paragraphs: ['Laporan keuangan disusun berdasarkan SAK Entitas Privat dan disajikan sesuai ISAK 335 (d/h ISAK 35).'] },
    { id: 'C', title: 'Kas dan setara kas', rows: [{ label: 'Kas', amount: 25 * M }, { label: 'Rekening Bank', amount: 149 * M }] },
    { id: 'D', title: 'Aset neto dengan pembatasan', rows: [{ label: 'Dibatasi waktu/tujuan', amount: 22 * M }, { label: 'Dibatasi permanen', amount: 50 * M }] },
    { id: 'E', title: 'Aset neto yang dibebaskan dari pembatasan', rows: [{ label: '2026-05-01 — Renovasi musala selesai', amount: 8 * M }] },
    { id: 'F', title: 'Rincian beban', rows: [{ label: 'Beban Gaji & Honor', amount: 16 * M }, { label: 'Beban Operasional', amount: 4 * M }] },
  ],
  accounts: [
    { code: '4000', name: 'Pendapatan SPP', type: 'Revenue', isak35: 'Pendapatan Tidak Terikat', netAssetClass: 'unrestricted', activity: 'operating' },
    { code: '4200', name: 'Pendapatan Donasi', type: 'Revenue', isak35: 'Pendapatan Terikat Permanen', netAssetClass: 'restricted', activity: 'financing' },
  ],
};
