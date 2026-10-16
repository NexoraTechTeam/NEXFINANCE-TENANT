import 'server-only';
import { headers } from 'next/headers';
import { DEFAULT_TENANT, normalizeTenantConfig, type TenantConfig } from '@/lib/tenant';

const BACKEND_URL = process.env.BACKEND_URL || 'http://nexfin-saas-backend:5000';
const consoleHosts = () => (process.env.CONSOLE_HOSTS || '').split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);

export const requestHost = () => {
  const h = headers();
  return (h.get('x-forwarded-host') || h.get('host') || '').split(',')[0].trim().toLowerCase().replace(/:\d+$/, '');
};

export const isConsoleHost = (host = requestHost()) => consoleHosts().includes(host);

/** Resolves the tenant for the current request (server components only). */
export async function getTenantConfig(): Promise<TenantConfig> {
  const host = requestHost();
  if (!host || isConsoleHost(host)) return DEFAULT_TENANT;
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/tenant/config`, {
      headers: { 'x-forwarded-host': host },
      next: { revalidate: 60 },
    });
    if (!res.ok) return DEFAULT_TENANT;
    return normalizeTenantConfig(await res.json());
  } catch {
    return DEFAULT_TENANT;
  }
}
