'use strict';

/**
 * Straight-line, monthly depreciation (pure functions).
 * A month is `YYYY-MM`; the charge of a month is posted on its last day.
 */

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
const isMonth = (v) => typeof v === 'string' && MONTH_RE.test(v);

const toIndex = (month) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1;
const fromIndex = (i) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;
const addMonths = (month, n) => fromIndex(toIndex(month) + n);
const monthsBetween = (from, to) => {
  const out = [];
  for (let i = toIndex(from); i <= toIndex(to); i += 1) out.push(fromIndex(i));
  return out;
};
const monthEnd = (month) => {
  const last = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
  return `${month}-${String(last).padStart(2, '0')}`;
};
const currentMonth = (now = new Date()) => now.toISOString().slice(0, 7);

const depreciableAmount = ({ cost, residualValue = 0 }) => cost - (residualValue || 0);
const monthlyAmount = (asset) => Math.round(depreciableAmount(asset) / asset.usefulLifeMonths);

/**
 * Months still to be posted up to `upTo`, in order. `posted` holds the months already booked and
 * `postedTotal` their sum. The last month absorbs rounding (or a remainder smaller than half a month)
 * so an asset is depreciated by exactly its depreciable amount, never more.
 */
function planDepreciation(asset, posted, postedTotal, upTo) {
  if (!asset.depreciable || !isMonth(asset.depreciationFrom) || asset.depreciationFrom > upTo) return [];
  const monthly = monthlyAmount(asset);
  let remaining = depreciableAmount(asset) - (asset.openingAccumulated || 0) - postedTotal;
  const plan = [];
  for (const month of monthsBetween(asset.depreciationFrom, upTo)) {
    if (remaining <= 0) break;
    if (posted.has(month)) continue;
    const amount = remaining - monthly < monthly / 2 ? remaining : monthly;
    plan.push({ month, amount });
    remaining -= amount;
  }
  return plan;
}

module.exports = {
  isMonth, addMonths, monthsBetween, monthEnd, currentMonth, depreciableAmount, monthlyAmount, planDepreciation,
};
