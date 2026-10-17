import { describe, expect, it } from 'vitest';
import { approvalMessage, apiErrorMessage } from '@/lib/expense-approval';

describe('expense approval feedback', () => {
  it('tells the first approver that a second, different approver is still needed', () => {
    expect(approvalMessage({ status: 'pending', approvals: [{ approver: 'kabag' }] }))
      .toBe('Persetujuan 1 dari 2 tercatat — menunggu persetujuan orang kedua.');
  });
  it('confirms full approval', () => {
    expect(approvalMessage({ status: 'approved', approvals: [{}, {}] })).toBe('Pengeluaran disetujui dan dicatat ke jurnal.');
  });
  it('surfaces the API error text', () => {
    expect(apiErrorMessage({ response: { data: { error: 'Anda sudah menyetujui' } } }, 'Gagal')).toBe('Anda sudah menyetujui');
    expect(apiErrorMessage(new Error('x'), 'Gagal menyetujui.')).toBe('Gagal menyetujui.');
  });
});
