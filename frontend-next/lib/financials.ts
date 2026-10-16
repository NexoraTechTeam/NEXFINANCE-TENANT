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
