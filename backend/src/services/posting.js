'use strict';

/**
 * Automatic double-entry postings for module transactions (accrual basis).
 * Account mapping can be overridden per tenant via settings key `posting_accounts`.
 */

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
};

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

module.exports = {
  DEFAULT_ACCOUNTS, loadContext, postSppInvoice, postSppPayment, postPayroll,
  postApprovedExpense, postReceivedPurchaseOrder, postOpeningBalance,
};
