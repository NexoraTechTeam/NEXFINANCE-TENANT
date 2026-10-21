import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';

const { nav, getPermissions } = vi.hoisted(() => ({ nav: { path: '/dashboard' }, getPermissions: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => nav.path }));
vi.mock('@/lib/api', () => ({ authService: { getPermissions: () => getPermissions(), changePassword: vi.fn() } }));

import Sidebar from '@/components/Sidebar';
import AccessGate from '@/components/auth/AccessGate';
import { canAccess, canDecideExpense, moduleForPath, resetPermissionsCache } from '@/lib/permissions';

const asUser = (user: Record<string, unknown>, permissions: string[]) => {
  window.localStorage.setItem('user', JSON.stringify(user));
  window.localStorage.setItem('token', `token-${user.id}`);
  getPermissions.mockResolvedValue({ data: { role: user.role, permissions } });
};

beforeEach(() => {
  resetPermissionsCache();
  getPermissions.mockReset();
  window.localStorage.clear();
  nav.path = '/dashboard';
});

describe('permission rules', () => {
  it('maps every page to its module', () => {
    expect(moduleForPath('/dashboard')).toBe('dashboard');
    expect(moduleForPath('/dashboard/spp')).toBe('spp');
    expect(moduleForPath('/dashboard/reports')).toBe('reports');
    expect(moduleForPath('/dashboard/activity-logs')).toBe('activity');
    expect(moduleForPath('/dashboard/master/students')).toBe('master');
    expect(moduleForPath('/dashboard/help')).toBeNull();
  });

  it('allows pages from the role matrix; Role & Akses only for admins', () => {
    const staff = { role: 'staff', modules: ['dashboard', 'expenses', 'notifications'] };
    expect(canAccess('/dashboard/expenses', staff)).toBe(true);
    expect(canAccess('/dashboard/spp', staff)).toBe(false);
    expect(canAccess('/dashboard/help', staff)).toBe(true);
    expect(canAccess('/dashboard/master/access', { role: 'bendahara', modules: ['master'] })).toBe(false);
    expect(canAccess('/dashboard/master/access', { role: 'admin', modules: ['*'] })).toBe(true);
  });

  it('lets only approvers decide on expenses, never on their own', () => {
    const exp = { submittedById: 'USR005', submittedBy: 'staff@x' };
    expect(canDecideExpense(exp, { id: 'USR005', role: 'staff' })).toBe(false);
    expect(canDecideExpense(exp, { id: 'USR003', role: 'kabag' })).toBe(true);
    expect(canDecideExpense({ submittedById: 'USR003' }, { id: 'USR003', role: 'kabag' })).toBe(false);
    expect(canDecideExpense({ submittedBy: 'bendahara@x' }, { id: 'U9', role: 'bendahara', email: 'bendahara@x' })).toBe(false);
  });
});

describe('Sidebar', () => {
  it('shows only the menus the role may open', async () => {
    asUser({ id: 'USR005', role: 'staff', name: 'Staf' }, ['dashboard', 'expenses', 'notifications']);
    render(<Sidebar isOpen={false} onClose={() => {}} />);
    await screen.findByText('Pengeluaran');
    const menu = Array.from(document.querySelectorAll('aside .nav-link')).map((b) => b.textContent?.trim());
    for (const shown of ['Dashboard', 'Pengeluaran', 'Bantuan']) expect(menu.some((m) => m?.startsWith(shown))).toBe(true);
    for (const hidden of ['SPP', 'Penggajian', 'Akuntansi', 'Laporan', 'Master Siswa', 'Role & Akses']) {
      expect(menu.some((m) => m?.startsWith(hidden))).toBe(false);
    }
  });
});

describe('AccessGate', () => {
  it('does not mount a page the role may not open', async () => {
    asUser({ id: 'USR005', role: 'staff' }, ['dashboard', 'expenses', 'notifications']);
    nav.path = '/dashboard/spp';
    render(<AccessGate><p>isi SPP</p></AccessGate>);
    expect(await screen.findByRole('heading', { name: /Akses tidak tersedia/ })).toBeInTheDocument();
    expect(screen.queryByText('isi SPP')).not.toBeInTheDocument();
  });

  it("never reuses another user's permissions in the same tab", async () => {
    const { loadAccess } = await import('@/lib/permissions');
    asUser({ id: 'USR001', role: 'super_admin' }, ['*']);
    window.localStorage.setItem('token', 'token-a');
    expect((await loadAccess()).modules).toEqual(['*']);
    asUser({ id: 'USR005', role: 'staff' }, ['dashboard', 'expenses']);
    window.localStorage.setItem('token', 'token-b');
    expect((await loadAccess()).modules).toEqual(['dashboard', 'expenses']);
  });

  it('mounts an allowed page', async () => {
    asUser({ id: 'USR005', role: 'staff' }, ['dashboard', 'expenses', 'notifications']);
    nav.path = '/dashboard/expenses';
    render(<AccessGate><p>isi pengeluaran</p></AccessGate>);
    expect(await screen.findByText('isi pengeluaran')).toBeInTheDocument();
  });

  it('keeps pages unmounted until the temporary password is changed', async () => {
    asUser({ id: 'USR007', role: 'bendahara', mustChangePassword: true }, ['dashboard']);
    render(<AccessGate><p>isi dashboard</p></AccessGate>);
    await act(async () => { await Promise.resolve(); });
    expect(screen.queryByText('isi dashboard')).not.toBeInTheDocument();
    window.localStorage.setItem('user', JSON.stringify({ id: 'USR007', role: 'bendahara', mustChangePassword: false }));
    act(() => { window.dispatchEvent(new Event('nexfin:password-changed')); });
    expect(await screen.findByText('isi dashboard')).toBeInTheDocument();
  });
});
