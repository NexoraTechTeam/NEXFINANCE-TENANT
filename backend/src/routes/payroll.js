const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { employees, payrollRuns, calcPayroll } = require('../db');

router.get('/employees', auth, (req, res) => {
  res.json({ employees });
});

router.post('/calculate', auth, (req, res) => {
  const { employeeId, month } = req.body;
  if (!employeeId || !month) return res.status(400).json({ error: 'employeeId and month are required' });
  const emp = employees.find(e => e.id === employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  const result = calcPayroll(emp, month);
  result.id = `PAY${Date.now()}`;
  payrollRuns.push(result);
  res.status(201).json(result);
});

router.get('/history', auth, (req, res) => {
  res.json({ payrolls: payrollRuns });
});

router.get('/reports', auth, (req, res) => {
  const totalGross = payrollRuns.reduce((s, p) => s + p.grossSalary, 0);
  const totalNet   = payrollRuns.reduce((s, p) => s + p.netSalary, 0);
  res.json({
    totalRecords: payrollRuns.length,
    totalGross,
    totalNet,
    totalDeductions: totalGross - totalNet,
    totalEmployees: employees.length,
  });
});

module.exports = router;
