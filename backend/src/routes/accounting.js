'use strict';

const express = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { logActivity } = require('../lib/activity');
const { getRequestIp, ah, today } = require('../lib/http');

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

router.get('/reports/balance-sheet', auth, rbac('accounting'), (req, res) => {
  const assets = 650000000;
  const liabilities = 85000000;
  const equity = assets - liabilities;
  res.json({
    date: new Date().toISOString().split('T')[0],
    assets,
    liabilities,
    equity,
    detail: {
      kas: 75000000,
      bank: 450000000,
      piutangSPP: 28500000,
      persediaan: 96500000,
      hutangUsaha: 55000000,
      hutangGaji: 30000000,
      danaTidakTerikat: 420000000,
      danaTerikatTemporer: 145000000,
    },
  });
});

router.get('/reports/income-statement', auth, rbac('accounting'), (req, res) => {
  res.json({
    date: new Date().toISOString().split('T')[0],
    revenue: 375000000,
    expenses: 285000000,
    netIncome: 90000000,
    detail: {
      pendapatanSPP: 318750000,
      pendapatanLain: 56250000,
      bebanGaji: 185250000,
      bebanOperasional: 57000000,
      bebanPemeliharaan: 28500000,
      bebanLain: 14250000,
    },
  });
});

module.exports = router;
