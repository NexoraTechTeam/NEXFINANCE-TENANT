'use strict';

const knexFactory = require('knex');

/** Creates the shared Postgres pool. Tenant isolation is done per query via `.withSchema()`. */
function createKnex(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  return knexFactory({
    client: 'pg',
    connection: connectionString,
    pool: { min: 0, max: Number(process.env.DB_POOL_MAX) || 10 },
  });
}

module.exports = { createKnex };
