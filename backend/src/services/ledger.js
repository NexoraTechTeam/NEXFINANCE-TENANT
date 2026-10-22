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

/**
 * ISAK 335 net assets with restrictions, per type: the equity account holding the restricted balance and the
 * revenue account for restricted contributions. Overridable per tenant (settings `posting_accounts.restrictedFunds`).
 */
const DEFAULT_RESTRICTED_FUNDS = {
  temporer: { label: 'Dibatasi waktu/tujuan', equity: '3100', revenue: '4100', releasable: true },
  permanen: { label: 'Dibatasi permanen', equity: '3200', revenue: '4200', releasable: false },
};
const STANDARD = 'ISAK 335 (d/h ISAK 35)';
const DEFAULT_FRAMEWORK = 'SAK Entitas Privat';
const CASH_ACCOUNTS = ['1000', '1100'];

const restrictedCodes = (funds) => new Set(Object.values(funds).flatMap((f) => [f.equity, f.revenue]));

/**
 * Net-asset class (unrestricted/restricted) and cash-flow activity (operating/investing/financing) of an
 * account. `account.activity` wins when set, so the same metadata can later drive PSAK 118 subclassification.
 */
function classifyAccount(code, coa, { funds = DEFAULT_RESTRICTED_FUNDS } = {}) {
  const account = coa[code] || {};
  const restricted = restrictedCodes(funds).has(code);
  const label = String(account.isak35 || '');
  let activity = 'operating';
  if (account.type === 'Asset' && /tetap|tidak lancar/i.test(label)) activity = 'investing';
  else if (account.type === 'Liability' && /jangka panjang/i.test(label)) activity = 'financing';
  else if (account.type === 'Equity') activity = 'financing';
  else if (Object.values(funds).some((f) => f.revenue === code && !f.releasable)) activity = 'financing';
  return {
    code,
    name: account.name || code,
    type: account.type || null,
    isak35: account.isak35 || null,
    netAssetClass: ['Equity', 'Revenue', 'Expense'].includes(account.type) ? (restricted ? 'restricted' : 'unrestricted') : null,
    activity: account.activity || activity,
  };
}

/** Net assets split into the two ISAK 335 classes (expenses always reduce the unrestricted class). */
function netAssetClasses(balances, coa, funds = DEFAULT_RESTRICTED_FUNDS) {
  const restricted = restrictedCodes(funds);
  let unrestricted = 0;
  let restrictedTotal = 0;
  for (const [code, value] of Object.entries(balances)) {
    const type = coa[code]?.type;
    if (!['Equity', 'Revenue', 'Expense'].includes(type)) continue;
    const signed = type === 'Expense' ? -value : value;
    if (restricted.has(code)) restrictedTotal += signed; else unrestricted += signed;
  }
  const detail = Object.entries(funds).map(([key, f]) => ({ key, label: f.label, amount: pick(balances, f.equity, f.revenue) }));
  return { unrestricted, restricted: restrictedTotal, total: unrestricted + restrictedTotal, detail };
}

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
      bebanPenyusutan: pick(b, '5500'),
      bebanLain: expenses - pick(b, '5000', '5100', '5200'),
    },
  };
}

function balanceSheet(journals, coa, { date = new Date(), funds = DEFAULT_RESTRICTED_FUNDS } = {}) {
  const b = accountBalances(journals, coa);
  const classes = netAssetClasses(b, coa, funds);
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
      asetTetap: Object.entries(b)
        .filter(([code]) => coa[code]?.type === 'Asset' && /tetap|tidak lancar/i.test(coa[code].isak35 || ''))
        .reduce((sum, [, v]) => sum + v, 0),
      hutangUsaha: pick(b, '2000'),
      hutangGaji: pick(b, '2100'),
      danaTidakTerikat: classes.unrestricted,
      danaTerikatTemporer: funds.temporer ? pick(b, funds.temporer.equity, funds.temporer.revenue) : 0,
      danaTerikatPermanen: funds.permanen ? pick(b, funds.permanen.equity, funds.permanen.revenue) : 0,
    },
    netAssets: { unrestricted: classes.unrestricted, restricted: classes.restricted, total: classes.total },
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

