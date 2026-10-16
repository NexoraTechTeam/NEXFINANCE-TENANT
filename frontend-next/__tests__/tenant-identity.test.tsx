import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/dashboard',
}));

import Sidebar from '@/components/Sidebar';
import LoginPage from '@/app/login/page';
import { TenantProvider } from '@/components/tenant/TenantProvider';
import { DEFAULT_TENANT, brandLines, normalizeTenantConfig, type TenantConfig } from '@/lib/tenant';

const SCHOOL: TenantConfig = {
  ...DEFAULT_TENANT,
  slug: 'al-musabbihin',
  name: 'Sekolah Islam Terpadu Al Musabbihin',
  shortName: 'SIT Al Musabbihin',
  logoUrl: '/api/v1/tenant/logo?v=1',
  showPoweredBy: false,
};

const withTenant = (ui: React.ReactElement, value = SCHOOL) => render(<TenantProvider value={value}>{ui}</TenantProvider>);

describe('tenant identity', () => {
  it('leads with the school and keeps NexFinance as product line', () => {
    expect(brandLines(SCHOOL)).toEqual({ title: 'SIT Al Musabbihin', subtitle: 'NexFinance' });
    expect(brandLines(DEFAULT_TENANT)).toEqual({ title: 'NexFinance', subtitle: 'Sistem keuangan sekolah' });
  });

  it('shows the school logo and name in the sidebar', () => {
    withTenant(<Sidebar isOpen={false} onClose={() => {}} />);
    const logo = screen.getByRole('img', { name: 'SIT Al Musabbihin' });
    expect(logo).toHaveAttribute('src', '/api/v1/tenant/logo?v=1');
    expect(screen.getByText('SIT Al Musabbihin')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Nexora/ })).not.toBeInTheDocument();
  });

  it('brands the login page for the school', () => {
    withTenant(<LoginPage />);
    expect(screen.getAllByRole('img', { name: 'SIT Al Musabbihin' }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Sekolah Islam Terpadu Al Musabbihin/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email atau username/)).toBeRequired();
    expect(screen.getByLabelText(/Email atau username/)).toHaveAttribute('type', 'text');
  });

  it('falls back to defaults for missing or broken configs', () => {
    expect(normalizeTenantConfig(null)).toEqual(DEFAULT_TENANT);
    const partial = normalizeTenantConfig({ slug: 'x', name: 'X', shortName: 'X' } as Partial<TenantConfig>);
    expect(partial.palette).toEqual(DEFAULT_TENANT.palette);
    expect(partial.showPoweredBy).toBe(true);
  });
});
