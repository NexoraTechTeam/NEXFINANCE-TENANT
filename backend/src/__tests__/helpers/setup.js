'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-do-not-use-in-production';
process.env.NODE_ENV = 'test';

const { createKnex } = require('../../db/connection');
const { migratePlatform } = require('../../db/migrate');
const { provisionTenant } = require('../../services/tenants');
const { createApp } = require('../../app');

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
  || 'postgres://postgres@127.0.0.1:55432/nexfin_saas_test';

const DEMO_HOST = 'demo.localhost';

async function resetDatabase(knex) {
  const { rows } = await knex.raw(`
    SELECT nspname FROM pg_namespace
    WHERE nspname = 'platform' OR nspname LIKE 't\\_%'
  `);
  for (const { nspname } of rows) {
    await knex.raw('DROP SCHEMA IF EXISTS ?? CASCADE', [nspname]);
  }
}

/** Fresh database with the platform schema and (optionally) a seeded demo tenant. */
async function bootstrap({ demo = true, appConfig = {} } = {}) {
  const knex = createKnex(TEST_DATABASE_URL);
  await resetDatabase(knex);
  await migratePlatform(knex);
  if (demo) {
    await provisionTenant(knex, {
      slug: 'demo',
      name: 'Demo School',
      domains: [DEMO_HOST],
      seedDemo: true,
    });
  }
  const app = createApp({ knex, config: { loginRateLimit: { max: 1000 }, tenantCacheTtlMs: 0, ...appConfig } });
  return { knex, app };
}

/**
 * Logs in with a temporary password, sets a permanent one (business APIs are blocked until then) and returns
 * a token for the activated session.
 */
async function activate(app, host, login, temporaryPassword, newPassword) {
  const request = require('supertest');
  const first = await request(app).post('/api/v1/auth/login').set('Host', host).send({ email: login, password: temporaryPassword });
  await request(app).post('/api/v1/auth/change-password').set('Host', host).set('Authorization', `Bearer ${first.body.token}`)
    .send({ currentPassword: temporaryPassword, newPassword, confirmPassword: newPassword });
  const res = await request(app).post('/api/v1/auth/login').set('Host', host).send({ email: login, password: newPassword });
  return res.body.token;
}

module.exports = { bootstrap, resetDatabase, activate, TEST_DATABASE_URL, DEMO_HOST };
