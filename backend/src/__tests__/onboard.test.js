'use strict';

const path = require('path');
const { bootstrap } = require('./helpers/setup');
const { onboard, parseArgs } = require('../../scripts/onboard-tenant');

const SPEC_FILE = path.join(__dirname, '..', '..', '..', 'docs', 'tenants', 'al-musabbihin', 'tenant.json');
const config = { tenantBaseDomain: 'nexfinance.test' };

let knex;

beforeAll(async () => {
  ({ knex } = await bootstrap({ demo: false }));
});

afterAll(async () => {
  await knex.destroy();
});

describe('scripted tenant onboarding', () => {
  it('parses flags and the spec path', () => {
    expect(parseArgs(['a.json'])).toEqual({ file: 'a.json', ifMissing: false, showPassword: true });
    expect(parseArgs(['--if-missing', '--no-password', 'a.json'])).toEqual({ file: 'a.json', ifMissing: true, showPassword: false });
  });

  it('creates Al-Musabbihin from its spec with a logo-derived palette and super_admin', async () => {
    const result = await onboard(knex, SPEC_FILE, { config });
    expect(result.status).toBe('created');
    expect(result.domains).toEqual(['al-musabbihin.nexfinance.test']);
    expect(result.palette.primary).toMatch(/^#[0-9a-f]{6}$/);
    expect(result.admin).toMatchObject({ username: 'admin-almusabbihin' });
    expect(result.admin.temporaryPassword.length).toBeGreaterThanOrEqual(12);

    const user = await knex.withSchema('t_al_musabbihin').from('users').where({ username: 'admin-almusabbihin' }).first();
    expect(user.role).toBe('super_admin');
  });

  it('is idempotent with --if-missing and refuses duplicates otherwise', async () => {
    await expect(onboard(knex, SPEC_FILE, { config })).rejects.toThrow(/already exists/);
    const again = await onboard(knex, SPEC_FILE, { config, ifMissing: true });
    expect(again).toEqual({ status: 'exists', tenant: 'al-musabbihin' });
  });

  it('can withhold the temporary password (CI logs)', async () => {
    await knex.raw('DROP SCHEMA t_al_musabbihin CASCADE');
    await knex.withSchema('platform').from('tenants').where({ slug: 'al-musabbihin' }).del();
    const result = await onboard(knex, SPEC_FILE, { config, showPassword: false });
    expect(result.status).toBe('created');
    expect(result.admin).toEqual({ username: 'admin-almusabbihin' });
    expect(JSON.stringify(result)).not.toMatch(/temporaryPassword/);
  });
});
