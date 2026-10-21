'use strict';

const { accountBalances, balanceSheet, incomeStatement, monthlySeries } = require('../services/ledger');
const { DEFAULT_CHART_OF_ACCOUNTS: coa } = require('../db/defaults');

const j = (date, debit, credit, amount) => ({
  id: `J-${date}-${debit}-${credit}`,
  date,
  description: 'test',
  debit: { account: debit, amount },
  credit: { account: credit, amount },
});

describe('ledger', () => {
  const journals = [
    j('2026-01-02', '1100', '3000', 100_000_000), // opening: bank / unrestricted funds
    j('2026-01-05', '1200', '4000', 3_000_000), // SPP invoiced
    j('2026-01-10', '1100', '1200', 2_000_000), // SPP paid
    j('2026-02-01', '5000', '1100', 1_500_000), // salary
    j('2026-02-03', '5400', '1000', 500_000), // utilities paid in cash
    j('2026-02-04', '1000', '4100', 800_000), // infaq
    j('2026-03-01', '1300', '2000', 4_000_000), // goods received on credit
  ];

  it('computes normal-side balances per account', () => {
    const b = accountBalances(journals, coa);
    expect(b['1100']).toBe(100_000_000 + 2_000_000 - 1_500_000);
    expect(b['1200']).toBe(1_000_000);
    expect(b['1000']).toBe(300_000);
    expect(b['2000']).toBe(4_000_000);
    expect(b['4000']).toBe(3_000_000);
    expect(b['5400']).toBe(500_000);
  });

  it('produces a balanced statement of financial position', () => {
    const bs = balanceSheet(journals, coa);
    expect(bs.assets).toBe(bs.liabilities + bs.equity);
    expect(bs.detail).toMatchObject({
      kas: 300_000,
      bank: 100_500_000,
      piutangSPP: 1_000_000,
      persediaan: 4_000_000,
      hutangUsaha: 4_000_000,
      hutangGaji: 0,
    });
    // ISAK 335: unrestricted revenue less expenses goes to net assets without restrictions;
    // the restricted infaq (4100) stays in net assets with restrictions.
    expect(bs.detail.danaTidakTerikat).toBe(100_000_000 + (3_000_000 - 2_000_000));
    expect(bs.detail.danaTerikatTemporer).toBe(800_000);
    expect(bs.netAssets).toEqual({ unrestricted: 101_000_000, restricted: 800_000, total: 101_800_000 });
  });

  it('produces the statement of activities', () => {
    const is = incomeStatement(journals, coa);
    expect(is).toMatchObject({ revenue: 3_800_000, expenses: 2_000_000, netIncome: 1_800_000 });
    expect(is.detail).toMatchObject({
      pendapatanSPP: 3_000_000, pendapatanLain: 800_000,
      bebanGaji: 1_500_000, bebanOperasional: 0, bebanPemeliharaan: 0, bebanLain: 500_000,
    });
  });

  it('builds a 12-month series for the year', () => {
    const series = monthlySeries(journals, coa, 2026);
    expect(series).toHaveLength(12);
    expect(series[0]).toMatchObject({ month: 'Jan', pendapatan: 3_000_000, beban: 0, surplus: 3_000_000 });
    expect(series[1]).toMatchObject({ month: 'Feb', pendapatan: 800_000, beban: 2_000_000, surplus: -1_200_000 });
    expect(series[11]).toMatchObject({ pendapatan: 0, beban: 0, surplus: 0 });
  });

  it('is all zeros for a brand-new tenant', () => {
    const bs = balanceSheet([], coa);
    expect(bs).toMatchObject({ assets: 0, liabilities: 0, equity: 0 });
    expect(incomeStatement([], coa)).toMatchObject({ revenue: 0, expenses: 0, netIncome: 0 });
  });
});
