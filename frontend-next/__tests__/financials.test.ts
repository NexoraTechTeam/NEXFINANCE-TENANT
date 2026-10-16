import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  toBalanceRows, toExpenseDistribution, toExpenseRows, toIncomeRows, toMonthlyRows,
} from '@/lib/financials';

const ROOT = path.resolve(__dirname, '..');

describe('financial mappers', () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    .map((month, i) => ({ month, pendapatan: i * 10, beban: i * 4, surplus: i * 6 }));

  it('maps the ledger series to chart rows up to the current month', () => {
    const rows = toMonthlyRows(months, { year: 2026, now: new Date('2026-03-15') });
    expect(rows).toEqual([
      { bulan: 'Jan', pendapatan: 0, beban: 0, surplus: 0, laba: 0 },
      { bulan: 'Feb', pendapatan: 10, beban: 4, surplus: 6, laba: 6 },
      { bulan: 'Mar', pendapatan: 20, beban: 8, surplus: 12, laba: 12 },
    ]);
    expect(toMonthlyRows(months, { year: 2025, now: new Date('2026-03-15') })).toHaveLength(12);
    expect(toMonthlyRows(undefined)).toEqual([]);
  });

  it('maps statements to labelled rows without inventing numbers', () => {
    const detail = {
      pendapatanSPP: 100, pendapatanLain: 20,
      bebanGaji: 50, bebanOperasional: 10, bebanPemeliharaan: 5, bebanLain: 3,
    };
    expect(toIncomeRows({ detail })).toEqual([
      { label: 'SPP Siswa', amount: 100 },
      { label: 'Donasi, Infaq & Lain-lain', amount: 20 },
    ]);
    expect(toExpenseRows({ detail }).map((r) => r.amount)).toEqual([50, 10, 5, 3]);
    expect(toIncomeRows(null).every((r) => r.amount === 0)).toBe(true);

    const bs = toBalanceRows({ detail: { kas: 1, bank: 2, piutangSPP: 0, persediaan: 4, asetTetap: 5, hutangUsaha: 6, hutangGaji: 0 } });
    expect(bs.assets.map((a) => a.value)).toEqual([1, 2, 0, 4, 5]);
    expect(bs.liabilities.map((l) => l.value)).toEqual([6, 0]);
    expect(toBalanceRows(null).assets.every((a) => a.value === 0)).toBe(true);
  });

  it('maps the expense distribution', () => {
    expect(toExpenseDistribution([{ account: '5000', name: 'Beban Gaji & Honor', value: 9 }]))
      .toEqual([{ name: 'Beban Gaji & Honor', value: 9 }]);
    expect(toExpenseDistribution(undefined)).toEqual([]);
  });
});

describe('no hardcoded financial figures in pages', () => {
  it('dashboard and reports pages do not embed money literals', () => {
    for (const file of ['app/dashboard/page.tsx', 'app/dashboard/reports/page.tsx']) {
      const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
      expect({ file, hits: src.match(/\b\d{1,3}(?:_\d{3}){2,}\b|\b\d{7,}\b/g) ?? [] }).toEqual({ file, hits: [] });
    }
  });
});
