const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Mock employees
const employees = {
  'EMP001': {
    id: 'EMP001',
    name: 'Budi Santoso',
    position: 'Guru',
    baseSalary: 5000000,
    certificationAllowance: 5000000,
    familyAllowance: 250000
  }
};

// Mock payroll runs
const payrollRuns = [];

router.get('/employees', auth, (req, res) => {
  res.json({ employees: Object.values(employees) });
});

router.post('/calculate', auth, (req, res) => {
  const { employeeId, month } = req.body;
  
  if (!employeeId || !month) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const employee = employees[employeeId];
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const grossSalary = employee.baseSalary + employee.certificationAllowance + employee.familyAllowance;
  const bpjsKesehatan = grossSalary * 0.01;
  const bpjsKetenagakerjaan = grossSalary * (0.02 + 0.037);
  const pphTER = grossSalary * 0.05;
  const netSalary = grossSalary - bpjsKesehatan - bpjsKetenagakerjaan - pphTER;

  const payroll = {
    id: Date.now().toString(),
    employeeId,
    month,
    baseSalary: employee.baseSalary,
    certificationAllowance: employee.certificationAllowance,
    familyAllowance: employee.familyAllowance,
    grossSalary,
    bpjsKesehatan,
    bpjsKetenagakerjaan,
    pphTER,
    netSalary,
    status: 'calculated',
    calculatedAt: new Date()
  };

  payrollRuns.push(payroll);
  res.status(201).json(payroll);
});

router.get('/reports', auth, (req, res) => {
  const totalGross = payrollRuns.reduce((sum, p) => sum + p.grossSalary, 0);
  const totalNet = payrollRuns.reduce((sum, p) => sum + p.netSalary, 0);

  res.json({
    month: new Date().toISOString().split('T')[0],
    totalEmployees: payrollRuns.length,
    totalGross,
    totalNet,
    totalDeductions: totalGross - totalNet
  });
});

module.exports = router;
