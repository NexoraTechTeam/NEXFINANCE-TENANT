const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Mock expenses
const expenses = [];

router.post('/submit', auth, (req, res) => {
  const { description, amount, category, attachment } = req.body;
  
  if (!description || !amount || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const expense = {
    id: Date.now().toString(),
    description,
    amount,
    category,
    attachment,
    status: 'pending',
    submittedBy: req.user.email,
    submittedAt: new Date(),
    approvals: []
  };

  expenses.push(expense);
  res.status(201).json(expense);
});

router.get('/', auth, (req, res) => {
  res.json({ expenses });
});

router.post('/:id/approve', auth, (req, res) => {
  const expense = expenses.find(e => e.id === req.params.id);
  
  if (!expense) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  expense.approvals.push({
    approver: req.user.email,
    approvedAt: new Date()
  });

  if (expense.approvals.length >= 2) {
    expense.status = 'approved';
  }

  res.json(expense);
});

router.post('/:id/reject', auth, (req, res) => {
  const expense = expenses.find(e => e.id === req.params.id);
  
  if (!expense) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  expense.status = 'rejected';
  expense.rejectedAt = new Date();

  res.json(expense);
});

module.exports = router;
