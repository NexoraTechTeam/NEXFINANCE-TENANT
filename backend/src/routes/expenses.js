'use strict';

const express = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { logActivity } = require('../lib/activity');
const { getRequestIp, ah, today } = require('../lib/http');
const { postApprovedExpense } = require('../services/posting');

const router = express.Router();

router.get('/', auth, rbac('expenses'), ah(async (req, res) => {
  res.json({ expenses: await req.store.list('expenses') });
}));

router.post('/submit', auth, rbac('expenses'), ah(async (req, res) => {
  const ipAddress = getRequestIp(req);
  const { amount, category } = req.body;
  // The web form sends a `title` plus an optional note in `description`; API clients send `description` only.
  const title = req.body.title || req.body.description;
  const description = req.body.description || title;
  if (!title || !amount || !category) {
    return res.status(400).json({ error: 'title (or description), amount and category are required' });
  }
  const expense = await req.store.insert('expenses', {
    id: await req.store.nextId('expenses'),
    title,
    description,
    amount: Number(amount),
    category,
    status: 'pending',
    submittedBy: req.user.email,
    submittedAt: today(),
    approvals: [],
  });
  await logActivity(req.store, req.user.id, req.user.email, 'submit_expense', 'expenses', `Submitted expense ${expense.id}`, { expenseId: expense.id, amount: expense.amount, category: expense.category }, { ipAddress });
  return res.status(201).json(expense);
}));

router.post('/:id/approve', auth, rbac('expenses'), ah(async (req, res) => {
  const ipAddress = getRequestIp(req);
  let conflict = null;
  let duplicate = false;
  const expense = await req.store.withTransaction(async (tx) => {
    const updated = await tx.update('expenses', req.params.id, (current) => {
      if (current.status !== 'pending') { conflict = `Cannot approve — status is ${current.status}`; return current; }
      // Dual control: the two approvals must come from two different people.
      const me = { id: req.user.id, name: req.user.email || req.user.username };
      if ((current.approvals || []).some((a) => (a.approverId ? a.approverId === me.id : a.approver === me.name))) {
        duplicate = true;
        return current;
      }
      const approvals = [...(current.approvals || []), { approver: me.name, approverId: me.id, approvedAt: today() }];
      return { ...current, approvals, status: approvals.length >= 2 ? 'approved' : current.status };
    });
    if (updated && !conflict && updated.status === 'approved') await postApprovedExpense(tx, updated);
    return updated;
  });
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  if (conflict) return res.status(400).json({ error: conflict });
  if (duplicate) return res.status(409).json({ error: 'Anda sudah menyetujui pengeluaran ini. Persetujuan kedua harus dari orang lain.' });
  await logActivity(req.store, req.user.id, req.user.email, 'approve_expense', 'expenses', `Approved expense ${expense.id}`, { expenseId: expense.id, approvals: expense.approvals.length, status: expense.status }, { ipAddress });
  return res.json(expense);
}));

router.post('/:id/reject', auth, rbac('expenses'), ah(async (req, res) => {
  const ipAddress = getRequestIp(req);
  const { reason } = req.body || {};
  const expense = await req.store.update('expenses', req.params.id, (current) => ({
    ...current,
    status: 'rejected',
    rejectedAt: today(),
    rejectedReason: reason || current.rejectedReason || null,
  }));
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  await logActivity(req.store, req.user.id, req.user.email, 'reject_expense', 'expenses', `Rejected expense ${expense.id}`, { expenseId: expense.id, reason: expense.rejectedReason }, { ipAddress, level: 'warning' });
  return res.json(expense);
}));

module.exports = router;
