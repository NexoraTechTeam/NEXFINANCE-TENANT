'use strict';

/** Indonesian payroll calculation (unchanged from single-tenant NexFinance). */
const calcPayroll = (emp, month) => {
  const gross = emp.baseSalary + emp.certificationAllowance + emp.familyAllowance;
  const bpjsKes = Math.round(gross * 0.01);
  const bpjsTk = Math.round(gross * 0.057);
  const pph = Math.round(gross * 0.05);
  const net = gross - bpjsKes - bpjsTk - pph;
  return {
    employeeId: emp.id,
    employeeName: emp.name,
    month,
    baseSalary: emp.baseSalary,
    certificationAllowance: emp.certificationAllowance,
    familyAllowance: emp.familyAllowance,
    grossSalary: gross,
    bpjsKesehatan: bpjsKes,
    bpjsKetenagakerjaan: bpjsTk,
    pphTER: pph,
    netSalary: net,
    status: 'paid',
    paidAt: new Date().toISOString(),
  };
};

module.exports = { calcPayroll };
