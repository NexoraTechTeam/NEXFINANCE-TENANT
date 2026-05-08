const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { expenses, logActivity } = require('../db');

const getRequestIp = (req) => (
  req.headers['x-forwarded-for']?.split(',')[0]?.trim()
  || req.socket?.remoteAddress
  || '127.0.0.1'
);

router.get('/', auth, rbac('expenses'), (req, res) => {
  res.json({ expenses });
});

router.post('/submit', auth, rbac('expenses'), (req, res) => {
  const ipAddress = getRequestIp(req);
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
  logActivity(req.user.id, req.user.email, 'submit_expense', 'expenses', `Submitted expense ${expense.id}`, { expenseId: expense.id, amount: expense.amount, category: expense.category }, { ipAddress });
  res.status(201).json(expense);
});

router.post('/:id/approve', auth, rbac('expenses'), (req, res) => {
  const ipAddress = getRequestIp(req);
  const expense = expenses.find(e => e.id === req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  if (expense.status !== 'pending') return res.status(400).json({ error: `Cannot approve — status is ${expense.status}` });
  expense.approvals.push({ approver: req.user.email, approvedAt: new Date().toISOString().split('T')[0] });
  if (expense.approvals.length >= 2) expense.status = 'approved';
  logActivity(req.user.id, req.user.email, 'approve_expense', 'expenses', `Approved expense ${expense.id}`, { expenseId: expense.id, approvals: expense.approvals.length, status: expense.status }, { ipAddress });
  res.json(expense);
});

router.post('/:id/reject', auth, rbac('expenses'), (req, res) => {
  const ipAddress = getRequestIp(req);
  const expense = expenses.find(e => e.id === req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  const { reason } = req.body || {};
  expense.status = 'rejected';
  expense.rejectedAt = new Date().toISOString().split('T')[0];
  expense.rejectedReason = reason || expense.rejectedReason || null;
  logActivity(req.user.id, req.user.email, 'reject_expense', 'expenses', `Rejected expense ${expense.id}`, { expenseId: expense.id, reason: expense.rejectedReason }, { ipAddress, level: 'warning' });
  res.json(expense);
});

module.exports = router;
