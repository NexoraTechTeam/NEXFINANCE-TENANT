'use strict';

/**
 * Minimal, explicit migrator.
 * - `platform` schema: tenants registry, domains, console users, audit.
 * - `t_<slug>` schemas: one per tenant, created from TENANT_MIGRATIONS.
 * Every migration is idempotent and recorded in `<schema>.schema_migrations`.
 */

const PLATFORM_MIGRATIONS = [
  {
    id: '001_platform_core',
    up: async (trx) => {
      await trx.raw(`
        CREATE TABLE IF NOT EXISTS platform.tenants (
          id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          slug          text NOT NULL UNIQUE,
          name          text NOT NULL,
          schema_name   text NOT NULL UNIQUE,
          status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
          school_info   jsonb NOT NULL DEFAULT '{}'::jsonb,
          branding      jsonb NOT NULL DEFAULT '{}'::jsonb,
          modules       text[] NOT NULL DEFAULT ARRAY[]::text[],
          created_at    timestamptz NOT NULL DEFAULT now(),
          updated_at    timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS platform.tenant_domains (
          domain      text PRIMARY KEY,
          tenant_id   uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
          is_primary  boolean NOT NULL DEFAULT false,
          created_at  timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS platform.platform_users (
          id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          email          text NOT NULL UNIQUE,
          name           text NOT NULL,
          password_hash  text NOT NULL,
          status         text NOT NULL DEFAULT 'active',
          created_at     timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS platform.platform_audit (
          id          bigserial PRIMARY KEY,
          actor       text NOT NULL,
          action      text NOT NULL,
          tenant_id   uuid,
          data        jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at  timestamptz NOT NULL DEFAULT now()
        );
      `);
    },
  },
  {
    id: '002_tenant_assets',
    up: async (trx) => {
      await trx.raw(`
        CREATE TABLE IF NOT EXISTS platform.tenant_assets (
          tenant_id     uuid NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
          kind          text NOT NULL,
          content_type  text NOT NULL,
          data          bytea NOT NULL,
          updated_at    timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (tenant_id, kind)
        );
      `);
    },
  },
];

const TENANT_MIGRATIONS = [
  {
    id: '001_tenant_core',
    up: async (trx, schema) => {
      const s = (name) => trx.raw('??.??', [schema, name]).toQuery();
      await trx.raw(`
        CREATE TABLE IF NOT EXISTS ${s('users')} (
          id                    text PRIMARY KEY,
          username              text UNIQUE,
          email                 text UNIQUE,
          name                  text NOT NULL,
          role                  text NOT NULL CHECK (role IN ('super_admin','admin','bendahara','kabag','staff','auditor')),
          status                text NOT NULL DEFAULT 'active',
          password_hash         text NOT NULL,
          must_change_password  boolean NOT NULL DEFAULT false,
          created_at            timestamptz NOT NULL DEFAULT now(),
          updated_at            timestamptz NOT NULL DEFAULT now(),
          CHECK (username IS NOT NULL OR email IS NOT NULL)
        );
        CREATE TABLE IF NOT EXISTS ${s('role_permissions')} (
          role         text PRIMARY KEY,
          permissions  text[] NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ${s('settings')} (
          key    text PRIMARY KEY,
          value  jsonb NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ${s('records')} (
          collection  text NOT NULL,
          id          text NOT NULL,
          seq         bigserial,
          data        jsonb NOT NULL,
          created_at  timestamptz NOT NULL DEFAULT now(),
          updated_at  timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (collection, id)
        );
        CREATE INDEX IF NOT EXISTS records_collection_seq_idx ON ${s('records')} (collection, seq);
        CREATE TABLE IF NOT EXISTS ${s('id_counters')} (
          prefix  text PRIMARY KEY,
          value   bigint NOT NULL
        );
      `);
    },
  },
];

async function runMigrations(knex, schema, migrations, extraArg) {
  await knex.raw('CREATE SCHEMA IF NOT EXISTS ??', [schema]);
  await knex.raw(`CREATE TABLE IF NOT EXISTS ??.schema_migrations (
    id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()
  )`, [schema]);
  for (const migration of migrations) {
    await knex.transaction(async (trx) => {
      // Serialise concurrent migrators (e.g. two containers booting) per schema.
      await trx.raw('SELECT pg_advisory_xact_lock(hashtext(?))', [`migrate:${schema}`]);
      const done = await trx.withSchema(schema).from('schema_migrations').where({ id: migration.id }).first();
      if (done) return;
      await migration.up(trx, extraArg ?? schema);
      await trx.withSchema(schema).insert({ id: migration.id }).into('schema_migrations');
    });
  }
}

const migratePlatform = (knex) => runMigrations(knex, 'platform', PLATFORM_MIGRATIONS);
const migrateTenantSchema = (knex, schema) => runMigrations(knex, schema, TENANT_MIGRATIONS, schema);

async function migrateAll(knex) {
  await migratePlatform(knex);
  const tenants = await knex.withSchema('platform').from('tenants').select('schema_name');
  for (const { schema_name: schema } of tenants) {
    await migrateTenantSchema(knex, schema);
  }
}

module.exports = { migratePlatform, migrateTenantSchema, migrateAll, TENANT_MIGRATIONS };

if (require.main === module) {
  require('dotenv').config();
  const { createKnex } = require('./connection');
  const knex = createKnex();
  migrateAll(knex)
    .then(() => { console.log('✅ Migrations applied'); return knex.destroy(); })
    .catch((err) => { console.error(err); process.exit(1); });
}
