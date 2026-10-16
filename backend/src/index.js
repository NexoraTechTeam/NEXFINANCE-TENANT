'use strict';

require('dotenv').config();

const { createKnex } = require('./db/connection');
const { migrateAll } = require('./db/migrate');
const { createApp } = require('./app');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

async function main() {
  const knex = createKnex();
  if (process.env.AUTO_MIGRATE !== 'false') await migrateAll(knex);
  const app = createApp({ knex });
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
