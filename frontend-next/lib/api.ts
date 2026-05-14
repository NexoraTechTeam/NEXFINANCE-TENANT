import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8084/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authService = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const dashboardService = {
  getKPI: () => api.get('/dashboard/kpi'),
  getMonthlyReport: () => api.get('/dashboard/monthly-report'),
};

export const sppService = {
  getInvoices: () => api.get('/spp/invoices'),
  createInvoice: (data: any) => api.post('/spp/invoices', data),
  recordPayment: (data: any) => api.post('/spp/payment', data),
};

export const payrollService = {
  getEmployees: () => api.get('/payroll/employees'),
  calculatePayroll: (data: any) => api.post('/payroll/calculate', data),
  getHistory: () => api.get('/payroll/history'),
};

export const expenseService = {
  getAll: () => api.get('/expenses'),
  submit: (data: any) => api.post('/expenses/submit', data),
  approve: (id: string) => api.post(`/expenses/${id}/approve`, {}),
  reject: (id: string) => api.post(`/expenses/${id}/reject`, {}),
};

export const procurementService = {
  createPR: (data: any) => api.post('/procurement/pr', data),
  createPO: (data: any) => api.post('/procurement/po', data),
  receivePO: (id: string) => api.post(`/procurement/po/${id}/receive`, {}),
  getPRs: () => api.get('/procurement/pr'),
  getPOs: () => api.get('/procurement/po'),
};

export const accountingService = {
  getChartOfAccounts: () => api.get('/accounting/chart-of-accounts'),
  createJournal: (data: any) => api.post('/accounting/journals', data),
  getJournals: () => api.get('/accounting/journals'),
};

export const reportsService = {
  getFinancialReport: () => api.get('/reports/financial'),
  getBalanceSheet: () => api.get('/reports/balance-sheet'),
  getIncomeStatement: () => api.get('/reports/income-statement'),
};

export default api;
