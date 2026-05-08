const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/kpi', auth, (req, res) => {
  res.json({
    revenue: {
      month: 25000000,
      growth: '+12.5%'
    },
    sppCollectionRate: '87.5%',
    cashBalance: 500000000,
    pendingExpenses: 15,
    pendingStudents: 3,
    metrics: {
      totalStudents: 450,
      totalEmployees: 35,
      totalBudget: 2000000000,
      budgetUtilized: '45%'
    }
  });
});

router.get('/monthly-report', auth, (req, res) => {
  res.json({
    month: new Date().toISOString().split('T')[0],
    revenue: 50000000,
    expenses: 30000000,
    netIncome: 20000000,
    breakdown: {
      tuitionFees: 40000000,
      donations: 10000000,
      salaries: 25000000,
      supplies: 3000000,
      utilities: 2000000
    }
  });
});

router.get('/export/pdf', auth, (req, res) => {
  res.json({
    status: 'success',
    message: 'PDF export initiated',
    url: '/reports/monthly-report-2026-05.pdf'
  });
});

router.get('/export/excel', auth, (req, res) => {
  res.json({
    status: 'success',
    message: 'Excel export initiated',
    url: '/reports/monthly-report-2026-05.xlsx'
  });
});

module.exports = router;
