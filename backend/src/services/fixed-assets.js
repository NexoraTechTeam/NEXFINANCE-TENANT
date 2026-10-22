'use strict';

/**
 * Fixed-asset register and monthly depreciation (ISAK 335 / SAK: assets at cost less accumulated depreciation).
 * Straight-line only; land is never depreciated. The register is detail behind the ledger accounts:
 * acquisitions and depreciation are posted as journals, so every report stays computed from journals.
 */

const { badRequest } = require('../lib/http');
const { positiveAmount, isoDate, firstError, toNumber } = require('../lib/validate');
const {
  isMonth, monthlyAmount, planDepreciation, currentMonth, depreciableAmount, monthEnd, addMonths,
} = require('./depreciation');
const {
  loadContext, postAssetAcquisition, postOpeningAccumulatedDepreciation, postDepreciation,
} = require('./posting');

const CATEGORY_DEFS = [
  { key: 'tanah', label: 'Tanah', depreciable: false, suggestedLifeMonths: null },
  { key: 'bangunan', label: 'Bangunan', depreciable: true, suggestedLifeMonths: 240 },
  { key: 'peralatan', label: 'Peralatan', depreciable: true, suggestedLifeMonths: 48 },
  { key: 'kendaraan', label: 'Kendaraan', depreciable: true, suggestedLifeMonths: 96 },
];
const MODES = ['acquisition', 'existing'];
const METHODS = ['transfer', 'tunai'];

const categories = (accounts) => CATEGORY_DEFS.map((c) => ({ ...c, account: accounts.fixedAssetByCategory?.[c.key] }));

const integer = (v) => {
  const n = toNumber(v);
  return Number.isInteger(n) ? n : NaN;
};

/** Validates the payload and returns the asset to store, or throws a 400. */
function buildAsset(input, accounts) {
  const body = input || {};
  const mode = body.mode === undefined ? 'acquisition' : body.mode;
  const category = CATEGORY_DEFS.find((c) => c.key === body.category);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const cost = Math.round(toNumber(body.cost));
  const early = firstError(
    name && name.length <= 120 ? null : 'Nama aset wajib diisi (maksimal 120 karakter)',
    category ? null : 'Kategori aset tidak dikenal',
    MODES.includes(mode) ? null : 'Mode pencatatan tidak dikenal',
    positiveAmount(body.cost, 'Harga perolehan'),
    isoDate(body.acquisitionDate, 'Tanggal perolehan'),
  );
  if (early) throw badRequest(early);

  const asset = {
    name, category: category.key, account: accounts.fixedAssetByCategory[category.key], mode, cost,
    residualValue: 0, usefulLifeMonths: null, depreciable: category.depreciable, depreciationFrom: null,
    openingAccumulated: 0, acquisitionDate: body.acquisitionDate,
  };
  if (mode === 'acquisition' && !METHODS.includes(body.method === undefined ? 'transfer' : body.method)) {
    throw badRequest('Metode pembayaran harus transfer atau tunai');
  }
  if (!category.depreciable) return asset;

  const life = integer(body.usefulLifeMonths);
  const residual = body.residualValue === undefined || body.residualValue === '' ? 0 : Math.round(toNumber(body.residualValue));
  const from = body.depreciationFrom === undefined ? (mode === 'acquisition' ? body.acquisitionDate.slice(0, 7) : undefined) : body.depreciationFrom;
  const accumulated = body.accumulatedDepreciation === undefined || body.accumulatedDepreciation === '' ? 0 : Math.round(toNumber(body.accumulatedDepreciation));
  const invalid = firstError(
    Number.isInteger(life) && life >= 1 && life <= 600 ? null : 'Masa manfaat harus bilangan bulat 1–600 bulan',
    Number.isFinite(residual) && residual >= 0 ? null : 'Nilai residu tidak boleh negatif',
    residual < cost ? null : 'Nilai residu harus lebih kecil dari harga perolehan',
    isMonth(from) ? null : 'Mulai disusutkan harus berformat YYYY-MM',
    Number.isFinite(accumulated) && accumulated >= 0 ? null : 'Akumulasi penyusutan tidak boleh negatif',
    mode === 'existing' || accumulated === 0 ? null : 'Akumulasi penyusutan hanya untuk aset yang sudah ada',
    accumulated <= cost - residual ? null : 'Akumulasi penyusutan melebihi nilai yang dapat disusutkan',
  );
  if (invalid) throw badRequest(invalid);
  Object.assign(asset, { usefulLifeMonths: life, residualValue: residual, depreciationFrom: from, openingAccumulated: accumulated });
  if (monthlyAmount(asset) < 1) throw badRequest('Nilai yang disusutkan terlalu kecil untuk masa manfaat tersebut');
  return asset;
}

/** Register the asset (and post its cost, or its opening accumulated depreciation, to the ledger). */
async function createAsset(store, input, user) {
  const { accounts } = await loadContext(store);
  const asset = buildAsset(input, accounts);
  const record = await store.insert('fixed_assets', {
    id: await store.nextId('fixed_assets'), ...asset, createdAt: new Date().toISOString().split('T')[0], createdBy: user?.id || null,
  });
  if (asset.mode === 'acquisition') await postAssetAcquisition(store, record, input.method === undefined ? 'transfer' : input.method);
  else if (record.openingAccumulated > 0) await postOpeningAccumulatedDepreciation(store, record);
  return record;
}