const isOpening = (j) => j.source?.type === 'opening_balance';
const strip = (name, prefix) => name.replace(new RegExp(`^${prefix}\\s+`, 'i'), '');
const lines = (balances, coa, filter) => Object.entries(balances)
  .filter(([code, v]) => v !== 0 && filter(code, coa[code] || {}))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([code, amount]) => ({ code, label: coa[code]?.name || code, amount }));
const total = (rows) => rows.reduce((s, r) => s + r.amount, 0);

/** Direct-method cash flows: every journal with exactly one cash side, grouped by the counterpart account. */
function cashFlows(openingSet, periodSet, coa, funds) {
  const cash = new Set(CASH_ACCOUNTS);
  const cashOf = (set) => pick(accountBalances(set, coa), ...CASH_ACCOUNTS);
  const groups = { operating: new Map(), investing: new Map(), financing: new Map() };
  for (const j of periodSet) {
    const d = j.debit?.account;
    const c = j.credit?.account;
    if (cash.has(d) === cash.has(c)) continue; // no cash, or a transfer between cash accounts
    const inflow = cash.has(d);
    const counterpart = inflow ? c : d;
    const { activity, name, type } = classifyAccount(counterpart, coa, { funds });
    const base = type === 'Revenue' ? strip(name, 'Pendapatan') : type === 'Expense' ? strip(name, 'Beban') : name;
    const verb = activity === 'investing' ? (inflow ? 'Pelepasan' : 'Perolehan') : (inflow ? 'Penerimaan' : 'Pembayaran');
    const label = `${verb} ${base}`;
    const map = groups[activity] || groups.operating;
    map.set(label, (map.get(label) || 0) + (inflow ? 1 : -1) * amountOf(j.debit));
  }
  const section = (map) => {
    const rows = [...map].map(([label, amount]) => ({ label, amount }));
    return { lines: rows, net: total(rows) };
  };
  const operating = section(groups.operating);
  const investing = section(groups.investing);
  const financing = section(groups.financing);
  const openingCash = cashOf(openingSet);
  const netChange = operating.net + investing.net + financing.net;
  return { method: 'direct', operating, investing, financing, netChange, openingCash, closingCash: openingCash + netChange };
}

/**
 * ISAK 335 statements for one calendar year: financial position (end of year), comprehensive income and
 * changes in net assets per class, direct-method cash flows and generated notes (CALK).
 * Opening-balance journals always count as the start position, whatever their date.
 */
