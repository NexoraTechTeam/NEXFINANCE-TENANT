import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { push, api } = vi.hoisted(() => ({
  push: vi.fn(),
  api: {
    previewPalette: vi.fn(),
    paletteFromColors: vi.fn(),
    createTenant: vi.fn(),
    uploadLogo: vi.fn(),
    updateTenant: vi.fn(),
  },
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => '/console/tenants/new' }));
vi.mock('@/lib/console-api', async (orig) => ({
  ...(await orig<typeof import('@/lib/console-api')>()),
  consoleApi: api,
}));

import { slugify } from '@/lib/console-api';
import TenantWizard from '@/components/console/TenantWizard';
import PalettePreview from '@/components/console/PalettePreview';
import { DEFAULT_PALETTE } from '@/lib/theme';

const PALETTE = { ...DEFAULT_PALETTE, source: 'logo' as const, primary: '#196fb0', secondary: '#5ebd69', accent: '#5ebd69', sidebar: '#153147', brand: { ...DEFAULT_PALETTE.brand, 500: '#196fb0' } };

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset());
  push.mockReset();
});

describe('slugify', () => {
  it('derives a valid tenant slug from a school name', () => {
    expect(slugify('Sekolah Islam Terpadu Al-Musabbihin')).toBe('sekolah-islam-terpadu-al-musabbihin');
    expect(slugify('  SIT  Al Musabbihin!! ')).toBe('sit-al-musabbihin');
    expect(slugify('x'.repeat(60)).length).toBeLessThanOrEqual(40);
  });
});

describe('PalettePreview', () => {
  it('renders a live mock-up using the palette colors', () => {
    render(<PalettePreview palette={PALETTE} schoolName="SIT Al Musabbihin" />);
    const preview = screen.getByRole('figure', { name: /Pratinjau tema/i });
    expect(within(preview).getByText('SIT Al Musabbihin')).toBeInTheDocument();
    expect(within(preview).getByTestId('preview-sidebar')).toHaveStyle({ backgroundColor: '#153147' });
    expect(within(preview).getByTestId('preview-button')).toHaveStyle({ backgroundColor: '#196fb0' });
  });
});

describe('TenantWizard', () => {
  it('creates a tenant from name, logo-derived palette and admin, then reveals the one-time password', async () => {
    const user = userEvent.setup();
    api.previewPalette.mockResolvedValue(PALETTE);
    api.createTenant.mockResolvedValue({
      tenant: { id: 't1', slug: 'al-musabbihin' },
      domains: ['al-musabbihin.nexfinance.nexoratech.co'],
      admin: { username: 'admin-almusabbihin', temporaryPassword: 'Tmp-Secret-1234' },
    });
    api.uploadLogo.mockResolvedValue({ tenant: { id: 't1' } });

    render(<TenantWizard baseDomain="nexfinance.nexoratech.co" />);

    await user.type(screen.getByLabelText('Nama sekolah'), 'Sekolah Islam Terpadu Al Musabbihin');
    await user.clear(screen.getByLabelText('Slug'));
    await user.type(screen.getByLabelText('Slug'), 'al-musabbihin');
    await user.type(screen.getByLabelText('Nama singkat'), 'SIT Al Musabbihin');
    expect(screen.getByText('al-musabbihin.nexfinance.nexoratech.co')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));

    const file = new File([new Uint8Array([137, 80, 78, 71])], 'logo.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText(/Logo sekolah/i), file);
    await waitFor(() => expect(api.previewPalette).toHaveBeenCalled());
    expect(await screen.findByText('#196fb0')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    // Reaching the last step must not submit anything yet.
    expect(api.createTenant).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Buat tenant/i })).toHaveAttribute('type', 'submit');

    await user.clear(screen.getByLabelText('Username admin'));
    await user.type(screen.getByLabelText('Username admin'), 'admin-almusabbihin');
    await user.click(screen.getByRole('button', { name: /Buat tenant/i }));

    await waitFor(() => expect(api.createTenant).toHaveBeenCalled());
    expect(api.createTenant.mock.calls[0][0]).toMatchObject({
      slug: 'al-musabbihin',
      name: 'Sekolah Islam Terpadu Al Musabbihin',
      schoolInfo: { shortName: 'SIT Al Musabbihin' },
      admin: { username: 'admin-almusabbihin', role: 'super_admin' },
    });
    expect(api.uploadLogo).toHaveBeenCalledWith('t1', file, { keepPalette: false });
    expect(await screen.findByText('Tmp-Secret-1234')).toBeInTheDocument();
    expect(screen.getByText(/hanya ditampilkan sekali/i)).toBeInTheDocument();
  });

  it('blocks invalid slugs before submitting', async () => {
    const user = userEvent.setup();
    render(<TenantWizard baseDomain="nexfinance.nexoratech.co" />);
    await user.type(screen.getByLabelText('Nama sekolah'), 'Sekolah');
    await user.clear(screen.getByLabelText('Slug'));
    await user.type(screen.getByLabelText('Slug'), 'Bad Slug');
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/slug/i);
  });
});
