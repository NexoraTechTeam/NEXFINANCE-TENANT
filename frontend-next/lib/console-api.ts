import axios from 'axios';
import type { Palette } from '@/lib/theme';

export const CONSOLE_TOKEN_KEY = 'console_token';
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

export interface ConsoleTenant {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'suspended';
  schoolInfo: Record<string, string>;
  branding: { palette?: Palette; showPoweredBy?: boolean; logoUpdatedAt?: string };
  modules: string[];
  domains: string[];
  userCount?: number;
  createdAt: string;
}

export interface AuditEntry { id: number; actor: string; action: string; tenant_id: string | null; data: Record<string, unknown>; created_at: string }

export const slugify = (value: string) => value
  .toLowerCase()
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 40)
  .replace(/-+$/g, '');

const http = axios.create({ baseURL: '/api/v1/console' });

http.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem(CONSOLE_TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use((res) => res, (err) => {
  if (err.response?.status === 401 && !String(err.config?.url).includes('/auth/login') && typeof window !== 'undefined') {
    window.localStorage.removeItem(CONSOLE_TOKEN_KEY);
    window.location.href = '/console';
  }
  return Promise.reject(err);
});

const image = (file: Blob) => ({ headers: { 'Content-Type': file.type || 'image/png' } });

export const consoleApi = {
  login: async (email: string, password: string) => (await http.post('/auth/login', { email, password })).data as { token: string },
  me: async () => (await http.get('/me')).data as { operator: { email: string; name: string }; tenantBaseDomain: string | null },
  listTenants: async () => (await http.get('/tenants')).data.tenants as ConsoleTenant[],
  getTenant: async (id: string) => (await http.get(`/tenants/${id}`)).data.tenant as ConsoleTenant,
  createTenant: async (payload: Record<string, unknown>) => (await http.post('/tenants', payload)).data as {
    tenant: ConsoleTenant; domains: string[]; admin: { username: string; temporaryPassword: string } | null;
  },
  updateTenant: async (id: string, patch: Record<string, unknown>) => (await http.patch(`/tenants/${id}`, patch)).data.tenant as ConsoleTenant,
  uploadLogo: async (id: string, file: Blob, { keepPalette = false } = {}) =>
    (await http.put(`/tenants/${id}/logo${keepPalette ? '?keepPalette=1' : ''}`, file, image(file))).data as { tenant: ConsoleTenant },
  previewPalette: async (file: Blob) => (await http.post('/palette/preview', file, image(file))).data.palette as Palette,
  paletteFromColors: async (colors: { primary: string; secondary?: string; accent?: string }) =>
    (await http.post('/palette/from-colors', colors)).data.palette as Palette,
  addDomain: async (id: string, domain: string) => (await http.post(`/tenants/${id}/domains`, { domain })).data.tenant as ConsoleTenant,
  removeDomain: async (id: string, domain: string) => (await http.delete(`/tenants/${id}/domains/${encodeURIComponent(domain)}`)).data.tenant as ConsoleTenant,
  resetPassword: async (id: string, username: string) => (await http.post(`/tenants/${id}/reset-password`, { username })).data as { temporaryPassword: string },
  audit: async () => (await http.get('/audit')).data.entries as AuditEntry[],
};

export const consoleError = (err: unknown, fallback = 'Terjadi kesalahan. Coba lagi.') => {
  const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return typeof msg === 'string' ? msg : fallback;
};
