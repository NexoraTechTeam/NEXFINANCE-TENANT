const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sppInvoices } = require('../db');

router.get('/invoices', auth, (req, res) => {
  res.json({ invoices: sppInvoices });
});

router.post('/invoices', auth, (req, res) => {
  const { studentId, studentName, class: className, amount, month } = req.body;
  if (!studentId || !studentName || !amount || !month) {
    return res.status(400).json({ error: 'Missing required fields: studentId, studentName, amount, month' });
  }
  const invoice = {
    id: `INV${Date.now()}`,
    studentId,
    studentName,
    class: className || '-',
    amount: Number(amount),
    month,
    status: 'unpaid',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };
  sppInvoices.unshift(invoice);
  res.status(201).json(invoice);
});

router.post('/payment', auth, (req, res) => {
  const { invoiceId, method } = req.body;
  if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' });
  const invoice = sppInvoices.find(i => i.id === invoiceId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  if (invoice.status === 'paid') return res.status(400).json({ error: 'Invoice already paid' });
  invoice.status = 'paid';
  invoice.paidAt = new Date().toISOString().split('T')[0];
  invoice.paymentMethod = method || 'Transfer';
  res.json({ status: 'success', invoice });
});

router.get('/reports', auth, (req, res) => {
  const total = sppInvoices.length;
  const paid = sppInvoices.filter(i => i.status === 'paid').length;
  const totalCollected = sppInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalInvoiced = sppInvoices.reduce((s, i) => s + i.amount, 0);
  res.json({
    totalStudents: total,
    totalPaid: paid,
    totalUnpaid: total - paid,
    collectionRate: total > 0 ? ((paid / total) * 100).toFixed(1) + '%' : '0%',
    totalCollected,
    totalInvoiced,
  });
});

module.exports = router;
