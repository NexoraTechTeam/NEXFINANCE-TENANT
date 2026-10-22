import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { svc } = vi.hoisted(() => ({
  svc: { getFixedAssets: vi.fn(), postFixedAsset: vi.fn(), runDepreciation: vi.fn() },
}));
vi.mock('@/lib/api', () => ({ accountingService: svc }));

import FixedAssets from '@/components/accounting/FixedAssets';

const M = 1_000_000;
const CATEGORIES = [
  { key: 'tanah', label: 'Tanah', depreciable: false, suggestedLifeMonths: null, account: '1500' },
  { key: 'bangunan', label: 'Bangunan', depreciable: true, suggestedLifeMonths: 240, account: '1500' },
  { key: 'peralatan', label: 'Peralatan', depreciable: true, suggestedLifeMonths: 48, account: '1510' },
  { key: 'kendaraan', label: 'Kendaraan', depreciable: true, suggestedLifeMonths: 96, account: '1510' },
];
const DATA = {
  assets: [{
    id: 'AST000001', name: 'Gedung A', category: 'bangunan', account: '1500', cost: 240 * M, residualValue: 0, usefulLifeMonths: 240,
    depreciable: true, depreciationFrom: '2025-01', acquisitionDate: '2025-01-15', mode: 'acquisition', openingAccumulated: 0,
    monthly: M, accumulated: 22 * M, bookValue: 218 * M, lastPostedMonth: '2026-09', dueMonths: 1, fullyDepreciated: false,
  }],
  totals: { cost: 240 * M, accumulated: 22 * M, bookValue: 218 * M },
  reconciliation: [
    { account: '1500', name: 'Tanah & Bangunan', ledger: 240 * M, register: 240 * M, difference: 0 },
    { account: '1590', name: 'Akumulasi Penyusutan', ledger: 22 * M, register: 22 * M, difference: 0 },
  ],
  categories: CATEGORIES,
  currentMonth: '2026-10',
};

beforeEach(() => {
  Object.values(svc).forEach((fn) => fn.mockReset());
  svc.getFixedAssets.mockResolvedValue({ data: DATA });
});

