'use strict';

const crypto = require('crypto');
const bcryptjs = require('bcryptjs');
const { migrateTenantSchema } = require('../db/migrate');
const { createStore } = require('../db/store');
const { VALID_ROLES, DEFAULT_PERMISSIONS, DEFAULT_CHART_OF_ACCOUNTS } = require('../db/defaults');
const { postOpeningBalance } = require('./posting');

/** Opening position for the sales demo tenant (mirrors the old NexFinance demo figures). */
const DEMO_OPENING_BALANCE = [
  { account: '1000', amount: 75_000_000 },
  { account: '1100', amount: 450_000_000 },
  { account: '1200', amount: 28_500_000 },
  { account: '1300', amount: 96_500_000 },
  { account: '2000', amount: 55_000_000 },
  { account: '2100', amount: 30_000_000 },
  { account: '3100', amount: 145_000_000 },
];

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
const DOMAIN_RE = /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const BCRYPT_ROUNDS = 10;

const schemaNameFor = (slug) => `t_${slug.replace(/-/g, '_')}`;
const normalizeHost = (host = '') => String(host).trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');

const generateTemporaryPassword = () => crypto.randomBytes(12).toString('base64url').slice(0, 14);

const toTenant = (row) => row && ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  schemaName: row.schema_name,
  status: row.status,
  schoolInfo: row.school_info,
  branding: row.branding,
  modules: row.modules,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

async function seedDefaults(store, { name }) {
  for (const [role, permissions] of Object.entries(DEFAULT_PERMISSIONS)) {
    await store.db.withSchema(store.schema).insert({ role, permissions }).into('role_permissions');
  }
  for (const [code, account] of Object.entries(DEFAULT_CHART_OF_ACCOUNTS)) {
    await store.insert('chart_of_accounts', { id: code, ...account });
  }
  await store.db.withSchema(store.schema).insert({ key: 'organization', value: { name } }).into('settings');
}

async function insertUser(store, { username, email, name, role, password, mustChangePassword = false, id }) {
  if (!VALID_ROLES.includes(role)) throw new Error(`Invalid role: ${role}`);
  if (!password || password.length < 8) throw new Error('Password must be at least 8 characters');
  const user = {
    id: id || await store.nextId('users'),
    username: username || null,
    email: email || null,
    name,
    role,
    status: 'active',
    password_hash: await bcryptjs.hash(password, BCRYPT_ROUNDS),
    must_change_password: mustChangePassword,
  };
  await store.db.withSchema(store.schema).insert(user).into('users');
  return user;
}

async function seedDemoData(store) {
  const demo = require('../db/demo-data');
  const collections = {
    spp_invoices: demo.sppInvoices,
    employees: demo.employees,
    payroll_runs: demo.payrollRuns,
    expenses: demo.expenses,
    purchase_requests: demo.purchaseRequests,
    purchase_orders: demo.purchaseOrders,
    journals: demo.journals,
    students: demo.students,
    activity_logs: demo.activityLogs,
  };
  const newestFirst = ['spp_invoices', 'expenses', 'purchase_requests', 'purchase_orders', 'activity_logs'];
  for (const [collection, rows] of Object.entries(collections)) {
    const ordered = newestFirst.includes(collection) ? [...rows].reverse() : rows;
    for (const row of ordered) await store.insert(collection, row);
  }
  await store.reserveIds('students', demo.students.length);
  await store.reserveIds('employees', demo.employees.length);
  for (const u of demo.users) {
    await insertUser(store, { id: u.id, email: u.email, name: u.name, role: u.role, password: u.password });
  }
  await store.reserveIds('users', demo.users.length);
  await postOpeningBalance(store, { date: '2026-01-01', entries: DEMO_OPENING_BALANCE });
}

/**
 * Creates a tenant atomically: registry row + domains + schema + defaults + admin.
 * Any failure rolls back everything, including the schema (Postgres DDL is transactional).
 */
async function provisionTenant(knex, {
  slug, name, domains = [], schoolInfo = {}, branding = {}, modules = [], admin, seedDemo = false,
}) {
  if (!SLUG_RE.test(slug || '')) throw new Error('Invalid slug: use lowercase letters, numbers and dashes');
  if (!name) throw new Error('Tenant name is required');
  const hosts = [...new Set(domains.map(normalizeHost))];
  if (hosts.length === 0) throw new Error('At least one domain is required');
  for (const host of hosts) if (!DOMAIN_RE.test(host)) throw new Error(`Invalid domain: ${host}`);

  const schemaName = schemaNameFor(slug);

  return knex.transaction(async (trx) => {
    const existing = await trx.withSchema('platform').from('tenants').where({ slug }).first('id');
    if (existing) throw new Error(`Tenant "${slug}" already exists`);
    const taken = await trx.withSchema('platform').from('tenant_domains').whereIn('domain', hosts).first('domain');
    if (taken) throw new Error(`Domain already in use: ${taken.domain}`);

    const [row] = await trx.withSchema('platform').insert({
      slug, name, schema_name: schemaName, school_info: schoolInfo, branding, modules,
    }).into('tenants').returning('*');
    await trx.withSchema('platform').insert(hosts.map((domain, i) => ({
      domain, tenant_id: row.id, is_primary: i === 0,
    }))).into('tenant_domains');

    await migrateTenantSchema(trx, schemaName);
    const store = createStore(trx, schemaName);
    await seedDefaults(store, { name });
    if (seedDemo) await seedDemoData(store);

    let adminResult = null;
    if (admin) {
      const temporaryPassword = admin.password || generateTemporaryPassword();
      const user = await insertUser(store, {
        username: admin.username,
        email: admin.email,
        name: admin.name || admin.username,
        role: admin.role || 'super_admin',
        password: temporaryPassword,
        mustChangePassword: true,
      });
      adminResult = { id: user.id, username: user.username, email: user.email, temporaryPassword };
    }

    return { tenant: toTenant(row), domains: hosts, admin: adminResult };
  });
}

async function findTenantByHost(knex, host) {
  const row = await knex.from('platform.tenant_domains as d')
    .join('platform.tenants as t', 't.id', 'd.tenant_id')
    .where('d.domain', normalizeHost(host))
    .first('t.*');
  return row ? toTenant(row) : null;
}

async function setTenantStatus(knex, tenantId, status) {
  await knex.withSchema('platform').from('tenants').where({ id: tenantId })
    .update({ status, updated_at: knex.fn.now() });
}

module.exports = {
  provisionTenant, findTenantByHost, setTenantStatus, insertUser, normalizeHost,
  schemaNameFor, generateTemporaryPassword, toTenant, SLUG_RE, DOMAIN_RE,
};
