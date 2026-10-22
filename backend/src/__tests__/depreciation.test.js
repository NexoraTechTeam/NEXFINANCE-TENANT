'use strict';

const {
  monthlyAmount, planDepreciation, monthEnd, addMonths, monthsBetween, isMonth,
} = require('../services/depreciation');

const asset = (over = {}) => ({
  cost: 1000, residualValue: 0, usefulLifeMonths: 3, depreciable: true, depreciationFrom: '2026-01', openingAccumulated: 0, ...over,
});

describe('depreciation maths (straight line, monthly)', () => {
  it('rounds the monthly charge to whole rupiah', () => {
    expect(monthlyAmount({ cost: 240_000_000, residualValue: 0, usefulLifeMonths: 240 })).toBe(1_000_000);
    expect(monthlyAmount({ cost: 1000, residualValue: 0, usefulLifeMonths: 3 })).toBe(333);
    expect(monthlyAmount({ cost: 1_000_000, residualValue: 100_000, usefulLifeMonths: 48 })).toBe(18_750);
  });

  it('posts the rounding remainder in the last month so the cost is fully depreciated', () => {
    const plan = planDepreciation(asset(), new Set(), 0, '2026-12');
    expect(plan).toEqual([
      { month: '2026-01', amount: 333 }, { month: '2026-02', amount: 333 }, { month: '2026-03', amount: 334 },
    ]);
  });

  it('only plans months up to the requested period', () => {
    expect(planDepreciation(asset(), new Set(), 0, '2026-02').map((p) => p.month)).toEqual(['2026-01', '2026-02']);
    expect(planDepreciation(asset(), new Set(), 0, '2025-12')).toEqual([]);
  });

  it('skips months already posted and never exceeds the depreciable amount', () => {
    const plan = planDepreciation(asset(), new Set(['2026-01']), 333, '2026-12');
    expect(plan).toEqual([{ month: '2026-02', amount: 333 }, { month: '2026-03', amount: 334 }]);
    expect(planDepreciation(asset(), new Set(['2026-01', '2026-02', '2026-03']), 1000, '2027-06')).toEqual([]);
  });

  it('keeps the residual value on the books', () => {
    const plan = planDepreciation(asset({ cost: 1000, residualValue: 100, usefulLifeMonths: 3 }), new Set(), 0, '2026-12');
    expect(plan.reduce((s, p) => s + p.amount, 0)).toBe(900);
  });

  it('continues an existing asset after its opening accumulated depreciation', () => {
    const plan = planDepreciation(asset({ cost: 100, usefulLifeMonths: 3, openingAccumulated: 50 }), new Set(), 0, '2026-12');
    expect(plan).toEqual([{ month: '2026-01', amount: 33 }, { month: '2026-02', amount: 17 }]);
  });

  it('never depreciates land or assets without a depreciation start', () => {
    expect(planDepreciation(asset({ depreciable: false }), new Set(), 0, '2026-12')).toEqual([]);
    expect(planDepreciation(asset({ depreciationFrom: null }), new Set(), 0, '2026-12')).toEqual([]);
  });
});

describe('month helpers', () => {
  it('computes month ends, including leap years', () => {
    expect(monthEnd('2026-02')).toBe('2026-02-28');
    expect(monthEnd('2028-02')).toBe('2028-02-29');
    expect(monthEnd('2026-12')).toBe('2026-12-31');
    expect(monthEnd('2026-04')).toBe('2026-04-30');
  });

  it('adds months across years and lists inclusive ranges', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(monthsBetween('2026-11', '2027-01')).toEqual(['2026-11', '2026-12', '2027-01']);
    expect(monthsBetween('2027-01', '2026-11')).toEqual([]);
  });

  it('validates YYYY-MM', () => {
    expect(isMonth('2026-10')).toBe(true);
    for (const bad of ['2026-13', '2026-00', '2026-1', '26-10', '', null, undefined, '2026-10-01']) expect(isMonth(bad)).toBe(false);
  });
});
