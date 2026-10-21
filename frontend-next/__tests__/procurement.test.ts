import { describe, expect, it } from 'vitest';
import { canReceivePO, poStatusKey } from '@/lib/procurement';

describe('purchase order status', () => {
  it('lets open orders be received — the API issues POs with status "issued"', () => {
    expect(canReceivePO('issued')).toBe(true);
    expect(canReceivePO('ordered')).toBe(true);
    expect(canReceivePO('received')).toBe(false);
  });
  it('shows issued orders with the ordered badge', () => {
    expect(poStatusKey('issued')).toBe('ordered');
    expect(poStatusKey('received')).toBe('received');
  });
});

import { prsFrom, posFrom } from '@/lib/procurement';

describe('procurement list responses', () => {
  it('reads the API keys (purchaseRequests / purchaseOrders)', () => {
    expect(prsFrom({ purchaseRequests: [{ id: 'PR000001' }] })).toEqual([{ id: 'PR000001' }]);
    expect(posFrom({ purchaseOrders: [{ id: 'PO000001' }] })).toEqual([{ id: 'PO000001' }]);
  });
  it('still accepts the short keys and tolerates empty bodies', () => {
    expect(prsFrom({ prs: [{ id: 'A' }] })).toEqual([{ id: 'A' }]);
    expect(posFrom(undefined)).toEqual([]);
  });
});

import { openPRsForPO } from '@/lib/procurement';

describe('PO form: purchase requests to choose from', () => {
  it('lists only PRs that do not have a PO yet', () => {
    const prs = [{ id: 'PR000001', item: 'Kertas' }, { id: 'PR000002', item: 'Spidol' }, { id: 'PR000003', item: 'Map', status: 'rejected' }];
    const pos = [{ id: 'PO000001', prId: 'PR000001' }];
    expect(openPRsForPO(prs, pos).map((p) => p.id)).toEqual(['PR000002']);
  });
});
