import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { postOpeningBalance } = vi.hoisted(() => ({ postOpeningBalance: vi.fn() }));
vi.mock('@/lib/api', () => ({ accountingService: { postOpeningBalance } }));

import OpeningBalanceForm from '@/components/accounting/OpeningBalanceForm';

const COA = {
  '1000': { name: 'Kas', type: 'Asset' },
  '1100': { name: 'Rekening Bank', type: 'Asset' },
  '2000': { name: 'Hutang Usaha', type: 'Liability' },
  '3000': { name: 'Dana Tidak Terikat', type: 'Equity' },
  '4000': { name: 'Pendapatan SPP', type: 'Revenue' },
};

beforeEach(() => postOpeningBalance.mockReset());

describe('OpeningBalanceForm', () => {
  it('lists only balance-sheet accounts (not 3000/revenue) and posts non-zero amounts', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    postOpeningBalance.mockResolvedValue({ data: { journals: [] } });
    render(<OpeningBalanceForm accounts={COA} onDone={onDone} onCancel={() => {}} />);

    expect(screen.queryByLabelText(/Pendapatan SPP/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Dana Tidak Terikat/)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/1000 · Kas/), '5000000');
    await user.type(screen.getByLabelText(/1100 · Rekening Bank/), '120000000');
    await user.clear(screen.getByLabelText('Tanggal saldo awal'));
    await user.type(screen.getByLabelText('Tanggal saldo awal'), '2026-07-01');
    // no liabilities entered: assets and unrestricted funds are both 125M
    expect(screen.getAllByText(/Rp\s?125\.000\.000/)).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: /Simpan saldo awal/i }));
    await waitFor(() => expect(postOpeningBalance).toHaveBeenCalledWith({
      date: '2026-07-01',
      entries: [{ account: '1000', amount: 5_000_000 }, { account: '1100', amount: 120_000_000 }],
    }));
    expect(onDone).toHaveBeenCalled();
  });

  it('requires at least one amount', async () => {
    const user = userEvent.setup();
    render(<OpeningBalanceForm accounts={COA} onDone={() => {}} onCancel={() => {}} />);
    await user.click(screen.getByRole('button', { name: /Simpan saldo awal/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/minimal satu/i);
    expect(postOpeningBalance).not.toHaveBeenCalled();
  });
});
