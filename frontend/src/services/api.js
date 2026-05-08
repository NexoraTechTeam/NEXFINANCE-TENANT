import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password) => api.post('/auth/register', { email, password }),
  verify: () => api.get('/auth/verify')
};

export const dashboardService = {
  getKPI: () => api.get('/dashboard/kpi'),
  getMonthlyReport: () => api.get('/dashboard/monthly-report'),
  exportPDF: () => api.get('/dashboard/export/pdf'),
  exportExcel: () => api.get('/dashboard/export/excel')
};

export const sppService = {
  getInvoices: () => api.get('/spp/invoices'),
  createInvoice: (data) => api.post('/spp/invoices', data),
  recordPayment: (data) => api.post('/spp/payment', data),
  getReports: () => api.get('/spp/reports')
};

export const payrollService = {
  getEmployees: () => api.get('/payroll/employees'),
  calculatePayroll: (data) => api.post('/payroll/calculate', data),
  getHistory: () => api.get('/payroll/history'),
  getReports: () => api.get('/payroll/reports')
};

export const expenseService = {
  submit: (data) => api.post('/expenses/submit', data),
  getAll: () => api.get('/expenses'),
  approve: (id) => api.post(`/expenses/${id}/approve`, {}),
  reject: (id) => api.post(`/expenses/${id}/reject`, {})
};

export const procurementService = {
  createPR: (data) => api.post('/procurement/pr', data),
  createPO: (data) => api.post('/procurement/po', data),
  receivePO: (id) => api.post(`/procurement/po/${id}/receive`, {}),
  getPRs: () => api.get('/procurement/pr'),
  getPOs: () => api.get('/procurement/po'),
  getReports: () => api.get('/procurement/reports')
};

export const accountingService = {
  getChartOfAccounts: () => api.get('/accounting/chart-of-accounts'),
  createJournal: (data) => api.post('/accounting/journals', data),
  getJournals: () => api.get('/accounting/journals'),
  getBalanceSheet: () => api.get('/accounting/reports/balance-sheet'),
  getIncomeStatement: () => api.get('/accounting/reports/income-statement')
};

export default api;
