const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { employees, payrollRuns, calcPayroll, logActivity } = require('../db');

const getRequestIp = (req) => (
  req.headers['x-forwarded-for']?.split(',')[0]?.trim()
  || req.socket?.remoteAddress
  || '127.0.0.1'
);

router.get('/employees', auth, rbac('payroll'), (req, res) => {
  res.json({ employees });
});

router.post('/calculate', auth, rbac('payroll'), (req, res) => {
  const ipAddress = getRequestIp(req);
  const { employeeId, month } = req.body;
  if (!employeeId || !month) return res.status(400).json({ error: 'employeeId and month are required' });
  const emp = employees.find(e => e.id === employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  const result = calcPayroll(emp, month);
  result.id = `PAY${Date.now()}`;
  payrollRuns.push(result);
  logActivity(req.user.id, req.user.email, 'calculate_payroll', 'payroll', `Calculated payroll for ${emp.name} (${month})`, { payrollId: result.id, employeeId: emp.id, month, netSalary: result.netSalary }, { ipAddress });
  res.status(201).json(result);
});

router.get('/history', auth, rbac('payroll'), (req, res) => {
  res.json({ payrolls: payrollRuns });
});

router.get('/reports', auth, rbac('payroll'), (req, res) => {
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
