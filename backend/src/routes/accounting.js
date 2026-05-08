const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Mock chart of accounts (ISAK35 compliant)
const chartOfAccounts = {
  '1000': { name: 'Cash', type: 'Asset' },
  '1100': { name: 'Bank Account', type: 'Asset' },
  '2000': { name: 'Payables', type: 'Liability' },
  '3000': { name: 'Fund Balance', type: 'Equity' },
  '4000': { name: 'Tuition Income', type: 'Revenue' },
  '5000': { name: 'Salary Expense', type: 'Expense' }
};

// Mock journals
const journals = [];

router.get('/chart-of-accounts', auth, (req, res) => {
  res.json({ accounts: chartOfAccounts });
});

router.post('/journals', auth, (req, res) => {
  const { date, description, debit, credit } = req.body;
  
  if (!date || !description || !debit || !credit) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const journal = {
    id: Date.now().toString(),
    date,
    description,
    debit,
    credit,
    createdAt: new Date()
  };

  journals.push(journal);
  res.status(201).json(journal);
});

router.get('/reports/balance-sheet', auth, (req, res) => {
  const assets = 500000;
  const liabilities = 100000;
  const equity = assets - liabilities;

  res.json({
    date: new Date().toISOString(),
    assets,
    liabilities,
    equity
  });
});

router.get('/reports/income-statement', auth, (req, res) => {
  const revenue = 1000000;
  const expenses = 600000;
  const netIncome = revenue - expenses;

  res.json({
    date: new Date().toISOString(),
    revenue,
    expenses,
    netIncome
  });
});

module.exports = router;
