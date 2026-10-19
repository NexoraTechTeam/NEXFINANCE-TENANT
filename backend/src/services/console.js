'use strict';

const bcryptjs = require('bcryptjs');
const {
  provisionTenant, toTenant, normalizeHost, DOMAIN_RE, generateTemporaryPassword, tenantDomain,
} = require('./tenants');
const { normaliseLogo, paletteFromLogo, paletteFromColors, httpError } = require('./branding');

const platform = (knex, table) => knex.withSchema('platform').from(table);

/** Creates the first console operator from env if none exists (idempotent). */
async function ensureConsoleAdmin(knex, { email, name, password }) {
  if (!email || !password) return null;
  const [{ n }] = await platform(knex, 'platform_users').count({ n: '*' });
  if (Number(n) > 0) return null;
  const [row] = await knex.withSchema('platform').insert({
    email: email.toLowerCase(), name: name || email, password_hash: await bcryptjs.hash(password, 10),
  }).into('platform_users').returning(['id', 'email']);
  return row;
}

async function verifyConsoleUser(knex, email, password) {
  const user = await platform(knex, 'platform_users').whereRaw('lower(email) = lower(?)', [email || '']).first();
  if (!user || user.status !== 'active') return null;
  return (await bcryptjs.compare(password || '', user.password_hash)) ? user : null;
}

async function audit(knex, actor, action, tenantId, data = {}) {
  await knex.withSchema('platform').insert({ actor, action, tenant_id: tenantId || null, data }).into('platform_audit');
}

async function getTenant(knex, id) {
  const row = await platform(knex, 'tenants').where({ id }).first();
  if (!row) throw httpError(404, 'Tenant not found');
  const domains = await platform(knex, 'tenant_domains').where({ tenant_id: id })
    .orderBy([{ column: 'is_primary', order: 'desc' }, 'domain']).pluck('domain');
  return { ...toTenant(row), domains };
}

async function listTenants(knex) {
  const rows = await platform(knex, 'tenants').orderBy('created_at', 'asc');
  const domains = await platform(knex, 'tenant_domains').select('tenant_id', 'domain', 'is_primary');
  return Promise.all(rows.map(async (row) => {
    const [{ n }] = await knex.withSchema(row.schema_name).from('users').count({ n: '*' });
    return {
      ...toTenant(row),
      domains: domains.filter((d) => d.tenant_id === row.id)
        .sort((a, b) => Number(b.is_primary) - Number(a.is_primary)).map((d) => d.domain),
      userCount: Number(n),
    };
  }));
}

async function createTenant(knex, actor, input, { tenantBaseDomain } = {}) {
  const defaultDomain = tenantDomain(input.slug, tenantBaseDomain);
  const domains = [...new Set([defaultDomain, ...(input.domains || [])].filter(Boolean))];
  try {
    const result = await provisionTenant(knex, { ...input, domains });
    await audit(knex, actor, 'tenant.create', result.tenant.id, { slug: result.tenant.slug, domains: result.domains });
    return result;
  } catch (err) {
    throw err.status ? err : httpError(400, err.message);
  }
}

const TENANT_FIELDS = ['name', 'status', 'modules'];

async function updateTenant(knex, actor, id, body = {}) {
  const current = await getTenant(knex, id);
  const patch = Object.fromEntries(TENANT_FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
  if (patch.status && !['active', 'suspended'].includes(patch.status)) throw httpError(400, 'Invalid status');
  if (body.schoolInfo) patch.school_info = { ...current.schoolInfo, ...body.schoolInfo };

  if (body.branding) {
    const branding = { ...current.branding };
    if (body.branding.palette) branding.palette = paletteFromColors(body.branding.palette);
    if (body.branding.showPoweredBy !== undefined) branding.showPoweredBy = Boolean(body.branding.showPoweredBy);
    patch.branding = branding;
  }

  await platform(knex, 'tenants').where({ id }).update({ ...patch, updated_at: knex.fn.now() });
  await audit(knex, actor, 'tenant.update', id, { fields: Object.keys(patch) });
  return getTenant(knex, id);
}

async function setLogo(knex, actor, id, buffer, { keepPalette = false } = {}) {
  const current = await getTenant(knex, id);
  const png = await normaliseLogo(buffer);
  const branding = { ...current.branding, logoUpdatedAt: new Date().toISOString() };
  if (!keepPalette) branding.palette = await paletteFromLogo(png);

  await knex.withSchema('platform').insert({ tenant_id: id, kind: 'logo', content_type: 'image/png', data: png })
    .into('tenant_assets').onConflict(['tenant_id', 'kind']).merge();
  await platform(knex, 'tenants').where({ id }).update({ branding, updated_at: knex.fn.now() });
  await audit(knex, actor, 'tenant.logo', id, { bytes: png.length, palette: !keepPalette });
  return getTenant(knex, id);
}

async function addDomain(knex, actor, id, rawDomain) {
  await getTenant(knex, id);
  const domain = normalizeHost(rawDomain);
  if (!DOMAIN_RE.test(domain)) throw httpError(400, 'Invalid domain');
  const taken = await platform(knex, 'tenant_domains').where({ domain }).first();
  if (taken) throw httpError(409, 'Domain already in use');
  await knex.withSchema('platform').insert({ domain, tenant_id: id }).into('tenant_domains');
  await audit(knex, actor, 'tenant.domain_add', id, { domain });
  return getTenant(knex, id);
}

async function removeDomain(knex, actor, id, rawDomain) {
  const tenant = await getTenant(knex, id);
  const domain = normalizeHost(rawDomain);
  if (!tenant.domains.includes(domain)) throw httpError(404, 'Domain not found');
  if (tenant.domains.length === 1) throw httpError(400, 'A tenant needs at least one domain');
  await platform(knex, 'tenant_domains').where({ domain, tenant_id: id }).del();
  await audit(knex, actor, 'tenant.domain_remove', id, { domain });
  return getTenant(knex, id);
}

async function resetPassword(knex, actor, id, { username, email }) {
  if (!username && !email) throw httpError(400, 'username or email is required');
  const tenant = await getTenant(knex, id);
  const temporaryPassword = generateTemporaryPassword();
  const updated = await knex.withSchema(tenant.schemaName).from('users')
    // One identifier field in the Console: match it against both username and email.
    .where((q) => {
      for (const ident of [username, email].filter(Boolean)) q.orWhere({ username: ident }).orWhereRaw('lower(email) = lower(?)', [ident]);
    })
    .update({
      password_hash: await bcryptjs.hash(temporaryPassword, 10),
      must_change_password: true,
      status: 'active',
      updated_at: knex.fn.now(),
    });
  if (!updated) throw httpError(404, 'User not found');
  await audit(knex, actor, 'tenant.reset_password', id, { username, email });
  return { temporaryPassword };
}

async function listAudit(knex, { limit = 100 } = {}) {
  return platform(knex, 'platform_audit').orderBy('id', 'desc').limit(Math.min(limit, 500));
}

module.exports = {
  ensureConsoleAdmin, verifyConsoleUser, audit, getTenant, listTenants, createTenant,
  updateTenant, setLogo, addDomain, removeDomain, resetPassword, listAudit, paletteFromLogo,
  normaliseLogo, paletteFromColors,
};
