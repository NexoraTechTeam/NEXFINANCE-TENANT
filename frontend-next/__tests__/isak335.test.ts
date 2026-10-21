import { describe, expect, it } from 'vitest';
import { buildStatements, type StatementRow } from '@/lib/isak335';
import { PKG } from './fixtures/isak335';

const M = 1_000_000;
const amount = (rows: StatementRow[], label: string) => rows.find((r) => r.label === label)?.amount;

describe('buildStatements (ISAK 335)', () => {
  const [position, income, changes, cash] = buildStatements(PKG);

  it('returns the four statements in ISAK order', () => {
    expect([position, income, changes, cash].map((s) => s.title)).toEqual([
      'Laporan Posisi Keuangan', 'Laporan Penghasilan Komprehensif', 'Laporan Perubahan Aset Neto', 'Laporan Arus Kas',
    ]);
  });

  it('shows the two net-asset classes and balances the position', () => {
    expect(amount(position.rows, 'Aset neto tanpa pembatasan dari pemberi sumber daya')).toBe(618 * M);
    expect(amount(position.rows, 'Aset neto dengan pembatasan dari pemberi sumber daya')).toBe(72 * M);
    expect(amount(position.rows, 'TOTAL ASET')).toBe(691 * M);
    expect(amount(position.rows, 'TOTAL LIABILITAS DAN ASET NETO')).toBe(691 * M);
    expect(amount(position.rows, 'Total aset tidak lancar')).toBe(512 * M);
  });

  it('splits comprehensive income per class', () => {
    expect(amount(income.rows, 'Surplus (defisit) tanpa pembatasan')).toBe(10 * M);
    expect(amount(income.rows, 'Surplus (defisit) dengan pembatasan')).toBe(60 * M);
    expect(amount(income.rows, 'Pendapatan Donasi')).toBe(50 * M);
    expect(amount(income.rows, 'TOTAL PENGHASILAN KOMPREHENSIF')).toBe(70 * M);
  });

  it('reconciles changes in net assets including released restrictions', () => {
    const released = changes.rows.filter((r) => r.label === 'Aset neto yang dibebaskan dari pembatasan').map((r) => r.amount);
    expect(released).toEqual([8 * M, -8 * M]);
    expect(amount(changes.rows, 'Saldo akhir aset neto dengan pembatasan')).toBe(72 * M);
    expect(amount(changes.rows, 'TOTAL ASET NETO')).toBe(690 * M);
    expect(changes.rows.some((r) => r.label === 'Penyesuaian lain')).toBe(false);
  });

  it('builds the cash flow per activity down to the closing cash', () => {
    expect(amount(cash.rows, 'Kas neto dari aktivitas operasi')).toBe(16 * M);
    expect(amount(cash.rows, 'Kas neto dari aktivitas investasi')).toBe(-12 * M);
    expect(amount(cash.rows, 'Kas neto dari aktivitas pendanaan')).toBe(50 * M);
    expect(amount(cash.rows, 'Kas dan setara kas awal tahun')).toBe(120 * M);
    expect(amount(cash.rows, 'Kas dan setara kas akhir tahun')).toBe(174 * M);
  });
});

describe('accounting amounts', () => {
  it('formats negatives in parentheses and builds PDF table rows', async () => {
    const { formatAmount, toTableBody } = await import('@/lib/isak335');
    expect(formatAmount(-12 * M)).toMatch(/^\(Rp\s?12\.000\.000\)$/);
    expect(formatAmount(0)).toMatch(/^Rp\s?0$/);
    expect(toTableBody([{ label: 'ASET', kind: 'section' }, { label: 'Kas', amount: 25 * M, kind: 'line' }]))
      .toEqual([['ASET', ''], ['Kas', '25.000.000']]);
    expect(toTableBody([{ label: 'Perolehan', amount: -12 * M, kind: 'line' }])).toEqual([['Perolehan', '(12.000.000)']]);
  });
});
