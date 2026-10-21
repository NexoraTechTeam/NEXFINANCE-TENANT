'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/lib/api';

/** Default role → modules matrix (mirrors backend db/defaults.js); the tenant's own matrix comes from the API. */
export const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  admin: ['*'],
  bendahara: ['dashboard', 'spp', 'payroll', 'expenses', 'accounting', 'reports', 'master', 'activity', 'notifications'],
  kabag: ['dashboard', 'expenses', 'procurement', 'activity', 'notifications'],
  staff: ['dashboard', 'expenses', 'notifications'],
  auditor: ['dashboard', 'reports', 'accounting'],
};

export interface Access { role: string; modules: string[] }

const PAGE_MODULES: Array<[string, string]> = [
  ['/dashboard/spp', 'spp'], ['/dashboard/payroll', 'payroll'], ['/dashboard/expenses', 'expenses'],
  ['/dashboard/procurement', 'procurement'], ['/dashboard/accounting', 'accounting'], ['/dashboard/reports', 'reports'],
  ['/dashboard/activity-logs', 'activity'], ['/dashboard/master/access', 'users'], ['/dashboard/master', 'master'],
];
const ADMIN_ROLES = ['admin', 'super_admin'];

/** Module that guards a dashboard page; null = open to every signed-in user (e.g. help). */
export function moduleForPath(path: string): string | null {
  if (path === '/dashboard') return 'dashboard';
  return PAGE_MODULES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1] ?? null;
}

export function canAccess(path: string, access: Access): boolean {
  const required = moduleForPath(path);
  if (!required) return true;
  if (required === 'users') return ADMIN_ROLES.includes(access.role);
  return access.modules.includes('*') || access.modules.includes(required);
}

/** Expense approval: approver roles only, never on one's own submission (backend enforces the same). */
const APPROVER_ROLES = ['kabag', 'bendahara', 'admin', 'super_admin'];
export function canDecideExpense(
  expense: { submittedById?: string; submittedBy?: string },
  user: { id?: string; role?: string; email?: string; username?: string } | null,
): boolean {
  if (!user?.role || !APPROVER_ROLES.includes(user.role)) return false;
  const own = expense.submittedById ? expense.submittedById === user.id : expense.submittedBy === (user.email || user.username);
  return !own;
}

// Cached per session (token + stored user) so a different user signing in on the same tab never sees stale menus.
let cache: { key: string; promise: Promise<Access> } | null = null;
export const resetPermissionsCache = () => { cache = null; };

const read = (key: string) => { try { return window.localStorage.getItem(key) || ''; } catch { return ''; } };
const storedRole = () => {
  try { return (JSON.parse(read('user') || 'null') as { role?: string } | null)?.role || 'staff'; } catch { return 'staff'; }
};

/** The signed-in role's modules: the tenant matrix from the API, or the default matrix when it is unreachable. */
export function loadAccess(): Promise<Access> {
  const key = `${read('token')}|${read('user')}`;
  if (!cache || cache.key !== key) {
    const fallback = () => { const role = storedRole(); return { role, modules: DEFAULT_PERMISSIONS[role] || [] }; };
    const promise = !read('token') ? Promise.resolve(fallback()) : authService.getPermissions()
      .then((res) => ({ role: res.data?.role || storedRole(), modules: res.data?.permissions || [] }))
      .catch(fallback);
    cache = { key, promise };
  }
  return cache.promise;
}

export function useAccess(): Access | null {
  const [access, setAccess] = useState<Access | null>(null);
  useEffect(() => {
    let alive = true;
    loadAccess().then((a) => { if (alive) setAccess(a); });
    return () => { alive = false; };
  }, []);
  return access;
}
