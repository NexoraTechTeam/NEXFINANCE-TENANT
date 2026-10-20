import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { push, api } = vi.hoisted(() => ({
  push: vi.fn(),
  api: {
    login: vi.fn(), me: vi.fn(), listTenants: vi.fn(), getTenant: vi.fn(), updateTenant: vi.fn(),
    resetPassword: vi.fn(), addDomain: vi.fn(), removeDomain: vi.fn(), uploadLogo: vi.fn(),
    paletteFromColors: vi.fn(), audit: vi.fn(), uploadLoginImage: vi.fn(), removeLoginImage: vi.fn(),
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

  it('uploads, previews and removes the login page photo', async () => {
    const user = userEvent.setup();
    const withPhoto = { ...TENANT, branding: { ...TENANT.branding, loginImageUpdatedAt: '2026-10-20T00:00:00Z' } };
    api.getTenant.mockResolvedValue(TENANT);
    api.uploadLoginImage.mockResolvedValue({ tenant: withPhoto });
    api.removeLoginImage.mockResolvedValue({ tenant: TENANT });
    render(<TenantDetail id="t1" />);
    const file = new File([new Uint8Array([255, 216, 255])], 'sekolah.jpg', { type: 'image/jpeg' });
    await user.upload(await screen.findByLabelText(/Gambar halaman login/i), file);
    expect(api.uploadLoginImage).toHaveBeenCalledWith('t1', file);
    expect(await screen.findByRole('img', { name: /Pratinjau gambar login/i })).toHaveAttribute(
      'src', expect.stringContaining('/api/v1/console/tenants/t1/assets/login?v='),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: /Hapus gambar login/i }));
    expect(api.removeLoginImage).toHaveBeenCalledWith('t1');
  });

  it('adjusts the sidebar colour and saves it with the palette', async () => {
    const user = userEvent.setup();
    api.getTenant.mockResolvedValue(TENANT);
    api.paletteFromColors.mockResolvedValue({ ...DEFAULT_PALETTE, sidebar: '#0e3b2e' });
    api.updateTenant.mockResolvedValue(TENANT);
    render(<TenantDetail id="t1" />);
    const picker = await screen.findByLabelText('Sidebar');
    fireEvent.input(picker, { target: { value: '#0e3b2e' } });
    await waitFor(() => expect(api.paletteFromColors).toHaveBeenCalledWith(expect.objectContaining({ sidebar: '#0e3b2e' })));
    await user.click(screen.getByRole('button', { name: /Simpan warna/i }));
    await waitFor(() => expect(api.updateTenant).toHaveBeenCalledWith('t1', {
      branding: { palette: expect.objectContaining({ sidebar: '#0e3b2e' }) },
    }));
  });

  it('can replace the logo while keeping the current colours', async () => {
    const user = userEvent.setup();
    api.getTenant.mockResolvedValue(TENANT);
    api.uploadLogo.mockResolvedValue({ tenant: TENANT });
    render(<TenantDetail id="t1" />);
    await user.click(await screen.findByLabelText(/Pertahankan warna/i));
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'logo.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText(/Ganti logo/i), file);
    expect(api.uploadLogo).toHaveBeenCalledWith('t1', file, { keepPalette: true });
  });
});
