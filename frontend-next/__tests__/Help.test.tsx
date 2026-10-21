import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const push = vi.fn();
let pathname = '/dashboard/spp';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));

import HelpCenter from '@/components/help/HelpCenter';
import HelpLauncher from '@/components/help/HelpLauncher';
import Sidebar from '@/components/Sidebar';
import { TourProvider } from '@/components/tour/TourProvider';
import type { TourStep } from '@/lib/tour';

const STEPS: TourStep[] = [
  { id: 'intro', title: 'Tur dimulai', body: 'Langkah pertama dari tur aplikasi.' },
];

function withTour(ui: React.ReactElement) {
  return render(<TourProvider steps={STEPS} autoStart={false}>{ui}</TourProvider>);
}

beforeEach(() => {
  push.mockClear();
  pathname = '/dashboard/spp';
});

describe('HelpCenter page', () => {
  it('renders the help hub with module guides and FAQ', () => {
    withTour(<HelpCenter />);
    expect(screen.getByRole('heading', { level: 1, name: /Pusat Bantuan/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Manajemen SPP' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Pertanyaan Umum/i })).toBeInTheDocument();
  });

  it('filters FAQ entries with the search box', async () => {
    const user = userEvent.setup();
    withTour(<HelpCenter />);
    const faq = screen.getByRole('region', { name: /Pertanyaan Umum/i });
    const before = within(faq).getAllByRole('button', { expanded: false }).length;
    await user.type(screen.getByRole('searchbox', { name: /Cari bantuan/i }), 'password');
    const after = within(faq).getAllByRole('button').length;
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
    await user.clear(screen.getByRole('searchbox', { name: /Cari bantuan/i }));
    await user.type(screen.getByRole('searchbox', { name: /Cari bantuan/i }), 'zzz-tidak-ada');
    expect(within(faq).getByText(/Tidak ada hasil/i)).toBeInTheDocument();
  });

  it('expands an FAQ answer accordion', async () => {
    const user = userEvent.setup();
    withTour(<HelpCenter />);
    const faq = screen.getByRole('region', { name: /Pertanyaan Umum/i });
    const first = within(faq).getAllByRole('button')[0];
    expect(first).toHaveAttribute('aria-expanded', 'false');
    await user.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
  });

  it('starts the product tour from the help hub', async () => {
    const user = userEvent.setup();
    withTour(<HelpCenter />);
    await user.click(screen.getByRole('button', { name: /Mulai tur aplikasi/i }));
    expect(screen.getByRole('dialog', { name: 'Tur dimulai' })).toBeInTheDocument();
  });
});

describe('HelpLauncher', () => {
  it('shows contextual tips for the current page', async () => {
    const user = userEvent.setup();
    withTour(<HelpLauncher />);
    await user.click(screen.getByRole('button', { name: /Bantuan cepat/i }));
    const panel = screen.getByRole('dialog', { name: /Bantuan cepat/i });
    expect(within(panel).getByText('Manajemen SPP')).toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: /Buka Pusat Bantuan/i }));
    expect(push).toHaveBeenCalledWith('/dashboard/help');
  });

  it('closes with Escape', () => {
    withTour(<HelpLauncher />);
    fireEvent.click(screen.getByRole('button', { name: /Bantuan cepat/i }));
    expect(screen.getByRole('dialog', { name: /Bantuan cepat/i })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /Bantuan cepat/i })).not.toBeInTheDocument();
  });
});

describe('Sidebar', () => {
  it('exposes a Bantuan menu entry and tour anchors', async () => {
    const user = userEvent.setup();
    render(<Sidebar isOpen={false} onClose={() => {}} />);
    const help = screen.getByRole('button', { name: /Bantuan/i });
    expect(help).toHaveAttribute('data-tour', 'help-menu');
    await user.click(help);
    expect(push).toHaveBeenCalledWith('/dashboard/help');
    for (const anchor of ['brand', 'nav', 'profile']) {
      expect(document.querySelector(`[data-tour="${anchor}"]`)).not.toBeNull();
    }
  });

  it('keeps every existing module entry for a super admin', async () => {
    window.localStorage.setItem('user', JSON.stringify({ role: 'super_admin', name: 'Admin' }));
    render(<Sidebar isOpen={false} onClose={() => {}} />);
    await screen.findByRole('button', { name: /^SPP/ });
    for (const label of [
      'Dashboard', 'SPP', 'Penggajian', 'Pengeluaran', 'Pengadaan', 'Akuntansi', 'Laporan',
      'Log Historis', 'Master Siswa', 'Master Karyawan', 'Role & Akses', 'Keluar',
    ]) {
      expect(screen.getByRole('button', { name: new RegExp(`^${label.replace(/[&]/g, '\\$&')}`) })).toBeInTheDocument();
    }
  });
});
