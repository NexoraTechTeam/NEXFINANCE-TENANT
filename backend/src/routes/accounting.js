'use strict';

const express = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { logActivity } = require('../lib/activity');
const { getRequestIp, ah, today } = require('../lib/http');
const ledger = require('../services/ledger');
const {
  postOpeningBalance, postRestrictedReceipt, postRestrictionRelease, restrictedBalance, loadContext,
} = require('../services/posting');

const { positiveAmount, isoDate, firstError } = require('../lib/validate');
const fixedAssets = require('../services/fixed-assets');
const { currentMonth } = require('../services/depreciation');

const router = express.Router();
const REPORTS = ['accounting', 'reports'];

/** COA keyed by account code: { '1000': { name, type, isak35 } } (unchanged contract). */
const chartOfAccounts = async (store) => Object.fromEntries(
  (await store.list('chart_of_accounts')).map(({ id, ...account }) => [id, account]),
);

router.get('/chart-of-accounts', auth, rbac('accounting'), ah(async (req, res) => {
  res.json({ accounts: await chartOfAccounts(req.store) });
}));

router.get('/journals', auth, rbac('accounting'), ah(async (req, res) => {
  res.json({ journals: (await req.store.list('journals')).reverse() });
}));

router.post('/journals', auth, rbac('accounting'), rbac.denyReadOnly, ah(async (req, res) => {
  const ipAddress = getRequestIp(req);
  const { date, description, debit, credit } = req.body;
  if (!date || !description || !debit || !credit) {
    return res.status(400).json({ error: 'date, description, debit, credit are required' });
  }
  const coa = await chartOfAccounts(req.store);
  const invalid = firstError(
    isoDate(date),
    positiveAmount(debit.amount, 'Jumlah debit'),
    Number(debit.amount) === Number(credit.amount) ? null : 'Jumlah debit dan kredit harus sama',
    coa[debit.account] && coa[credit.account] ? null : 'Akun tidak dikenal',
    debit.account !== credit.account ? null : 'Akun debit dan kredit harus berbeda',
  );
  if (invalid) return res.status(400).json({ error: invalid });
  const journal = await req.store.insert('journals', {
    id: await req.store.nextId('journals'),
    date,
    description,
    debit: { account: debit.account, name: coa[debit.account].name, amount: Number(debit.amount) },
    credit: { account: credit.account, name: coa[credit.account].name, amount: Number(credit.amount) },
    createdAt: today(),
  });
  await logActivity(req.store, req.user.id, req.user.email, 'create_journal', 'accounting', `Created journal ${journal.id}`, { journalId: journal.id, date: journal.date, debit, credit }, { ipAddress });
  return res.status(201).json(journal);
}));

const loadBooks = async (store) => {
  const { coa, accounts } = await loadContext(store);
  return { journals: await store.list('journals'), coa, accounts, funds: accounts.restrictedFunds };
};

router.get('/reports/balance-sheet', auth, rbac(REPORTS), ah(async (req, res) => {
  const { journals, coa, funds } = await loadBooks(req.store);
  res.json(ledger.balanceSheet(journals, coa, { funds }));
}));

/** Full ISAK 335 package for one calendar year (financial position, comprehensive income, changes in net assets, cash flows, notes). */
router.get('/reports/isak335', auth, rbac(REPORTS), ah(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const { journals, coa, funds } = await loadBooks(req.store);
  const setting = await req.store.db.withSchema(req.store.schema).from('settings').where({ key: 'reporting_framework' }).first();
  const assets = fixedAssets.summarizeAssets(await req.store.list('fixed_assets'), journals, { asOf: `${year}-12-31` });
  res.json(ledger.isak335Statements(journals, coa, {
    year,
    funds,
    fixedAssetNote: fixedAssets.fixedAssetNote(assets),
    framework: typeof setting?.value === 'string' ? setting.value : undefined,
    entity: { name: req.tenant.name, city: req.tenant.schoolInfo?.city },
  }));
}));

const RESTRICTED_SOURCES = new Set(['restricted_receipt', 'restriction_release']);

router.get('/restricted-funds', auth, rbac('accounting'), ah(async (req, res) => {
  const { journals, coa, funds } = await loadBooks(req.store);
  res.json({
    funds: Object.entries(funds).map(([key, fund]) => ({ key, ...fund, balance: restrictedBalance(journals, coa, fund) })),
    transactions: journals.filter((j) => RESTRICTED_SOURCES.has(j.source?.type)).reverse(),
  });
}));

