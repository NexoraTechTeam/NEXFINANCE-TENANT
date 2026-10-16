'use strict';

const express = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { logActivity } = require('../lib/activity');
const { getRequestIp, ah, today } = require('../lib/http');
const ledger = require('../services/ledger');
const { postOpeningBalance } = require('../services/posting');

const router = express.Router();

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

router.post('/journals', auth, rbac('accounting'), ah(async (req, res) => {
  const ipAddress = getRequestIp(req);
  const { date, description, debit, credit } = req.body;
  if (!date || !description || !debit || !credit) {
    return res.status(400).json({ error: 'date, description, debit, credit are required' });
  }
  const journal = await req.store.insert('journals', {
    id: await req.store.nextId('journals'),
    date,
    description,
    debit,
    credit,
    createdAt: today(),
  });
  await logActivity(req.store, req.user.id, req.user.email, 'create_journal', 'accounting', `Created journal ${journal.id}`, { journalId: journal.id, date: journal.date, debit, credit }, { ipAddress });
  return res.status(201).json(journal);
}));

const loadBooks = async (store) => ({
  journals: await store.list('journals'),
  coa: await chartOfAccounts(store),
});

router.get('/reports/balance-sheet', auth, rbac('accounting'), ah(async (req, res) => {
  const { journals, coa } = await loadBooks(req.store);
  res.json(ledger.balanceSheet(journals, coa));
}));

router.get('/reports/income-statement', auth, rbac('accounting'), ah(async (req, res) => {
  const { journals, coa } = await loadBooks(req.store);
  res.json(ledger.incomeStatement(journals, coa));
}));

router.get('/reports/monthly', auth, rbac('accounting'), ah(async (req, res) => {
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

router.post('/opening-balance', auth, rbac('accounting'), ah(async (req, res) => {
  const { date, entries } = req.body || {};
  if (!date || !Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'date and a non-empty entries array are required' });
  }
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
