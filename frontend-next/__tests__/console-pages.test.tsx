import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { push, api } = vi.hoisted(() => ({
  push: vi.fn(),
  api: {
    login: vi.fn(), me: vi.fn(), listTenants: vi.fn(), getTenant: vi.fn(), updateTenant: vi.fn(),
    resetPassword: vi.fn(), addDomain: vi.fn(), removeDomain: vi.fn(), uploadLogo: vi.fn(),
    paletteFromColors: vi.fn(), audit: vi.fn(),
  },
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => '/console' }));
vi.mock('@/lib/console-api', async (orig) => ({ ...(await orig<typeof import('@/lib/console-api')>()), consoleApi: api }));

import ConsoleGate from '@/components/console/ConsoleGate';
import TenantList from '@/components/console/TenantList';
import TenantDetail from '@/components/console/TenantDetail';
import { DEFAULT_PALETTE } from '@/lib/theme';
import type { ConsoleTenant } from '@/lib/console-api';

const TENANT: ConsoleTenant = {
  id: 't1', slug: 'al-musabbihin', name: 'Sekolah Islam Terpadu Al Musabbihin', status: 'active',
  schoolInfo: { shortName: 'SIT Al Musabbihin' }, branding: { palette: DEFAULT_PALETTE, showPoweredBy: true },
  modules: [], domains: ['al-musabbihin.nexfinance.nexoratech.co'], userCount: 1, createdAt: '2026-10-16T00:00:00Z',
};

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset());
  window.localStorage.clear();
});

describe('ConsoleGate', () => {
  it('asks operators to sign in, then renders the console', async () => {
    const user = userEvent.setup();
    api.login.mockResolvedValue({ token: 'tok' });
    render(<ConsoleGate><p>isi console</p></ConsoleGate>);
    expect(screen.queryByText('isi console')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Email'), 'ops@nexoratech.co');
    await user.type(screen.getByLabelText('Password'), 'secret-123');
    await user.click(screen.getByRole('button', { name: /Masuk/i }));
    expect(await screen.findByText('isi console')).toBeInTheDocument();
    expect(window.localStorage.getItem('console_token')).toBe('tok');
  });
});

describe('TenantList', () => {
  it('lists tenants with status, domain and user count', async () => {
    api.listTenants.mockResolvedValue([TENANT]);
    render(<TenantList />);
    expect(await screen.findByText('Sekolah Islam Terpadu Al Musabbihin')).toBeInTheDocument();
    expect(screen.getByText('al-musabbihin.nexfinance.nexoratech.co')).toBeInTheDocument();
    expect(screen.getByText('Aktif')).toBeInTheDocument();
  });
});

describe('TenantDetail', () => {
  it('suspends a tenant after confirmation', async () => {
    const user = userEvent.setup();
    api.getTenant.mockResolvedValue(TENANT);
    api.updateTenant.mockResolvedValue({ ...TENANT, status: 'suspended' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<TenantDetail id="t1" />);
    await user.click(await screen.findByRole('button', { name: /Nonaktifkan/i }));
    expect(api.updateTenant).toHaveBeenCalledWith('t1', { status: 'suspended' });
    expect(await screen.findByText('Nonaktif')).toBeInTheDocument();
  });

  it('resets an admin password and reveals it once', async () => {
    const user = userEvent.setup();
    api.getTenant.mockResolvedValue(TENANT);
    api.resetPassword.mockResolvedValue({ temporaryPassword: 'New-Temp-9876' });
    render(<TenantDetail id="t1" />);
    await user.type(await screen.findByLabelText('Username atau email'), 'admin-almusabbihin');
    await user.click(screen.getByRole('button', { name: /Reset password/i }));
    expect(api.resetPassword).toHaveBeenCalledWith('t1', 'admin-almusabbihin');
    expect(await screen.findByText('New-Temp-9876')).toBeInTheDocument();
  });

  it('saves identity edits', async () => {
    const user = userEvent.setup();
    api.getTenant.mockResolvedValue(TENANT);
    api.updateTenant.mockResolvedValue(TENANT);
    render(<TenantDetail id="t1" />);
    const short = await screen.findByLabelText('Nama singkat');
    await user.clear(short);
    await user.type(short, 'SIT Musabbihin');
    await user.click(screen.getByRole('button', { name: /Simpan identitas/i }));
    await waitFor(() => expect(api.updateTenant).toHaveBeenCalledWith('t1', expect.objectContaining({
      schoolInfo: expect.objectContaining({ shortName: 'SIT Musabbihin' }),
    })));
  });
});
