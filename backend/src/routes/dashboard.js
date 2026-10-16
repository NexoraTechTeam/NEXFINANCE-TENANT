'use strict';

const express = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { ah } = require('../lib/http');

const router = express.Router();

const load = (store, names) => Promise.all(names.map((n) => store.list(n)));

router.get('/kpi', auth, rbac('dashboard'), ah(async (req, res) => {
  const [sppInvoices, employees, expenses, purchaseRequests, students] = await load(req.store,
    ['spp_invoices', 'employees', 'expenses', 'purchase_requests', 'students']);
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
    totalStudents: students.length,
    totalEmployees: employees.length,
    totalInvoices: totalSPP,
    paidInvoices: paidSPP.length,
    pendingExpenses,
    pendingPR,
  });
}));

router.get('/monthly-report', auth, rbac('dashboard'), ah(async (req, res) => {
  const [sppInvoices, expenses, payrollRuns] = await load(req.store, ['spp_invoices', 'expenses', 'payroll_runs']);
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
}));

module.exports = router;
