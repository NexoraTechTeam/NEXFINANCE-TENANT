const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Mock SPP data
const sppRecords = {
  'STU001': {
    studentId: 'STU001',
    studentName: 'Ahmad Pratama',
    class: '7A',
    amount: 1000000,
    month: 'May 2026',
    status: 'unpaid',
    dueDate: '2026-05-05',
    createdAt: new Date()
  }
};

router.get('/invoices', auth, (req, res) => {
  res.json({ invoices: Object.values(sppRecords) });
});

router.post('/invoices', auth, (req, res) => {
  const { studentId, studentName, class: className, amount, month } = req.body;
  
  if (!studentId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const invoice = {
    studentId,
    studentName,
    class: className,
    amount,
    month,
    status: 'unpaid',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date()
  };

  sppRecords[studentId] = invoice;
  res.status(201).json(invoice);
});

router.post('/payment', auth, (req, res) => {
  const { studentId, amount, method } = req.body;
  
  if (!studentId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (sppRecords[studentId]) {
    sppRecords[studentId].status = 'paid';
    sppRecords[studentId].paidAt = new Date();
    sppRecords[studentId].paymentMethod = method;
  }

  res.json({
    status: 'success',
    message: 'Payment recorded',
    data: sppRecords[studentId]
  });
});

router.get('/reports', auth, (req, res) => {
  const total = Object.values(sppRecords).reduce((sum, s) => sum + s.amount, 0);
  const paid = Object.values(sppRecords).filter(s => s.status === 'paid').length;
  const collection = (paid / Object.values(sppRecords).length * 100).toFixed(2);

  res.json({
    totalInvoiced: total,
    totalPaid: Object.values(sppRecords).filter(s => s.status === 'paid').reduce((sum, s) => sum + s.amount, 0),
    collectionRate: `${collection}%`,
    totalStudents: Object.values(sppRecords).length
  });
});

module.exports = router;
