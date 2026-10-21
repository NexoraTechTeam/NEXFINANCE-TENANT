/**
 * ISAK 335 (d/h ISAK 35) statements: the API package (GET /accounting/reports/isak335) mapped to display rows.
 * The same rows feed the reports page and the PDF export, so both always show identical figures.
 */

export interface AmountLine { code?: string; label: string; amount: number }
export interface ClassIncome { revenue: AmountLine[]; totalRevenue: number; expenses: AmountLine[]; totalExpenses: number; surplus: number }
export interface ClassChange { opening: number; surplus: number; released: number; other: number; closing: number }
export interface CashSection { lines: AmountLine[]; net: number }
export interface Isak335Note { id: string; title: string; paragraphs?: string[]; rows?: AmountLine[] }
export interface AccountClassification {
  code: string; name: string; type: string | null; isak35: string | null;
  netAssetClass: 'unrestricted' | 'restricted' | null; activity: 'operating' | 'investing' | 'financing';
}

export interface Isak335Package {
  standard: string;
  framework: string;
  period: { year: number; start: string; end: string };
  financialPosition: {
    date: string;
    assets: { current: AmountLine[]; nonCurrent: AmountLine[] };
    liabilities: AmountLine[];
    netAssets: { unrestricted: number; restricted: number; total: number; restrictedDetail: AmountLine[] };
    cash: number;
    totals: { assets: number; liabilities: number; netAssets: number; liabilitiesAndNetAssets: number };
  };
  comprehensiveIncome: { unrestricted: ClassIncome; restricted: ClassIncome; otherComprehensiveIncome: number; totalComprehensiveIncome: number };
  changesInNetAssets: { unrestricted: ClassChange; restricted: ClassChange; total: { opening: number; closing: number } };
  cashFlows: {
    method: string; operating: CashSection; investing: CashSection; financing: CashSection;
    netChange: number; openingCash: number; closingCash: number;
  };
  notes: Isak335Note[];
  accounts: AccountClassification[];
}

export type RowKind = 'section' | 'line' | 'subtotal' | 'total';
export interface StatementRow { label: string; amount?: number; kind: RowKind }
export interface Statement { key: 'position' | 'income' | 'netassets' | 'cashflow'; title: string; rows: StatementRow[] }

const section = (label: string): StatementRow => ({ label, kind: 'section' });
const line = (label: string, amount: number): StatementRow => ({ label, amount, kind: 'line' });
const subtotal = (label: string, amount: number): StatementRow => ({ label, amount, kind: 'subtotal' });
const total = (label: string, amount: number): StatementRow => ({ label, amount, kind: 'total' });
const lines = (rows: AmountLine[]) => rows.map((r) => line(r.label, r.amount));
const sum = (rows: AmountLine[]) => rows.reduce((s, r) => s + r.amount, 0);

export const ACTIVITY_LABELS = { operating: 'Operasi', investing: 'Investasi', financing: 'Pendanaan' } as const;
export const CLASS_LABELS = { unrestricted: 'Tanpa pembatasan', restricted: 'Dengan pembatasan' } as const;

