/**
 * Maps ledger-based API responses to the row shapes used by charts, tables and the PDF export.
 * Missing data maps to zeros — never to invented figures.
 */

export interface LedgerMonth { month: string; pendapatan: number; beban: number; surplus: number }
export interface MonthlyRow { bulan: string; pendapatan: number; beban: number; surplus: number; laba: number }
export interface StatementLike { detail?: Record<string, number> | null }
export interface AmountRow { label: string; amount: number }
export interface ValueRow { name: string; value: number }

const val = (detail: Record<string, number> | null | undefined, key: string) => Number(detail?.[key]) || 0;

/** Rows for the given year; the current year is cut at the current month. */
export function toMonthlyRows(
  months: LedgerMonth[] | undefined,
  { year = new Date().getFullYear(), now = new Date() }: { year?: number; now?: Date } = {},
): MonthlyRow[] {
  if (!months?.length) return [];
  const limit = year === now.getFullYear() ? now.getMonth() + 1 : months.length;
  return months.slice(0, limit).map((m) => ({
    bulan: m.month,
    pendapatan: m.pendapatan,
    beban: m.beban,
    surplus: m.surplus,
    laba: m.surplus,
  }));
}

export function toIncomeRows(statement: StatementLike | null | undefined): AmountRow[] {
  const d = statement?.detail;
  return [
    { label: 'SPP Siswa', amount: val(d, 'pendapatanSPP') },
    { label: 'Donasi, Infaq & Lain-lain', amount: val(d, 'pendapatanLain') },
  ];
}

export function toExpenseRows(statement: StatementLike | null | undefined): AmountRow[] {
  const d = statement?.detail;
  return [
    { label: 'Gaji & Honor', amount: val(d, 'bebanGaji') },
    { label: 'Operasional', amount: val(d, 'bebanOperasional') },
    { label: 'Pemeliharaan', amount: val(d, 'bebanPemeliharaan') },
    { label: 'Utilitas & Lain', amount: val(d, 'bebanLain') },
  ];
}

export function toBalanceRows(sheet: StatementLike | null | undefined): { assets: ValueRow[]; liabilities: ValueRow[] } {
  const d = sheet?.detail;
  return {
    assets: [
      { name: 'Kas', value: val(d, 'kas') },
      { name: 'Rekening Bank', value: val(d, 'bank') },
      { name: 'Piutang SPP', value: val(d, 'piutangSPP') },
      { name: 'Persediaan', value: val(d, 'persediaan') },
      { name: 'Aset Tetap', value: val(d, 'asetTetap') },
    ],
    liabilities: [
      { name: 'Hutang Usaha', value: val(d, 'hutangUsaha') },
      { name: 'Hutang Gaji', value: val(d, 'hutangGaji') },
    ],
  };
}

export function toExpenseDistribution(
  rows: Array<{ account: string; name: string; value: number }> | undefined,
): ValueRow[] {
  return (rows ?? []).map(({ name, value }) => ({ name, value }));
}

/** Compact axis labels: 750rb, 4Jt, 2.5M. */
export function axisMoney(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${+(v / 1e9).toFixed(1)}M`;
  if (abs >= 1e6) return `${+(v / 1e6).toFixed(1)}Jt`;
  if (abs >= 1e3) return `${Math.round(v / 1e3)}rb`;
  return `${v}`;
}

/** Card/tooltip amounts: Rp 2.5M, Rp 45.0Jt, Rp 750K; negatives keep the sign in front (-Rp 36.8Jt). */
export function shortMoney(n: number): string {
  const abs = Math.abs(n || 0);
  const body = abs >= 1e9 ? `Rp ${(abs / 1e9).toFixed(1)}M`
    : abs >= 1e6 ? `Rp ${(abs / 1e6).toFixed(1)}Jt`
    : `Rp ${(abs / 1e3).toFixed(0)}K`;
  return n < 0 ? `-${body}` : body;
}

export const hasActivity = (rows: MonthlyRow[]) => rows.some((r) => r.pendapatan !== 0 || r.beban !== 0);
