'use strict';

/**
 * Automatic double-entry postings for module transactions (accrual basis).
 * Account mapping can be overridden per tenant via settings key `posting_accounts`.
 */

const { DEFAULT_RESTRICTED_FUNDS, accountBalances } = require('./ledger');
const { monthEnd, addMonths } = require('./depreciation');

const DEFAULT_ACCOUNTS = {
  cash: '1000',
  bank: '1100',
  sppReceivable: '1200',
  inventory: '1300',
  accountsPayable: '2000',
  salariesPayable: '2100',
  unrestrictedFunds: '3000',
  sppRevenue: '4000',
  salaryExpense: '5000',
  operationalExpense: '5100',
  expenseByCategory: {
    'ATK & Supplies': '5300',
    Utilitas: '5400',
    Pemeliharaan: '5200',
  },
  restrictedFunds: DEFAULT_RESTRICTED_FUNDS,
  fixedAssetByCategory: { tanah: '1500', bangunan: '1500', peralatan: '1510', kendaraan: '1510' },
  accumulatedDepreciation: '1590',
  depreciationExpense: '5500',
};

const { badRequest } = require('../lib/http');

const today = () => new Date().toISOString().split('T')[0];

async function loadContext(store) {
  const coa = Object.fromEntries((await store.list('chart_of_accounts')).map(({ id, ...a }) => [id, a]));
  const row = await store.db.withSchema(store.schema).from('settings').where({ key: 'posting_accounts' }).first();
  const accounts = { ...DEFAULT_ACCOUNTS, ...(row?.value || {}) };
  return { coa, accounts };
}

async function post(store, ctx, { date = today(), description, debit, credit, amount, source }) {
  const value = Math.round(Number(amount) || 0);
  if (value <= 0) return null;
  return store.insert('journals', {
    id: await store.nextId('journals'),
    date,
    description,
    debit: { account: debit, name: ctx.coa[debit]?.name || debit, amount: value },
    credit: { account: credit, name: ctx.coa[credit]?.name || credit, amount: value },
    createdAt: today(),
    auto: true,
    source,
  });
}

const cashAccountFor = (accounts, method) => (/tunai|cash/i.test(method || '') ? accounts.cash : accounts.bank);

async function postSppInvoice(store, invoice) {
  const ctx = await loadContext(store);
  return post(store, ctx, {
    description: `Tagihan SPP ${invoice.month} — ${invoice.studentName} (${invoice.id})`,
    debit: ctx.accounts.sppReceivable,
    credit: ctx.accounts.sppRevenue,
    amount: invoice.amount,
    source: { type: 'spp_invoice', id: invoice.id },
  });
}

async function postSppPayment(store, invoice) {
  const ctx = await loadContext(store);
  return post(store, ctx, {
    description: `Pembayaran SPP ${invoice.month} — ${invoice.studentName} (${invoice.id}) via ${invoice.paymentMethod}`,
    debit: cashAccountFor(ctx.accounts, invoice.paymentMethod),
    credit: ctx.accounts.sppReceivable,
    amount: invoice.amount,
    source: { type: 'spp_payment', id: invoice.id },
  });
}

async function postPayroll(store, run) {
  const ctx = await loadContext(store);
  const source = { type: 'payroll', id: run.id };
  await post(store, ctx, {
    description: `Gaji ${run.month} — ${run.employeeName} (dibayar)`,
    debit: ctx.accounts.salaryExpense,
    credit: ctx.accounts.bank,
    amount: run.netSalary,
    source,
  });
  await post(store, ctx, {
    description: `Potongan BPJS/PPh ${run.month} — ${run.employeeName} (terutang)`,
    debit: ctx.accounts.salaryExpense,
    credit: ctx.accounts.salariesPayable,
    amount: run.grossSalary - run.netSalary,
    source,
  });
}

async function postApprovedExpense(store, expense) {
  const ctx = await loadContext(store);
  return post(store, ctx, {
    description: `Pengeluaran ${expense.category} — ${expense.title || expense.description} (${expense.id})`,
    debit: ctx.accounts.expenseByCategory?.[expense.category] || ctx.accounts.operationalExpense,
    credit: ctx.accounts.bank,
    amount: expense.amount,
    source: { type: 'expense', id: expense.id },
  });
}

async function postReceivedPurchaseOrder(store, po) {
  const ctx = await loadContext(store);
  return post(store, ctx, {
    description: `Penerimaan barang PO ${po.id} — ${po.vendor}`,
    debit: ctx.accounts.inventory,
    credit: ctx.accounts.accountsPayable,
    amount: po.totalAmount,
    source: { type: 'purchase_order', id: po.id },
  });
}

