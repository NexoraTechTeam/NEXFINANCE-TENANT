'use strict';

/** Shared input checks for write endpoints (amounts, ISO dates). Return a message or null. */
const toNumber = (v) => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN);

const positiveAmount = (v, label) => {
  const n = toNumber(v);
  return Number.isFinite(n) && n > 0 ? null : `${label} harus berupa angka lebih dari 0`;
};

const nonNegativeAmount = (v, label) => {
  if (v === undefined || v === null || v === '') return null;
  const n = toNumber(v);
  return Number.isFinite(n) && n >= 0 ? null : `${label} tidak boleh negatif`;
};

/** Calendar-valid YYYY-MM-DD. */
const isoDate = (v, label = 'Tanggal') => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${label} harus berformat YYYY-MM-DD`;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v ? null : `${label} tidak valid`;
};

/** First error of the given checks, or null. */
const firstError = (...errors) => errors.find(Boolean) || null;

module.exports = { positiveAmount, nonNegativeAmount, isoDate, firstError, toNumber };
