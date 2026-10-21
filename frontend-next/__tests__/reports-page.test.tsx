import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PKG } from './fixtures/isak335';

const { svc } = vi.hoisted(() => ({ svc: { getIsak335: vi.fn(), getMonthly: vi.fn() } }));
vi.mock('@/lib/api', () => ({ accountingService: svc }));
vi.mock('@/lib/report-pdf', () => ({ downloadFinancialReportPdf: vi.fn() }));

import ReportsPage from '@/app/dashboard/reports/page';

beforeEach(() => {
  svc.getIsak335.mockResolvedValue({ data: PKG });
  svc.getMonthly.mockResolvedValue({ data: { months: [] } });
});

describe('Reports page (ISAK 335)', () => {
  it('names the standard and shows the statement of financial position with two net-asset classes', async () => {
    render(<ReportsPage />);
    expect((await screen.findAllByText(/ISAK 335 \(d\/h ISAK 35\)/)).length).toBeGreaterThan(0);
    expect(await screen.findByText('Aset neto dengan pembatasan dari pemberi sumber daya')).toBeInTheDocument();
    expect(screen.getAllByText(/Rp\s?691\.000\.000/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/ISAK 35 Ready/)).not.toBeInTheDocument();
  });

  it('has a tab for each ISAK 335 statement and the notes', async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    await screen.findByText('Aset neto dengan pembatasan dari pemberi sumber daya');
    await user.click(screen.getByRole('button', { name: /Perubahan Aset Neto/ }));
    expect(screen.getByText('Saldo akhir aset neto dengan pembatasan')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Arus Kas/ }));
    expect(screen.getByText('Kas dan setara kas akhir tahun')).toBeInTheDocument();
    expect(screen.getByText('Perolehan Tanah & Bangunan')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Catatan/ }));
    const notes = screen.getByRole('region', { name: 'Catatan atas Laporan Keuangan' });
    expect(within(notes).getByText(/Renovasi musala selesai/)).toBeInTheDocument();
    expect(within(notes).getByText(/SAK Entitas Privat/)).toBeInTheDocument();
  });

  it('shows the account classification (net-asset class and cash-flow activity)', async () => {
    render(<ReportsPage />);
    expect(await screen.findByText('Pendapatan Donasi')).toBeInTheDocument();
    expect(screen.getByText('Dengan pembatasan')).toBeInTheDocument();
    expect(screen.getByText('Pendanaan')).toBeInTheDocument();
  });
});
