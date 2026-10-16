'use strict';

/**
 * Pure ledger computations over double-entry journals
 * ({ date, debit: { account, amount }, credit: { account, amount } }).
 * Balances are returned on each account's normal side.
 */

const DEBIT_NORMAL = new Set(['Asset', 'Expense']);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const amountOf = (side) => Number(side?.amount) || 0;

function accountBalances(journals, coa) {
  const balances = Object.fromEntries(Object.keys(coa).map((code) => [code, 0]));
  const apply = (code, delta) => {
    if (!(code in balances)) balances[code] = 0;
    balances[code] += delta;
  };
  for (const j of journals) {
    const debitAcc = j.debit?.account;
    const creditAcc = j.credit?.account;
    const amount = amountOf(j.debit);
    if (debitAcc) apply(debitAcc, DEBIT_NORMAL.has(coa[debitAcc]?.type) ? amount : -amount);
    if (creditAcc) apply(creditAcc, DEBIT_NORMAL.has(coa[creditAcc]?.type) ? -amountOf(j.credit) : amountOf(j.credit));
  }
  return balances;
}

const sumType = (balances, coa, type) => Object.entries(balances)
  .filter(([code]) => coa[code]?.type === type)
  .reduce((s, [, v]) => s + v, 0);

const pick = (balances, ...codes) => codes.reduce((s, c) => s + (balances[c] || 0), 0);

function incomeStatement(journals, coa, { date = new Date() } = {}) {
  const b = accountBalances(journals, coa);
  const revenue = sumType(b, coa, 'Revenue');
  const expenses = sumType(b, coa, 'Expense');
  return {
    date: new Date(date).toISOString().split('T')[0],
    revenue,
    expenses,
    netIncome: revenue - expenses,
    detail: {
      pendapatanSPP: pick(b, '4000'),
      pendapatanLain: revenue - pick(b, '4000'),
      bebanGaji: pick(b, '5000'),
      bebanOperasional: pick(b, '5100'),
      bebanPemeliharaan: pick(b, '5200'),
      bebanLain: expenses - pick(b, '5000', '5100', '5200'),
    },
  };
}

function balanceSheet(journals, coa, { date = new Date() } = {}) {
  const b = accountBalances(journals, coa);
  const surplus = sumType(b, coa, 'Revenue') - sumType(b, coa, 'Expense');
  const assets = sumType(b, coa, 'Asset');
  const liabilities = sumType(b, coa, 'Liability');
  const equity = sumType(b, coa, 'Equity') + surplus;
  return {
    date: new Date(date).toISOString().split('T')[0],
    assets,
    liabilities,
    equity,
    detail: {
      kas: pick(b, '1000'),
      bank: pick(b, '1100'),
      piutangSPP: pick(b, '1200'),
      persediaan: pick(b, '1300'),
      asetTetap: pick(b, '1500'),
      hutangUsaha: pick(b, '2000'),
      hutangGaji: pick(b, '2100'),
      danaTidakTerikat: pick(b, '3000') + surplus,
      danaTerikatTemporer: pick(b, '3100'),
      danaTerikatPermanen: pick(b, '3200'),
    },
  };
}

function monthlySeries(journals, coa, year) {
  const months = MONTHS.map((month) => ({ month, pendapatan: 0, beban: 0, surplus: 0 }));
  for (const j of journals) {
    const d = new Date(j.date);
    if (Number.isNaN(d.getTime()) || d.getFullYear() !== Number(year)) continue;
    const row = months[d.getMonth()];
    const amount = amountOf(j.debit);
    const debitType = coa[j.debit?.account]?.type;
    const creditType = coa[j.credit?.account]?.type;
    if (creditType === 'Revenue') row.pendapatan += amount;
    if (debitType === 'Revenue') row.pendapatan -= amount;
    if (debitType === 'Expense') row.beban += amount;
    if (creditType === 'Expense') row.beban -= amount;
  }
  for (const row of months) row.surplus = row.pendapatan - row.beban;
  return months;
}

/** Expense totals per expense account (for distribution charts). */
function expenseDistribution(journals, coa) {
  const b = accountBalances(journals, coa);
  return Object.entries(b)
    .filter(([code, value]) => coa[code]?.type === 'Expense' && value !== 0)
    .map(([code, value]) => ({ account: code, name: coa[code].name, value }));
}

module.exports = { accountBalances, incomeStatement, balanceSheet, monthlySeries, expenseDistribution, MONTHS };
