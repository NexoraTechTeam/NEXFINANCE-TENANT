'use strict';

const { isak335Statements, classifyAccount } = require('../services/ledger');
const { DEFAULT_CHART_OF_ACCOUNTS: coa } = require('../db/defaults');

const M = 1_000_000;
const j = (date, debit, credit, amount, source) => ({
  id: `J-${date}-${debit}-${credit}-${amount}`, date, description: source?.description || 'test',
  debit: { account: debit, amount }, credit: { account: credit, amount }, ...(source ? { source } : {}),
});
const opening = { type: 'opening_balance' };
const release = (description) => ({ type: 'restriction_release', description });

// Scenario (amounts in millions): see docs/MEMORY.md 2026-10-21 ISAK 335.
const journals = [
  j('2025-12-10', '1100', '4100', 20 * M), // restricted (temporary) infaq received last year
  j('2026-01-01', '1100', '3000', 100 * M, opening),
  j('2026-01-01', '1500', '3000', 500 * M, opening),
  j('2026-02-01', '1200', '4000', 30 * M), // SPP invoiced
  j('2026-02-10', '1000', '1200', 25 * M), // SPP paid in cash
  j('2026-02-25', '5000', '1100', 15 * M), // salaries paid
  j('2026-02-25', '5000', '2100', 1 * M), // withholding payable
  j('2026-03-05', '5100', '1100', 4 * M), // operational expense
  j('2026-04-01', '1100', '4100', 10 * M), // restricted infaq (temporary)
  j('2026-04-02', '1100', '4200', 50 * M), // endowment donation (permanent)
  j('2026-05-01', '3100', '3000', 8 * M, release('Renovasi musala selesai')),
  j('2026-06-01', '1500', '1100', 12 * M), // building improvement
  j('2027-01-05', '1000', '4000', 99 * M), // next year — ignored for 2026
];

const rows = (lines) => Object.fromEntries(lines.map((l) => [l.label, l.amount]));

describe('ISAK 335 statements (2026)', () => {
  const r = isak335Statements(journals, coa, { year: 2026, entity: { name: 'SIT Contoh' } });

  it('labels the standard and the period', () => {
    expect(r.standard).toBe('ISAK 335 (d/h ISAK 35)');
    expect(r.period).toEqual({ year: 2026, start: '2026-01-01', end: '2026-12-31' });
  });

  it('presents net assets in two classes on the statement of financial position', () => {
    const fp = r.financialPosition;
    expect(fp.totals).toEqual({ assets: 691 * M, liabilities: 1 * M, netAssets: 690 * M, liabilitiesAndNetAssets: 691 * M });
    expect(fp.netAssets.unrestricted).toBe(618 * M);
    expect(fp.netAssets.restricted).toBe(72 * M);
    expect(rows(fp.netAssets.restrictedDetail)).toEqual({ 'Dibatasi waktu/tujuan': 22 * M, 'Dibatasi permanen': 50 * M });
    expect(rows(fp.assets.current)).toMatchObject({ Kas: 25 * M, 'Rekening Bank': 149 * M, 'Piutang SPP': 5 * M });
    expect(rows(fp.assets.nonCurrent)).toEqual({ 'Tanah & Bangunan': 512 * M });
  });

  it('splits comprehensive income by class (expenses reduce net assets without restrictions)', () => {
    const ci = r.comprehensiveIncome;
    expect(ci.unrestricted.totalRevenue).toBe(30 * M);
    expect(ci.unrestricted.totalExpenses).toBe(20 * M);
    expect(ci.unrestricted.surplus).toBe(10 * M);
    expect(ci.restricted.totalRevenue).toBe(60 * M);
    expect(ci.restricted.surplus).toBe(60 * M);
    expect(ci.totalComprehensiveIncome).toBe(70 * M);
    expect(rows(ci.unrestricted.expenses)).toEqual({ 'Beban Gaji & Honor': 16 * M, 'Beban Operasional': 4 * M });
  });

  it('reconciles the statement of changes in net assets, including released restrictions', () => {
    const ch = r.changesInNetAssets;
    expect(ch.unrestricted).toEqual({ opening: 600 * M, surplus: 10 * M, released: 8 * M, other: 0, closing: 618 * M });
    expect(ch.restricted).toEqual({ opening: 20 * M, surplus: 60 * M, released: -8 * M, other: 0, closing: 72 * M });
    expect(ch.total).toEqual({ opening: 620 * M, closing: 690 * M });
  });

  it('builds a direct-method cash flow by activity that ends at the cash balance', () => {
    const cf = r.cashFlows;
    expect(cf.method).toBe('direct');
    expect(rows(cf.operating.lines)).toEqual({
      'Penerimaan Piutang SPP': 25 * M,
      'Pembayaran Gaji & Honor': -15 * M,
      'Pembayaran Operasional': -4 * M,
      'Penerimaan Infaq/Sedekah': 10 * M,
    });
    expect(cf.operating.net).toBe(16 * M);
    expect(rows(cf.investing.lines)).toEqual({ 'Perolehan Tanah & Bangunan': -12 * M });
    expect(rows(cf.financing.lines)).toEqual({ 'Penerimaan Donasi': 50 * M });
    expect(cf).toMatchObject({ netChange: 54 * M, openingCash: 120 * M, closingCash: 174 * M });
    expect(cf.closingCash).toBe(r.financialPosition.cash);
  });

  it('generates notes (CALK) from the books', () => {
    const ids = r.notes.map((n) => n.id);
    expect(ids).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    const byId = Object.fromEntries(r.notes.map((n) => [n.id, n]));
    expect(byId.A.paragraphs.join(' ')).toContain('SIT Contoh');
    expect(byId.B.paragraphs.join(' ')).toMatch(/SAK Entitas Privat.*ISAK 335/);
    expect(rows(byId.C.rows)).toEqual({ Kas: 25 * M, 'Rekening Bank': 149 * M });
    expect(rows(byId.D.rows)).toEqual({ 'Dibatasi waktu/tujuan': 22 * M, 'Dibatasi permanen': 50 * M });
    expect(byId.E.rows).toEqual([{ label: '2026-05-01 — Renovasi musala selesai', amount: 8 * M }]);
    expect(rows(byId.F.rows)).toEqual({ 'Beban Gaji & Honor': 16 * M, 'Beban Operasional': 4 * M });
  });
});

describe('account classification (ready for PSAK 118 subclassification)', () => {
  it('derives the net-asset class and cash-flow activity per account', () => {
    expect(classifyAccount('4000', coa)).toMatchObject({ netAssetClass: 'unrestricted', activity: 'operating' });
    expect(classifyAccount('4100', coa)).toMatchObject({ netAssetClass: 'restricted', activity: 'operating' });
    expect(classifyAccount('4200', coa)).toMatchObject({ netAssetClass: 'restricted', activity: 'financing' });
    expect(classifyAccount('1500', coa)).toMatchObject({ activity: 'investing' });
    expect(classifyAccount('5000', coa)).toMatchObject({ netAssetClass: 'unrestricted', activity: 'operating' });
  });

  it('honours an explicit activity set on the account', () => {
    expect(classifyAccount('4000', { ...coa, 4000: { ...coa['4000'], activity: 'investing' } }).activity).toBe('investing');
  });
});