const restrictedAction = (fn, action) => ah(async (req, res) => {
  const { date, fund, amount, method, description } = req.body || {};
  if (!date || !fund) return res.status(400).json({ error: 'date and fund are required' });
  const dateError = isoDate(date);
  if (dateError) return res.status(400).json({ error: dateError });
  const journal = await req.store.withTransaction((tx) => fn(tx, { date, fund, amount: Math.round(Number(amount)), method, description }));
  await logActivity(req.store, req.user.id, req.user.email, action, 'accounting', `${action} ${fund} ${journal.debit.amount}`, { journalId: journal.id }, { ipAddress: getRequestIp(req) });
  return res.status(201).json({ journal });
});

router.post('/restricted-funds/receipts', auth, rbac('accounting'), rbac.denyReadOnly, restrictedAction(postRestrictedReceipt, 'restricted_receipt'));
router.post('/restricted-funds/releases', auth, rbac('accounting'), rbac.denyReadOnly, restrictedAction(postRestrictionRelease, 'restriction_release'));

/** Fixed-asset register with accumulated depreciation, book value and a check against the ledger accounts. */
router.get('/fixed-assets', auth, rbac('accounting'), ah(async (req, res) => {
  const { journals, coa, accounts } = await loadBooks(req.store);
  const assets = fixedAssets.summarizeAssets(await req.store.list('fixed_assets'), journals);
  const sum = (key) => assets.reduce((s, a) => s + a[key], 0);
  res.json({
    assets,
    totals: { cost: sum('cost'), accumulated: sum('accumulated'), bookValue: sum('bookValue') },
    reconciliation: fixedAssets.reconcile(assets, ledger.accountBalances(journals, coa), coa, accounts),
    categories: fixedAssets.categories(accounts),
    currentMonth: currentMonth(),
  });
}));

router.post('/fixed-assets', auth, rbac('accounting'), rbac.denyReadOnly, ah(async (req, res) => {
  const asset = await req.store.withTransaction((tx) => fixedAssets.createAsset(tx, req.body, req.user));
  const { journals } = await loadBooks(req.store);
  const [row] = fixedAssets.summarizeAssets([asset], journals);
  await logActivity(req.store, req.user.id, req.user.email, 'create_fixed_asset', 'accounting', `Registered fixed asset ${asset.id} ${asset.name}`, { assetId: asset.id, cost: asset.cost, category: asset.category }, { ipAddress: getRequestIp(req) });
  res.status(201).json({ asset: row });
}));

router.post('/depreciation/run', auth, rbac('accounting'), rbac.denyReadOnly, ah(async (req, res) => {
  const result = await fixedAssets.runDepreciation(req.store, req.body?.period);
  await logActivity(req.store, req.user.id, req.user.email, 'run_depreciation', 'accounting', `Depreciation up to ${result.period}: ${result.posted} journals`, { period: result.period, posted: result.posted, total: result.total }, { ipAddress: getRequestIp(req) });
  res.status(201).json({ period: result.period, posted: result.posted, total: result.total, journals: result.journals });
}));

router.get('/reports/income-statement', auth, rbac(REPORTS), ah(async (req, res) => {
  const { journals, coa } = await loadBooks(req.store);
  res.json(ledger.incomeStatement(journals, coa));
}));

router.get('/reports/monthly', auth, rbac(REPORTS), ah(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const { journals, coa } = await loadBooks(req.store);
  res.json({
    year,
    months: ledger.monthlySeries(journals, coa, year),
    expenseDistribution: ledger.expenseDistribution(journals, coa),
  });
}));

router.get('/opening-balance', auth, rbac('accounting'), ah(async (req, res) => {
  const journals = await req.store.list('journals');
  res.json({ journals: journals.filter((jr) => jr.source?.type === 'opening_balance') });
}));

router.post('/opening-balance', auth, rbac('accounting'), rbac.denyReadOnly, ah(async (req, res) => {
  const { date, entries } = req.body || {};
  if (!date || !Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'date and a non-empty entries array are required' });
  }
  const dateError = isoDate(date);
  if (dateError) return res.status(400).json({ error: dateError });
  const coa = await chartOfAccounts(req.store);
  const invalid = entries.find((e) => !['Asset', 'Liability', 'Equity'].includes(coa[e?.account]?.type)
    || !(Number(e.amount) > 0) || e.account === '3000');
  if (invalid) {
    return res.status(400).json({ error: 'Each entry needs a balance-sheet account (not 3000) and a positive amount' });
  }
  const journals = await req.store.withTransaction((tx) => postOpeningBalance(tx, { date, entries }));
  await logActivity(req.store, req.user.id, req.user.email, 'opening_balance', 'accounting', `Recorded opening balance (${journals.length} entries)`, { date, entries }, { ipAddress: getRequestIp(req) });
  return res.status(201).json({ journals });
}));

module.exports = router;
