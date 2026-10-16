#!/usr/bin/env node
'use strict';

/**
 * Reproducible tenant onboarding (same service the Console UI uses).
 *
 *   DATABASE_URL=... TENANT_BASE_DOMAIN=nexfinance.nexoratech.co \
 *   node scripts/onboard-tenant.js ../docs/tenants/al-musabbihin/tenant.json
 *
 * The JSON may reference a logo file (relative to the JSON). Prints the one-time admin password.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createKnex } = require('../src/db/connection');
const { migrateAll } = require('../src/db/migrate');
const { loadConfig } = require('../src/config');
const svc = require('../src/services/console');

async function run(file) {
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  const config = loadConfig();
  const knex = createKnex();
  try {
    await migrateAll(knex);
    const existing = await knex.withSchema('platform').from('tenants').where({ slug: spec.slug }).first('id');
    if (existing) throw new Error(`Tenant "${spec.slug}" already exists — edit it from the Console instead.`);

    const { logo, ...input } = spec;
    const result = await svc.createTenant(knex, 'cli', input, config);
    if (logo) {
      await svc.setLogo(knex, 'cli', result.tenant.id, fs.readFileSync(path.resolve(path.dirname(file), logo)));
    }
    const tenant = await svc.getTenant(knex, result.tenant.id);
    console.log(JSON.stringify({
      tenant: tenant.slug,
      domains: tenant.domains,
      palette: tenant.branding.palette && { primary: tenant.branding.palette.primary, secondary: tenant.branding.palette.secondary },
      admin: result.admin && { username: result.admin.username, temporaryPassword: result.admin.temporaryPassword },
    }, null, 2));
  } finally {
    await knex.destroy();
  }
}

if (!process.argv[2]) {
  console.error('Usage: node scripts/onboard-tenant.js <tenant.json>');
  process.exit(1);
}
run(process.argv[2]).catch((err) => { console.error(`❌ ${err.message}`); process.exit(1); });