describe('FixedAssets', () => {
  it('lists the register with accumulated depreciation, book value and totals', async () => {
    render(<FixedAssets />);
    const row = (await screen.findByText('Gedung A')).closest('tr') as HTMLElement;
    expect(within(row).getByText(/Rp\s?240\.000\.000/)).toBeInTheDocument();
    expect(within(row).getByText(/Rp\s?22\.000\.000/)).toBeInTheDocument();
    expect(within(row).getByText(/Rp\s?218\.000\.000/)).toBeInTheDocument();
    expect(within(screen.getByTestId('asset-totals')).getByText(/Rp\s?218\.000\.000/)).toBeInTheDocument();
  });

  it('tells how many months still wait for depreciation and posts them up to the current month', async () => {
    const user = userEvent.setup();
    svc.runDepreciation.mockResolvedValue({ data: { period: '2026-10', posted: 1, total: M, journals: [] } });
    render(<FixedAssets />);
    expect(await screen.findByText(/1 bulan belum disusutkan/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Catat penyusutan s\.d\. 2026-10/ }));
    await waitFor(() => expect(svc.runDepreciation).toHaveBeenCalledWith('2026-10'));
    expect(await screen.findByRole('status')).toHaveTextContent(/1 jurnal penyusutan/);
    expect(svc.getFixedAssets).toHaveBeenCalledTimes(2);
  });

  it('reports a register that does not match the ledger', async () => {
    svc.getFixedAssets.mockResolvedValue({ data: { ...DATA, reconciliation: [{ account: '1500', name: 'Tanah & Bangunan', ledger: 140 * M, register: 240 * M, difference: -100 * M }] } });
    render(<FixedAssets />);
    expect(await screen.findByTestId('recon-1500')).toHaveTextContent(/selisih/i);
  });

  it('registers a purchased building with the suggested useful life', async () => {
    const user = userEvent.setup();
    svc.postFixedAsset.mockResolvedValue({ data: { asset: {} } });
    render(<FixedAssets />);
    const form = await screen.findByRole('form', { name: 'Tambah aset tetap' });
    await user.type(within(form).getByLabelText('Nama aset'), 'Gedung B');
    await user.selectOptions(within(form).getByLabelText('Kategori'), 'bangunan');
    expect(within(form).getByLabelText('Masa manfaat (bulan)')).toHaveValue('240');
    await user.clear(within(form).getByLabelText('Tanggal perolehan'));
    await user.type(within(form).getByLabelText('Tanggal perolehan'), '2026-03-10');
    await user.type(within(form).getByLabelText('Harga perolehan (Rp)'), '120000000');
    await user.click(within(form).getByRole('button', { name: /Simpan aset/ }));
    await waitFor(() => expect(svc.postFixedAsset).toHaveBeenCalledWith({
      name: 'Gedung B', category: 'bangunan', mode: 'acquisition', cost: 120 * M, usefulLifeMonths: 240, residualValue: 0,
      acquisitionDate: '2026-03-10', method: 'transfer',
    }));
    expect(svc.getFixedAssets).toHaveBeenCalledTimes(2);
  });

  it('keeps the chosen category and its matching useful life after saving (no Bangunan with 48 months)', async () => {
    const user = userEvent.setup();
    svc.postFixedAsset.mockResolvedValue({ data: { asset: {} } });
    render(<FixedAssets />);
    const form = await screen.findByRole('form', { name: 'Tambah aset tetap' });
    await user.selectOptions(within(form).getByLabelText('Kategori'), 'peralatan');
    await user.type(within(form).getByLabelText('Nama aset'), 'Proyektor');
    await user.type(within(form).getByLabelText('Harga perolehan (Rp)'), '5000000');
    await user.click(within(form).getByRole('button', { name: /Simpan aset/ }));
    await waitFor(() => expect(svc.postFixedAsset).toHaveBeenCalled());
    await screen.findByRole('status');
    expect(within(form).getByLabelText('Kategori')).toHaveValue('peralatan');
    expect(within(form).getByLabelText('Masa manfaat (bulan)')).toHaveValue('48');
    expect(within(form).getByLabelText('Nama aset')).toHaveValue('');
  });

  it('asks for the start month and accumulated depreciation of an asset already in use, and hides life for land', async () => {
    const user = userEvent.setup();
    svc.postFixedAsset.mockResolvedValue({ data: { asset: {} } });
    render(<FixedAssets />);
    const form = await screen.findByRole('form', { name: 'Tambah aset tetap' });
    await user.selectOptions(within(form).getByLabelText('Kategori'), 'tanah');
    expect(within(form).queryByLabelText('Masa manfaat (bulan)')).not.toBeInTheDocument();
    await user.selectOptions(within(form).getByLabelText('Kategori'), 'peralatan');
    await user.selectOptions(within(form).getByLabelText('Status aset'), 'existing');
    await user.type(within(form).getByLabelText('Nama aset'), 'Komputer lab');
    await user.type(within(form).getByLabelText('Harga perolehan (Rp)'), '20000000');
    await user.type(within(form).getByLabelText('Akumulasi penyusutan saat ini (Rp)'), '5000000');
    await user.clear(within(form).getByLabelText('Mulai disusutkan (bulan)'));
    await user.type(within(form).getByLabelText('Mulai disusutkan (bulan)'), '2026-11');
    await user.click(within(form).getByRole('button', { name: /Simpan aset/ }));
    await waitFor(() => expect(svc.postFixedAsset).toHaveBeenCalled());
    expect(svc.postFixedAsset.mock.calls[0][0]).toMatchObject({
      name: 'Komputer lab', category: 'peralatan', mode: 'existing', cost: 20 * M, accumulatedDepreciation: 5 * M, depreciationFrom: '2026-11', usefulLifeMonths: 48,
    });
    expect(svc.postFixedAsset.mock.calls[0][0]).not.toHaveProperty('method');
  });

  it('shows server errors', async () => {
    const user = userEvent.setup();
    svc.postFixedAsset.mockRejectedValue({ response: { data: { error: 'Harga perolehan harus berupa angka lebih dari 0' } } });
    render(<FixedAssets />);
    const form = await screen.findByRole('form', { name: 'Tambah aset tetap' });
    await user.type(within(form).getByLabelText('Nama aset'), 'X');
    await user.type(within(form).getByLabelText('Harga perolehan (Rp)'), '1');
    await user.click(within(form).getByRole('button', { name: /Simpan aset/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('lebih dari 0');
  });

  it('is read-only for the auditor (register only, no forms or buttons)', async () => {
    render(<FixedAssets readOnly />);
    expect(await screen.findByText('Gedung A')).toBeInTheDocument();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Catat penyusutan/ })).not.toBeInTheDocument();
  });

  it('explains the empty state', async () => {
    svc.getFixedAssets.mockResolvedValue({ data: { ...DATA, assets: [], totals: { cost: 0, accumulated: 0, bookValue: 0 }, reconciliation: [] } });
    render(<FixedAssets />);
    expect(await screen.findByText(/Belum ada aset tetap/)).toBeInTheDocument();
  });
});
