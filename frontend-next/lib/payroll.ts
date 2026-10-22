const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/** Payroll periods are stored as picked (`2026-10`) or written out (`Maret 2026`); show both the same way. */
export function payrollMonthLabel(month: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(month || '');
  const index = m ? Number(m[2]) - 1 : -1;
  return m && index >= 0 && index < 12 ? `${MONTHS[index]} ${m[1]}` : month;
}
