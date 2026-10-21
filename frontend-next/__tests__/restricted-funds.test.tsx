import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { svc } = vi.hoisted(() => ({
  svc: { getRestrictedFunds: vi.fn(), postRestrictedReceipt: vi.fn(), postRestrictionRelease: vi.fn() },
}));
vi.mock('@/lib/api', () => ({ accountingService: svc }));

import RestrictedFunds from '@/components/accounting/RestrictedFunds';

const M = 1_000_000;
const FUNDS = {
  funds: [
    { key: 'temporer', label: 'Dibatasi waktu/tujuan', equity: '3100', revenue: '4100', releasable: true, balance: 10 * M },
    { key: 'permanen', label: 'Dibatasi permanen', equity: '3200', revenue: '4200', releasable: false, balance: 50 * M },
  ],
  transactions: [
    { id: 'J-2', date: '2026-04-01', description: 'Renovasi musala selesai', debit: { account: '3100', amount: 8 * M }, credit: { account: '3000', amount: 8 * M }, source: { type: 'restriction_release', fund: 'temporer' } },
  ],
};

beforeEach(() => {
  Object.values(svc).forEach((fn) => fn.mockReset());
  svc.getRestrictedFunds.mockResolvedValue({ data: FUNDS });
});

describe('RestrictedFunds', () => {
  it('shows the balance of each restricted fund and the history', async () => {
    render(<RestrictedFunds />);
    const temp = await screen.findByTestId('fund-temporer');
    expect(within(temp).getByText(/Rp\s?10\.000\.000/)).toBeInTheDocument();
    expect(within(screen.getByTestId('fund-permanen')).getByText(/Rp\s?50\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText('Renovasi musala selesai')).toBeInTheDocument();
  });

  it('records a restricted receipt', async () => {
    const user = userEvent.setup();
    svc.postRestrictedReceipt.mockResolvedValue({ data: { journal: {} } });
    render(<RestrictedFunds />);
    const form = await screen.findByRole('form', { name: 'Terima dana terikat' });
    await user.selectOptions(within(form).getByLabelText('Jenis dana'), 'permanen');
    await user.clear(within(form).getByLabelText('Tanggal'));
    await user.type(within(form).getByLabelText('Tanggal'), '2026-03-02');
    await user.type(within(form).getByLabelText('Jumlah (Rp)'), '50000000');
    await user.selectOptions(within(form).getByLabelText('Diterima ke'), 'tunai');
    await user.type(within(form).getByLabelText('Keterangan'), 'Wakaf tunai');
    await user.click(within(form).getByRole('button', { name: /Simpan penerimaan/ }));
    await waitFor(() => expect(svc.postRestrictedReceipt).toHaveBeenCalledWith({
      date: '2026-03-02', fund: 'permanen', amount: 50 * M, method: 'tunai', description: 'Wakaf tunai',
    }));
    expect(svc.getRestrictedFunds).toHaveBeenCalledTimes(2);
  });

  it('releases a restriction (only releasable funds) and shows server errors', async () => {
    const user = userEvent.setup();
    svc.postRestrictionRelease.mockRejectedValue({ response: { data: { error: 'Melebihi saldo dana terikat' } } });
    render(<RestrictedFunds />);
    const form = await screen.findByRole('form', { name: 'Lepaskan pembatasan' });
    const options = within(within(form).getByLabelText('Jenis dana')).getAllByRole('option').map((o) => o.getAttribute('value'));
    expect(options).toEqual(['temporer']);
    await user.clear(within(form).getByLabelText('Tanggal'));
    await user.type(within(form).getByLabelText('Tanggal'), '2026-04-01');
    await user.type(within(form).getByLabelText('Jumlah (Rp)'), '99000000');
    await user.type(within(form).getByLabelText('Keterangan'), 'Renovasi');
    await user.click(within(form).getByRole('button', { name: /Lepaskan pembatasan/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Melebihi saldo dana terikat');
    expect(svc.postRestrictionRelease).toHaveBeenCalledWith({ date: '2026-04-01', fund: 'temporer', amount: 99 * M, description: 'Renovasi' });
  });
});
