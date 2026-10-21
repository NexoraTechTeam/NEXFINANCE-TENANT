import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/dashboard',
}));

import Sidebar from '@/components/Sidebar';
import LoginPage from '@/app/login/page';
import RichInline from '@/components/brand/RichInline';
import { TenantProvider } from '@/components/tenant/TenantProvider';
import { DEFAULT_TENANT, normalizeTenantConfig, type TenantConfig } from '@/lib/tenant';

const SCHOOL: TenantConfig = {
  ...DEFAULT_TENANT, slug: 'al-musabbihin', name: 'Sekolah Islam Terpadu Al Musabbihin', shortName: 'SIT Al Musabbihin',
};
const withTenant = (ui: React.ReactElement, value: TenantConfig) => render(<TenantProvider value={value}>{ui}</TenantProvider>);

describe('RichInline', () => {
  it('renders bold, italic and underline as elements', () => {
    const { container } = render(<RichInline html="<b>Nex</b><i>Fin</i> <u>ance</u> &amp; co" />);
    expect(container.querySelector('b')).toHaveTextContent('Nex');
    expect(container.querySelector('i')).toHaveTextContent('Fin');
    expect(container.querySelector('u')).toHaveTextContent('ance');
    expect(container).toHaveTextContent('NexFin ance & co');
  });

  it('never turns other markup into elements', () => {
    const { container } = render(<RichInline html={'<img src=x onerror="alert(1)"><a href="#">x</a><script>bad()</script>'} />);
    expect(container.querySelector('img, a, script')).toBeNull();
    expect(container.textContent).not.toContain('bad()');
  });
});

describe('attribution line (login + sidebar)', () => {
  it('defaults to "NexFinance" with the Nexora logo and no "produk dari"', () => {
    expect(DEFAULT_TENANT.poweredByText).toBe('NexFinance');
    expect(normalizeTenantConfig({ slug: 'x', name: 'X', shortName: 'X' } as Partial<TenantConfig>).poweredByText).toBe('NexFinance');
    withTenant(<LoginPage />, SCHOOL);
    const line = screen.getByTestId('powered-by');
    expect(line).toHaveTextContent('NexFinance');
    expect(line.textContent).not.toMatch(/produk dari/i);
    expect(line.querySelector('[aria-label="Nexora"], img, svg')).not.toBeNull();
  });

  it('shows the rich text set in the Console on login and sidebar', () => {
    const tenant = { ...SCHOOL, poweredByText: '<b>NexFinance</b> by <i>Nexora</i>' };
    withTenant(<LoginPage />, tenant);
    expect(screen.getByTestId('powered-by').querySelector('b')).toHaveTextContent('NexFinance');
    withTenant(<Sidebar isOpen={false} onClose={() => {}} />, tenant);
    const lines = screen.getAllByTestId('powered-by');
    expect(lines[lines.length - 1].querySelector('i')).toHaveTextContent('Nexora');
  });

  it('keeps only the logo for empty text and hides everything when switched off', () => {
    withTenant(<LoginPage />, { ...SCHOOL, poweredByText: '' });
    expect(screen.getByTestId('powered-by').textContent?.trim()).toBe('');
    const { unmount } = withTenant(<Sidebar isOpen={false} onClose={() => {}} />, { ...SCHOOL, showPoweredBy: false });
    expect(screen.getAllByTestId('powered-by')).toHaveLength(1); // only the login one from above
    unmount();
  });
});
