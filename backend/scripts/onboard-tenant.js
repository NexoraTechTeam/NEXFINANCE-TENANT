#!/usr/bin/env node
'use strict';

/**
 * Reproducible tenant onboarding (same service the Console UI uses).
 *
 *   DATABASE_URL=... TENANT_BASE_DOMAIN='{label}-nexfinance.nexoratech.co' \
 *   node scripts/onboard-tenant.js [--if-missing] [--no-password] ../docs/tenants/al-musabbihin/tenant.json
 *
 * The JSON may reference a logo file (relative to the JSON).
 * --if-missing   succeed without changes when the tenant already exists (safe to re-run in deploys)
 * --no-password  do not print the one-time admin password (CI logs); issue one from the Console instead
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const svc = require('../src/services/console');

function parseArgs(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  return {
    file: argv.find((a) => !a.startsWith('--')),
    ifMissing: flags.has('--if-missing'),
    showPassword: !flags.has('--no-password'),
  };
}

/** Re-runs (deploys) only add assets the spec has and the tenant still lacks — Console edits always win. */
async function syncMissingAssets(knex, id, spec, file) {
  const tenant = await svc.getTenant(knex, id);
  const added = [];
  const { loginImageUpdatedAt, loginImageRemoved } = tenant.branding;
  if (spec.loginImage && !loginImageUpdatedAt && !loginImageRemoved) {
    await svc.setLoginImage(knex, 'cli', id, fs.readFileSync(path.resolve(path.dirname(file), spec.loginImage)));
    added.push('loginImage');
  }
  // The school's own domains (e.g. almusabbihin.sch.id) stay registered; Traefik routes them once their DNS points here.
  for (const domain of spec.domains || []) {
    if (tenant.domains.includes(domain)) continue;
    await svc.addDomain(knex, 'cli', id, domain);
    added.push(`domain:${domain}`);
  }
  return added.length ? { status: 'updated', tenant: spec.slug, added } : { status: 'exists', tenant: spec.slug };
}

async function onboard(knex, file, { config, ifMissing = false, showPassword = true }) {
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  const existing = await knex.withSchema('platform').from('tenants').where({ slug: spec.slug }).first('id');
  if (existing) {
    if (ifMissing) return syncMissingAssets(knex, existing.id, spec, file);
    throw new Error(`Tenant "${spec.slug}" already exists — edit it from the Console instead.`);
  }

  const { logo, loginImage, ...input } = spec;
  const result = await svc.createTenant(knex, 'cli', input, config);
  if (logo) {
    await svc.setLogo(knex, 'cli', result.tenant.id, fs.readFileSync(path.resolve(path.dirname(file), logo)));
  }
  if (loginImage) {
    await svc.setLoginImage(knex, 'cli', result.tenant.id, fs.readFileSync(path.resolve(path.dirname(file), loginImage)));
  }
  const tenant = await svc.getTenant(knex, result.tenant.id);
  const admin = result.admin && (showPassword
    ? { username: result.admin.username, temporaryPassword: result.admin.temporaryPassword }
    : { username: result.admin.username });
  return {
    status: 'created',
    tenant: tenant.slug,
    domains: tenant.domains,
    palette: tenant.branding.palette && { primary: tenant.branding.palette.primary, secondary: tenant.branding.palette.secondary },
    admin,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    console.error('Usage: node scripts/onboard-tenant.js [--if-missing] [--no-password] <tenant.json>');
    process.exit(1);
  }
  const { createKnex } = require('../src/db/connection');
  const { migrateAll } = require('../src/db/migrate');
  const { loadConfig } = require('../src/config');
  const knex = createKnex();
  try {
    await migrateAll(knex);
    console.log(JSON.stringify(await onboard(knex, args.file, { ...args, config: loadConfig() }), null, 2));
  } finally {
    await knex.destroy();
  }
}

if (require.main === module) {
  main().catch((err) => { console.error(`❌ ${err.message}`); process.exit(1); });
}

module.exports = { onboard, parseArgs };
