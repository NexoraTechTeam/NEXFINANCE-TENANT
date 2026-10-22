import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

const { svc } = vi.hoisted(() => ({ svc: { getChartOfAccounts: vi.fn(), getJournals: vi.fn() } }));
vi.mock('@/lib/api', () => ({ accountingService: svc }));

import AccountingPage from '@/app/dashboard/accounting/page';

const COA = { '1000': { name: 'Kas', type: 'Asset' }, '4000': { name: 'Pendapatan SPP', type: 'Revenue' } };
const JOURNAL = { id: 'JRN000001', date: '2026-10-01', description: 'SPP Oktober', debit: { account: '1000', name: 'Kas', amount: 5_000_000 }, credit: { account: '4000', name: 'Pendapatan SPP', amount: 5_000_000 } };

const asUser = (role: string) => window.localStorage.setItem('user', JSON.stringify({ id: 'USR1', role }));

beforeEach(() => {
  window.localStorage.clear();
  svc.getChartOfAccounts.mockResolvedValue({ data: { accounts: COA } });
  svc.getJournals.mockResolvedValue({ data: { journals: [] } });
});

describe('Accounting page header actions', () => {
  it('groups "Tambah Jurnal" and "Saldo Awal" in one action bar instead of spreading them across the header', async () => {
    asUser('admin');
    render(<AccountingPage />);
    const bar = await screen.findByRole('group', { name: 'Aksi akuntansi' });
    expect(within(bar).getByRole('button', { name: /Tambah Jurnal/ })).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: 'Saldo Awal' })).toBeInTheDocument();
  });

  it('shows a single "Tambah Jurnal" button, also when there are no journals yet', async () => {
    asUser('admin');
    render(<AccountingPage />);
    await screen.findByText('Belum ada jurnal');
    expect(screen.getAllByRole('button', { name: /Tambah Jurnal/ })).toHaveLength(1);
  });

  it('keeps a single button when journals exist', async () => {
    asUser('admin');
    svc.getJournals.mockResolvedValue({ data: { journals: [JOURNAL] } });
    render(<AccountingPage />);
    await screen.findByText('SPP Oktober');
    expect(screen.getAllByRole('button', { name: /Tambah Jurnal/ })).toHaveLength(1);
  });

  it('styles both header buttons with the shared button classes (same height and shape)', async () => {
    asUser('admin');
    render(<AccountingPage />);
    const bar = await screen.findByRole('group', { name: 'Aksi akuntansi' });
    expect(within(bar).getByRole('button', { name: /Tambah Jurnal/ })).toHaveClass('btn-primary');
    expect(within(bar).getByRole('button', { name: 'Saldo Awal' })).toHaveClass('btn-secondary');
  });

  it('shows no action bar to the read-only auditor', async () => {
    asUser('auditor');
    render(<AccountingPage />);
    await screen.findByText('Belum ada jurnal');
    expect(screen.queryByRole('group', { name: 'Aksi akuntansi' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tambah Jurnal/ })).not.toBeInTheDocument();
  });
});
