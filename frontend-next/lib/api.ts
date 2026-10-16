import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

const CREDENTIAL_AUTH_PATHS = ['/auth/login', '/auth/change-password'];

export const shouldRedirectToLogin = (status?: number, requestUrl = '') => {
  if (status !== 401) return false;
  return !CREDENTIAL_AUTH_PATHS.some((path) => requestUrl.includes(path));
};

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
    if (shouldRedirectToLogin(err.response?.status, err.config?.url) && typeof window !== 'undefined') {
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
  getPermissions: () => api.get('/auth/permissions'),
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => api.post('/auth/change-password', data),
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
  getBalanceSheet: () => api.get('/accounting/reports/balance-sheet'),
  getIncomeStatement: () => api.get('/accounting/reports/income-statement'),
  getMonthly: (year: number) => api.get('/accounting/reports/monthly', { params: { year } }),
  getOpeningBalance: () => api.get('/accounting/opening-balance'),
  postOpeningBalance: (data: { date: string; entries: Array<{ account: string; amount: number }> }) =>
    api.post('/accounting/opening-balance', data),
};

export const reportsService = {
  getFinancialReport: () => api.get('/reports/financial'),
  getBalanceSheet: () => api.get('/reports/balance-sheet'),
  getIncomeStatement: () => api.get('/reports/income-statement'),
};

export const masterService = {
  getStudents: (params?: Record<string, string>) => api.get('/master/students', { params }),
  createStudent: (data: any) => api.post('/master/students', data),
  updateStudent: (id: string, data: any) => api.put(`/master/students/${id}`, data),
  deleteStudent: (id: string) => api.delete(`/master/students/${id}`),
  getEmployees: () => api.get('/master/employees'),
  createEmployee: (data: any) => api.post('/master/employees', data),
  updateEmployee: (id: string, data: any) => api.put(`/master/employees/${id}`, data),
  deleteEmployee: (id: string) => api.delete(`/master/employees/${id}`),
  getUsers: () => api.get('/master/users'),
  createUser: (data: { name: string; email: string; password: string; role?: string }) => api.post('/master/users', data),
  updateUser: (id: string, data: { name?: string; email?: string; status?: string; role?: string }) => api.put(`/master/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/master/users/${id}`),
  updateUserRole: (id: string, role: string) => api.patch(`/master/users/${id}/role`, { role }),
  getRolePermissions: () => api.get('/master/role-permissions'),
  updateRolePermissions: (role: string, permissions: string[]) =>
    api.patch(`/master/role-permissions/${role}`, { permissions }),
};

export const activityService = {
  getLogs: (params?: Record<string, string | number>) => api.get('/activity', { params }),
  getStats: () => api.get('/activity/stats'),
  clearOldLogs: () => api.delete('/activity/clear'),
};

export default api;