const depreciationJournals = (journals) => journals.filter((j) => j.source?.type === 'depreciation');

function postedFor(journals) {
  const byAsset = new Map();
  for (const j of depreciationJournals(journals)) {
    const entry = byAsset.get(j.source.assetId) || { months: new Set(), total: 0 };
    entry.months.add(j.source.month);
    entry.total += Number(j.debit?.amount) || 0;
    byAsset.set(j.source.assetId, entry);
  }
  return byAsset;
}

/**
 * Register rows with accumulated depreciation and book value. `asOf` (YYYY-MM-DD) limits to journals up to
 * that date (year-end notes); `upTo` is the month up to which depreciation is considered due.
 */
function summarizeAssets(assets, journals, { asOf = '9999-12-31', upTo = currentMonth() } = {}) {
  const dated = journals.filter((j) => String(j.date) <= asOf);
  const posted = postedFor(dated);
  return assets.filter((a) => a.acquisitionDate <= asOf || a.mode === 'existing').map((a) => {
    const entry = posted.get(a.id) || { months: new Set(), total: 0 };
    // The opening accumulated depreciation is booked on the last day of the month before depreciation starts.
    const openingBooked = a.openingAccumulated > 0 && monthEnd(addMonths(a.depreciationFrom, -1)) <= asOf ? a.openingAccumulated : 0;
    const accumulated = openingBooked + entry.total;
    const due = planDepreciation(a, entry.months, entry.total, upTo);
    const lastPostedMonth = [...entry.months].sort().pop() || null;
    return {
      ...a,
      monthly: a.depreciable ? monthlyAmount(a) : 0,
      accumulated,
      bookValue: a.cost - accumulated,
      lastPostedMonth,
      dueMonths: due.length,
      fullyDepreciated: a.depreciable && depreciableAmount(a) - accumulated <= 0,
    };
  });
}

/** Register against the ledger accounts, so a missing or double entry in the opening balance is visible. */
function reconcile(rows, balances, coa, accounts) {
  if (rows.length === 0) return [];
  const accumulatedCode = accounts.accumulatedDepreciation;
  const costCodes = [...new Set(rows.map((r) => r.account))].sort();
  const cost = costCodes.map((code) => {
    const register = rows.filter((r) => r.account === code).reduce((s, r) => s + r.cost, 0);
    const ledger = balances[code] || 0;
    return { account: code, name: coa[code]?.name || code, ledger, register, difference: ledger - register };
  });
  const register = rows.reduce((s, r) => s + r.accumulated, 0);
  const ledger = -(balances[accumulatedCode] || 0);
  return [...cost, { account: accumulatedCode, name: coa[accumulatedCode]?.name || accumulatedCode, ledger, register, difference: ledger - register }]
    .sort((a, b) => a.account.localeCompare(b.account));
}

/** Post every missing month up to `period` for every depreciable asset; safe to repeat and to run concurrently. */
async function runDepreciation(store, period, now = new Date()) {
  if (!isMonth(period)) throw badRequest('Periode harus berformat YYYY-MM');
  if (period > currentMonth(now)) throw badRequest('Penyusutan tidak dapat dicatat untuk bulan yang belum berjalan');
  return store.withTransaction(async (tx) => {
    await tx.db.raw('SELECT pg_advisory_xact_lock(hashtext(?))', [`depreciation:${tx.schema}`]);
    const ctx = await loadContext(tx);
    const assets = await tx.list('fixed_assets');
    const posted = postedFor(await tx.list('journals'));
    const journals = [];
    for (const asset of assets) {
      const entry = posted.get(asset.id) || { months: new Set(), total: 0 };
      for (const step of planDepreciation(asset, entry.months, entry.total, period)) {
        journals.push(await postDepreciation(tx, ctx, asset, step));
      }
    }
    return { period, posted: journals.length, total: journals.reduce((s, j) => s + j.debit.amount, 0), journals };
  });
}

/** Note G of the ISAK 335 package: cost, accumulated depreciation and book value per category. */
function fixedAssetNote(rows) {
  const lines = [];
  let book = 0;
  for (const c of CATEGORY_DEFS) {
    const group = rows.filter((r) => r.category === c.key);
    if (group.length === 0) continue;
    const sum = (key) => group.reduce((s, r) => s + r[key], 0);
    lines.push({ label: `${c.label} — harga perolehan`, amount: sum('cost') });
    if (c.depreciable) lines.push({ label: `${c.label} — akumulasi penyusutan`, amount: sum('accumulated') });
    lines.push({ label: `${c.label} — nilai buku`, amount: sum('bookValue') });
    book += sum('bookValue');
  }
  if (lines.length > 0) lines.push({ label: 'Total nilai buku', amount: book });
  return { id: 'G', title: 'Aset tetap dan penyusutan', rows: lines };
}

module.exports = {
  CATEGORY_DEFS, categories, buildAsset, createAsset, summarizeAssets, reconcile, runDepreciation, fixedAssetNote,
};