export function buildStatements(pkg: Isak335Package): Statement[] {
  const fp = pkg.financialPosition;
  const ci = pkg.comprehensiveIncome;
  const ch = pkg.changesInNetAssets;
  const cf = pkg.cashFlows;

  const position: StatementRow[] = [
    section('ASET'),
    section('Aset lancar'), ...lines(fp.assets.current), subtotal('Total aset lancar', sum(fp.assets.current)),
    section('Aset tidak lancar'), ...lines(fp.assets.nonCurrent), subtotal('Total aset tidak lancar', sum(fp.assets.nonCurrent)),
    total('TOTAL ASET', fp.totals.assets),
    section('LIABILITAS'), ...lines(fp.liabilities), subtotal('Total liabilitas', fp.totals.liabilities),
    section('ASET NETO'),
    line('Aset neto tanpa pembatasan dari pemberi sumber daya', fp.netAssets.unrestricted),
    line('Aset neto dengan pembatasan dari pemberi sumber daya', fp.netAssets.restricted),
    subtotal('Total aset neto', fp.totals.netAssets),
    total('TOTAL LIABILITAS DAN ASET NETO', fp.totals.liabilitiesAndNetAssets),
  ];

  const income: StatementRow[] = [
    section('TANPA PEMBATASAN DARI PEMBERI SUMBER DAYA'),
    section('Pendapatan'), ...lines(ci.unrestricted.revenue), subtotal('Total pendapatan', ci.unrestricted.totalRevenue),
    section('Beban'), ...lines(ci.unrestricted.expenses), subtotal('Total beban', ci.unrestricted.totalExpenses),
    subtotal('Surplus (defisit) tanpa pembatasan', ci.unrestricted.surplus),
    section('DENGAN PEMBATASAN DARI PEMBERI SUMBER DAYA'),
    section('Pendapatan'), ...lines(ci.restricted.revenue), subtotal('Total pendapatan dengan pembatasan', ci.restricted.totalRevenue),
    subtotal('Surplus (defisit) dengan pembatasan', ci.restricted.surplus),
    line('Penghasilan komprehensif lain', ci.otherComprehensiveIncome),
    total('TOTAL PENGHASILAN KOMPREHENSIF', ci.totalComprehensiveIncome),
  ];

  const changeRows = (c: ClassChange, closingLabel: string): StatementRow[] => [
    line('Saldo awal', c.opening),
    line('Surplus (defisit) tahun berjalan', c.surplus),
    line('Aset neto yang dibebaskan dari pembatasan', c.released),
    ...(c.other ? [line('Penyesuaian lain', c.other)] : []),
    subtotal(closingLabel, c.closing),
  ];
  const netassets: StatementRow[] = [
    section('ASET NETO TANPA PEMBATASAN DARI PEMBERI SUMBER DAYA'),
    ...changeRows(ch.unrestricted, 'Saldo akhir aset neto tanpa pembatasan'),
    section('ASET NETO DENGAN PEMBATASAN DARI PEMBERI SUMBER DAYA'),
    ...changeRows(ch.restricted, 'Saldo akhir aset neto dengan pembatasan'),
    total('TOTAL ASET NETO', ch.total.closing),
  ];

  const cashSection = (title: string, netLabel: string, s: CashSection): StatementRow[] => [
    section(title), ...lines(s.lines), subtotal(netLabel, s.net),
  ];
  const cashflow: StatementRow[] = [
    ...cashSection('AKTIVITAS OPERASI', 'Kas neto dari aktivitas operasi', cf.operating),
    ...cashSection('AKTIVITAS INVESTASI', 'Kas neto dari aktivitas investasi', cf.investing),
    ...cashSection('AKTIVITAS PENDANAAN', 'Kas neto dari aktivitas pendanaan', cf.financing),
    subtotal('Kenaikan (penurunan) neto kas dan setara kas', cf.netChange),
    line('Kas dan setara kas awal tahun', cf.openingCash),
    total('Kas dan setara kas akhir tahun', cf.closingCash),
  ];

  return [
    { key: 'position', title: 'Laporan Posisi Keuangan', rows: position },
    { key: 'income', title: 'Laporan Penghasilan Komprehensif', rows: income },
    { key: 'netassets', title: 'Laporan Perubahan Aset Neto', rows: netassets },
    { key: 'cashflow', title: 'Laporan Arus Kas', rows: cashflow },
  ];
}

const idr = (n: number, currency: boolean) => new Intl.NumberFormat('id-ID', currency
  ? { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }
  : { maximumFractionDigits: 0 }).format(Math.abs(n || 0));

/** Accounting convention: negatives in parentheses. */
export const formatAmount = (n: number, { currency = true } = {}) => (n < 0 ? `(${idr(n, currency)})` : idr(n, currency));

/** [label, amount] rows for the PDF tables (section headers carry no amount). */
export const toTableBody = (rows: StatementRow[]): string[][] =>
  rows.map((r) => [r.label, r.amount === undefined ? '' : formatAmount(r.amount, { currency: false })]);