/** Opening balances are posted against unrestricted net assets (3000). */
async function postOpeningBalance(store, { date, entries }) {
  const ctx = await loadContext(store);
  const equity = ctx.accounts.unrestrictedFunds;
  const posted = [];
  for (const { account, amount } of entries) {
    const type = ctx.coa[account]?.type;
    const isDebit = type === 'Asset';
    posted.push(await post(store, ctx, {
      date,
      description: `Saldo awal — ${ctx.coa[account].name}`,
      debit: isDebit ? account : equity,
      credit: isDebit ? equity : account,
      amount,
      source: { type: 'opening_balance', id: account },
    }));
  }
  return posted.filter(Boolean);
}


/** Balance of one restricted fund (equity + restricted revenue) from the given journals. */
function restrictedBalance(journals, coa, fund) {
  const b = accountBalances(journals, coa);
  return (b[fund.equity] || 0) + (b[fund.revenue] || 0);
}

function fundOf(ctx, key) {
  const fund = ctx.accounts.restrictedFunds?.[key];
  if (!fund) throw badRequest('Jenis dana terikat tidak dikenal');
  return fund;
}

/** Contribution with a donor restriction: cash/bank against the restricted revenue account. */
async function postRestrictedReceipt(store, { date = today(), fund: key, amount, method, description }) {
  const ctx = await loadContext(store);
  const fund = fundOf(ctx, key);
  if (!(Number(amount) > 0) || !description) throw badRequest('Tanggal, jumlah dan keterangan wajib diisi');
  return post(store, ctx, {
    date,
    description: `Penerimaan dana terikat (${fund.label}) — ${description}`,
    debit: cashAccountFor(ctx.accounts, method),
    credit: fund.revenue,
    amount,
    source: { type: 'restricted_receipt', fund: key },
  });
}

/** Restriction met: reclassify from net assets with restrictions to net assets without restrictions. */
async function postRestrictionRelease(store, { date = today(), fund: key, amount, description }) {
  const ctx = await loadContext(store);
  const fund = fundOf(ctx, key);
  if (!fund.releasable) throw badRequest('Dana dengan pembatasan permanen tidak dapat dilepaskan');
  if (!(Number(amount) > 0) || !description) throw badRequest('Tanggal, jumlah dan keterangan wajib diisi');
  // Available = the lowest running balance from `date` on, so a back-dated release never overdraws a later one.
  const journals = await store.list('journals');
  const checkpoints = [date, ...journals.map((j) => String(j.date)).filter((d) => d > date)];
  const available = Math.min(...checkpoints.map((d) => restrictedBalance(journals.filter((j) => String(j.date) <= d), ctx.coa, fund)));
  if (Number(amount) > available) {
    const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(available);
    throw badRequest(`Melebihi saldo dana terikat per ${date} (tersedia ${rupiah})`);
  }
  return post(store, ctx, {
    date,
    description,
    debit: fund.equity,
    credit: ctx.accounts.unrestrictedFunds,
    amount,
    source: { type: 'restriction_release', fund: key },
  });
}

/** Cost of a purchased fixed asset: asset account against cash or bank. */
async function postAssetAcquisition(store, asset, method) {
  const ctx = await loadContext(store);
  return post(store, ctx, {
    date: asset.acquisitionDate,
    description: `Perolehan aset tetap — ${asset.name} (${asset.id})`,
    debit: asset.account,
    credit: cashAccountFor(ctx.accounts, method),
    amount: asset.cost,
    source: { type: 'asset_acquisition', id: asset.id },
  });
}

/** Accumulated depreciation of an asset already in use: counted in the opening position (against net assets without restrictions). */
async function postOpeningAccumulatedDepreciation(store, asset) {
  const ctx = await loadContext(store);
  return post(store, ctx, {
    date: monthEnd(addMonths(asset.depreciationFrom, -1)),
    description: `Saldo awal akumulasi penyusutan — ${asset.name} (${asset.id})`,
    debit: ctx.accounts.unrestrictedFunds,
    credit: ctx.accounts.accumulatedDepreciation,
    amount: asset.openingAccumulated,
    source: { type: 'opening_balance', id: ctx.accounts.accumulatedDepreciation, assetId: asset.id },
  });
}

/** One month of depreciation of one asset, dated on the last day of the month. */
async function postDepreciation(store, ctx, asset, { month, amount }) {
  return post(store, ctx, {
    date: monthEnd(month),
    description: `Penyusutan ${month} — ${asset.name} (${asset.id})`,
    debit: ctx.accounts.depreciationExpense,
    credit: ctx.accounts.accumulatedDepreciation,
    amount,
    source: { type: 'depreciation', assetId: asset.id, month },
  });
}

module.exports = {
  postAssetAcquisition, postOpeningAccumulatedDepreciation, postDepreciation,
  DEFAULT_ACCOUNTS, loadContext, postSppInvoice, postSppPayment, postPayroll,
  postApprovedExpense, postReceivedPurchaseOrder, postOpeningBalance,
  postRestrictedReceipt, postRestrictionRelease, restrictedBalance,
};