function isak335Statements(journals, coa, {
  year = new Date().getFullYear(), funds = DEFAULT_RESTRICTED_FUNDS, entity = {}, framework = DEFAULT_FRAMEWORK, fixedAssetNote = null,
} = {}) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const dateOf = (j) => String(j.date || '').slice(0, 10);
  const upToEnd = journals.filter((j) => dateOf(j) <= end);
  const openingSet = upToEnd.filter((j) => dateOf(j) < start || isOpening(j));
  const periodSet = upToEnd.filter((j) => dateOf(j) >= start && !isOpening(j));
  const restricted = restrictedCodes(funds);

  // Financial position at year end
  const b = accountBalances(upToEnd, coa);
  const classes = netAssetClasses(b, coa, funds);
  const isNonCurrent = (a) => /tetap|tidak lancar/i.test(a.isak35 || '');
  const current = lines(b, coa, (_, a) => a.type === 'Asset' && !isNonCurrent(a));
  const nonCurrent = lines(b, coa, (_, a) => a.type === 'Asset' && isNonCurrent(a));
  const liabilities = lines(b, coa, (_, a) => a.type === 'Liability');
  const assetsTotal = total(current) + total(nonCurrent);
  const financialPosition = {
    date: end,
    assets: { current, nonCurrent },
    liabilities,
    netAssets: {
      unrestricted: classes.unrestricted,
      restricted: classes.restricted,
      total: classes.total,
      restrictedDetail: classes.detail.map(({ label, amount }) => ({ label, amount })),
    },
    cash: pick(b, ...CASH_ACCOUNTS),
    totals: { assets: assetsTotal, liabilities: total(liabilities), netAssets: classes.total, liabilitiesAndNetAssets: total(liabilities) + classes.total },
  };

  // Comprehensive income for the year, per class
  const p = accountBalances(periodSet, coa);
  const section = (isRestricted) => {
    const revenue = lines(p, coa, (code, a) => a.type === 'Revenue' && restricted.has(code) === isRestricted);
    const expenses = isRestricted ? [] : lines(p, coa, (_, a) => a.type === 'Expense');
    return { revenue, totalRevenue: total(revenue), expenses, totalExpenses: total(expenses), surplus: total(revenue) - total(expenses) };
  };
  const unrestrictedCI = section(false);
  const restrictedCI = section(true);
  const comprehensiveIncome = {
    unrestricted: unrestrictedCI,
    restricted: restrictedCI,
    otherComprehensiveIncome: 0,
    totalComprehensiveIncome: unrestrictedCI.surplus + restrictedCI.surplus,
  };

  // Changes in net assets
  const releases = periodSet.filter((j) => j.source?.type === 'restriction_release');
  const released = releases.reduce((s, j) => s + amountOf(j.debit), 0);
  const openingClasses = netAssetClasses(accountBalances(openingSet, coa), coa, funds);
  const change = (opening, surplus, rel, closing) => ({ opening, surplus, released: rel, other: closing - opening - surplus - rel, closing });
  const changesInNetAssets = {
    unrestricted: change(openingClasses.unrestricted, unrestrictedCI.surplus, released, classes.unrestricted),
    restricted: change(openingClasses.restricted, restrictedCI.surplus, -released, classes.restricted),
    total: { opening: openingClasses.total, closing: classes.total },
  };

  const flows = cashFlows(openingSet, periodSet, coa, funds);

  const name = entity.name || 'Entitas';
  const notes = [
    { id: 'A', title: 'Informasi umum', paragraphs: [
      `${name}${entity.city ? `, ${entity.city}` : ''} adalah entitas berorientasi nonlaba di bidang pendidikan. Sumber daya entitas berasal dari pembayaran SPP, sumbangan, infaq, dan wakaf, tanpa ekspektasi pengembalian bagi pemberi sumber daya.`,
    ] },
    { id: 'B', title: 'Ikhtisar kebijakan akuntansi', paragraphs: [
      `Laporan keuangan disusun berdasarkan ${framework} dan disajikan sesuai ${STANDARD}: Penyajian Laporan Keuangan Entitas Berorientasi Nonlaba.`,
      'Dasar akrual digunakan, kecuali laporan arus kas yang disusun dengan metode langsung. Mata uang penyajian adalah Rupiah.',
      'Aset neto disajikan dalam dua kelas: tanpa pembatasan dan dengan pembatasan dari pemberi sumber daya. Beban dilaporkan sebagai pengurang aset neto tanpa pembatasan; ketika tujuan atau waktu pembatasan terpenuhi, aset neto direklasifikasi sebagai aset neto yang dibebaskan dari pembatasan.',
      'Kas dan setara kas terdiri atas kas dan rekening bank.',
      'Aset tetap dicatat sebesar harga perolehan dikurangi akumulasi penyusutan. Penyusutan dihitung dengan metode garis lurus selama masa manfaat setiap aset; tanah tidak disusutkan.',
    ] },
    { id: 'C', title: 'Kas dan setara kas', rows: lines(b, coa, (code) => CASH_ACCOUNTS.includes(code)).map(({ label, amount }) => ({ label, amount })) },
    { id: 'D', title: 'Aset neto dengan pembatasan', rows: classes.detail.map(({ label, amount }) => ({ label, amount })) },
    { id: 'E', title: 'Aset neto yang dibebaskan dari pembatasan', rows: releases.map((j) => ({ label: `${dateOf(j)} — ${j.description}`, amount: amountOf(j.debit) })) },
    { id: 'F', title: 'Rincian beban', rows: unrestrictedCI.expenses.map(({ label, amount }) => ({ label, amount })) },
    ...(fixedAssetNote ? [fixedAssetNote] : []),
  ];

  return {
    standard: STANDARD,
    framework,
    period: { year: Number(year), start, end },
    financialPosition,
    comprehensiveIncome,
    changesInNetAssets,
    cashFlows: flows,
    notes,
    accounts: Object.keys(coa).sort().map((code) => classifyAccount(code, coa, { funds })),
  };
}

module.exports = {
  accountBalances, incomeStatement, balanceSheet, monthlySeries, expenseDistribution, MONTHS,
  isak335Statements, classifyAccount, netAssetClasses, DEFAULT_RESTRICTED_FUNDS, STANDARD,
};
