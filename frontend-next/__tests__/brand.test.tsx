import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/dashboard',
}));

import Sidebar from '@/components/Sidebar';
import LoginPage from '@/app/login/page';
import BrandMark from '@/components/brand/BrandMark';

describe('official NexFinance branding', () => {
  it('renders the official product mark', () => {
    render(<BrandMark size={40} />);
    const img = screen.getByRole('img', { name: 'NexFinance' });
    expect(img.getAttribute('src')).toContain('/brand/nexfinance-mark');
  });

  it('shows the product mark and Nexora co-brand in the sidebar', () => {
    render(<Sidebar isOpen={false} onClose={() => {}} />);
    expect(screen.getAllByRole('img', { name: 'NexFinance' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('img', { name: /Nexora/ })).toBeInTheDocument();
  });

  it('uses the product mark on the login page and keeps the form intact', () => {
    render(<LoginPage />);
    expect(screen.getAllByRole('img', { name: 'NexFinance' }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('img', { name: /Nexora/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email atau username/)).toBeRequired();
    expect(screen.getByLabelText(/Email atau username/)).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Password')).toBeRequired();
  });
});
