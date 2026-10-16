'use strict';

/**
 * Tenant-scoped document store backed by `<schema>.records`.
 *
 * Routes used to mutate in-memory arrays; the store keeps the same record shapes
 * (so API contracts are unchanged) and the same ordering semantics:
 * collections that used `unshift` list newest-first, those that used `push` list oldest-first.
 */
const NEWEST_FIRST = new Set([
  'spp_invoices', 'expenses', 'purchase_requests', 'purchase_orders', 'activity_logs',
]);

const ID_FORMATS = {
  students: { prefix: 'STU', pad: 3 },
  employees: { prefix: 'EMP', pad: 3 },
  users: { prefix: 'USR', pad: 3 },
  spp_invoices: { prefix: 'INV', pad: 6 },
  payroll_runs: { prefix: 'PAY', pad: 6 },
  expenses: { prefix: 'EXP', pad: 6 },
  purchase_requests: { prefix: 'PR', pad: 6 },
  purchase_orders: { prefix: 'PO', pad: 6 },
  journals: { prefix: 'JRN', pad: 6 },
  activity_logs: { prefix: 'LOG', pad: 10 },
};

function createStore(db, schema) {
  const records = () => db.withSchema(schema).from('records');

  async function nextId(collection) {
    const { prefix, pad } = ID_FORMATS[collection] || { prefix: collection.toUpperCase().slice(0, 3), pad: 6 };
    const { rows } = await db.raw(
      `INSERT INTO ??.id_counters (prefix, value) VALUES (?, 1)
       ON CONFLICT (prefix) DO UPDATE SET value = ??.id_counters.value + 1
       RETURNING value`,
      [schema, prefix, schema],
    );
    return `${prefix}${String(rows[0].value).padStart(pad, '0')}`;
  }

  /** Bump a counter so generated ids never collide with imported/seeded ones. */
  async function reserveIds(collection, minimum) {
    const { prefix } = ID_FORMATS[collection];
    await db.raw(
      `INSERT INTO ??.id_counters (prefix, value) VALUES (?, ?)
       ON CONFLICT (prefix) DO UPDATE SET value = GREATEST(??.id_counters.value, EXCLUDED.value)`,
      [schema, prefix, minimum, schema],
    );
  }

  async function list(collection, { where } = {}) {
    let q = records().where({ collection }).select('data');
    if (where) q = q.whereRaw('data @> ?::jsonb', [JSON.stringify(where)]);
    q = q.orderBy('seq', NEWEST_FIRST.has(collection) ? 'desc' : 'asc');
    return (await q).map((row) => row.data);
  }

  async function get(collection, id) {
    const row = await records().where({ collection, id }).first('data');
    return row ? row.data : null;
  }

  async function insert(collection, data) {
    const record = { ...data, id: data.id || await nextId(collection) };
    await db.withSchema(schema).insert({ collection, id: record.id, data: record }).into('records');
    return record;
  }

  /** Atomically read-modify-write a record. `mutator` returns the next record (or undefined to keep). */
  async function update(collection, id, mutator) {
    const run = async (trx) => {
      const row = await trx.withSchema(schema).from('records').where({ collection, id }).forUpdate().first('data');
      if (!row) return null;
      const next = typeof mutator === 'function' ? (mutator(row.data) || row.data) : { ...row.data, ...mutator };
      next.id = id;
      await trx.withSchema(schema).from('records').where({ collection, id })
        .update({ data: next, updated_at: db.fn.now() });
      return next;
    };
    return db.isTransaction ? run(db) : db.transaction(run);
  }

  async function count(collection) {
    const [{ n }] = await records().where({ collection }).count({ n: '*' });
    return Number(n);
  }

  async function removeWhere(collection, idsToKeep) {
    return records().where({ collection }).whereNotIn('id', idsToKeep).del();
  }

  return {
    schema, db, nextId, reserveIds, list, get, insert, update, count, removeWhere,
    withTransaction: (fn) => db.transaction((trx) => fn(createStore(trx, schema))),
  };
}

module.exports = { createStore, ID_FORMATS };
