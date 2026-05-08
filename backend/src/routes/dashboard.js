const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sppInvoices, employees, payrollRuns, expenses, purchaseRequests } = require('../db');

router.get('/kpi', auth, (req, res) => {
  const paidSPP = sppInvoices.filter(i => i.status === 'paid');
  const totalSPP = sppInvoices.length;
  const monthRevenue = paidSPP.reduce((s, i) => s + i.amount, 0);
  const collectionRate = totalSPP > 0 ? ((paidSPP.length / totalSPP) * 100).toFixed(1) : 0;
  const pendingExpenses = expenses.filter(e => e.status === 'pending').length;
  const pendingPR = purchaseRequests.filter(p => p.status === 'pending').length;

  res.json({
    monthRevenue,
    collectionRate: collectionRate + '%',
    cashBalance: 525000000,
    pendingItems: pendingExpenses + pendingPR,
    totalStudents: 450,
    totalEmployees: employees.length,
    totalInvoices: totalSPP,
    paidInvoices: paidSPP.length,
    pendingExpenses,
    pendingPR,
  });
});

router.get('/monthly-report', auth, (req, res) => {
  const paidSPP = sppInvoices.filter(i => i.status === 'paid');
  const revenue = paidSPP.reduce((s, i) => s + i.amount, 0) + 8500000;
  const expenseTotal = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
  const salaries = payrollRuns.reduce((s, p) => s + p.netSalary, 0);
  const totalExpenses = expenseTotal + salaries;
  res.json({
    month: new Date().toISOString().slice(0, 7),
    revenue,
    expenses: totalExpenses,
    netIncome: revenue - totalExpenses,
    breakdown: {
      tuitionFees: paidSPP.reduce((s, i) => s + i.amount, 0),
      donations: 8500000,
      salaries,
      operationalExpenses: expenseTotal,
    },
  });
});

module.exports = router;
