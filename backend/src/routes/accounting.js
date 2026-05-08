const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { chartOfAccounts, journals, logActivity } = require('../db');

const getRequestIp = (req) => (
  req.headers['x-forwarded-for']?.split(',')[0]?.trim()
  || req.socket?.remoteAddress
  || '127.0.0.1'
);

router.get('/chart-of-accounts', auth, rbac('accounting'), (req, res) => {
  res.json({ accounts: chartOfAccounts });
});

router.get('/journals', auth, rbac('accounting'), (req, res) => {
  res.json({ journals: [...journals].reverse() });
});

router.post('/journals', auth, rbac('accounting'), (req, res) => {
  const ipAddress = getRequestIp(req);
  const { date, description, debit, credit } = req.body;
  if (!date || !description || !debit || !credit) {
    return res.status(400).json({ error: 'date, description, debit, credit are required' });
  }
  const journal = {
    id: `JRN${Date.now()}`,
    date,
    description,
    debit,
    credit,
    createdAt: new Date().toISOString().split('T')[0],
  };
  journals.push(journal);
  logActivity(req.user.id, req.user.email, 'create_journal', 'accounting', `Created journal ${journal.id}`, { journalId: journal.id, date: journal.date, debit, credit }, { ipAddress });
  res.status(201).json(journal);
});

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
