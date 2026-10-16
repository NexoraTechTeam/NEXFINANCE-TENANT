'use strict';

require('dotenv').config();

const { createKnex } = require('./db/connection');
const { migrateAll } = require('./db/migrate');
const { createApp } = require('./app');
const { loadConfig } = require('./config');
const { ensureConsoleAdmin } = require('./services/console');
const { provisionTenant } = require('./services/tenants');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

async function ensureDemoTenant(knex, hosts) {
  if (hosts.length === 0) return;
  const exists = await knex.withSchema('platform').from('tenants').where({ slug: 'demo' }).first('id');
  if (exists) return;
  await provisionTenant(knex, { slug: 'demo', name: 'NexFinance Demo School', domains: hosts, seedDemo: true });
  console.log(`ℹ️  Demo tenant provisioned for ${hosts.join(', ')}`);
}

async function main() {
  const config = loadConfig();
  const knex = createKnex();
  if (process.env.AUTO_MIGRATE !== 'false') await migrateAll(knex);
  if (await ensureConsoleAdmin(knex, config.consoleAdmin)) console.log('ℹ️  Console admin created');
  await ensureDemoTenant(knex, config.demoTenantHosts);

  const app = createApp({ knex, config });
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`✅ NexFinance SaaS API running on port ${port}`));
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main };
