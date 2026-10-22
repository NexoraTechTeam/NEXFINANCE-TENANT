import { describe, expect, it } from 'vitest';
import { payrollMonthLabel } from '../lib/payroll';

describe('payrollMonthLabel', () => {
  it('shows a picked month (YYYY-MM) like the stored ones ("Oktober 2026")', () => {
    expect(payrollMonthLabel('2026-10')).toBe('Oktober 2026');
    expect(payrollMonthLabel('2026-01')).toBe('Januari 2026');
  });

  it('keeps labels that are already written out and anything unexpected', () => {
    expect(payrollMonthLabel('Maret 2026')).toBe('Maret 2026');
    expect(payrollMonthLabel('2026-13')).toBe('2026-13');
    expect(payrollMonthLabel('')).toBe('');
  });
});
