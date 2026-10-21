'use strict';

const express = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { logActivity } = require('../lib/activity');
const { getRequestIp, ah } = require('../lib/http');
const { calcPayroll } = require('../services/payroll');
const { postPayroll } = require('../services/posting');

const router = express.Router();

router.get('/employees', auth, rbac('payroll'), ah(async (req, res) => {
  res.json({ employees: await req.store.list('employees') });
}));

router.post('/calculate', auth, rbac('payroll'), ah(async (req, res) => {
  const ipAddress = getRequestIp(req);
  const { employeeId, month } = req.body;
  if (!employeeId || !month) return res.status(400).json({ error: 'employeeId and month are required' });
  const emp = await req.store.get('employees', employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  const existing = (await req.store.list('payroll_runs')).find((p) => p.employeeId === emp.id && p.month === month);
  if (existing) return res.status(409).json({ error: `Gaji ${emp.name} untuk ${month} sudah diproses (${existing.id})` });
  const result = await req.store.withTransaction(async (tx) => {
    const run = await tx.insert('payroll_runs', calcPayroll(emp, month));
    await postPayroll(tx, run);
    return run;
  });
  await logActivity(req.store, req.user.id, req.user.email, 'calculate_payroll', 'payroll', `Calculated payroll for ${emp.name} (${month})`, { payrollId: result.id, employeeId: emp.id, month, netSalary: result.netSalary }, { ipAddress });
  return res.status(201).json(result);
}));

router.get('/history', auth, rbac('payroll'), ah(async (req, res) => {
  res.json({ payrolls: await req.store.list('payroll_runs') });
}));

router.get('/reports', auth, rbac('payroll'), ah(async (req, res) => {
  const payrollRuns = await req.store.list('payroll_runs');
  const totalGross = payrollRuns.reduce((s, p) => s + p.grossSalary, 0);
  const totalNet = payrollRuns.reduce((s, p) => s + p.netSalary, 0);
  res.json({
    totalRecords: payrollRuns.length,
    totalGross,
    totalNet,
    totalDeductions: totalGross - totalNet,
    totalEmployees: await req.store.count('employees'),
  });
}));

module.exports = router;
