const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { expenses } = require('../db');

router.get('/', auth, (req, res) => {
  res.json({ expenses });
});

router.post('/submit', auth, (req, res) => {
  const { description, amount, category } = req.body;
  if (!description || !amount || !category) {
    return res.status(400).json({ error: 'description, amount and category are required' });
  }
  const expense = {
    id: `EXP${Date.now()}`,
    description,
    amount: Number(amount),
    category,
    status: 'pending',
    submittedBy: req.user.email,
    submittedAt: new Date().toISOString().split('T')[0],
    approvals: [],
  };
  expenses.unshift(expense);
  res.status(201).json(expense);
});

router.post('/:id/approve', auth, (req, res) => {
  const expense = expenses.find(e => e.id === req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  if (expense.status !== 'pending') return res.status(400).json({ error: `Cannot approve — status is ${expense.status}` });
  expense.approvals.push({ approver: req.user.email, approvedAt: new Date().toISOString().split('T')[0] });
  if (expense.approvals.length >= 2) expense.status = 'approved';
  res.json(expense);
});

router.post('/:id/reject', auth, (req, res) => {
  const expense = expenses.find(e => e.id === req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  expense.status = 'rejected';
  expense.rejectedAt = new Date().toISOString().split('T')[0];
  res.json(expense);
});

module.exports = router;
