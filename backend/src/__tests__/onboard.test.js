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

  it('uses the {label} domain pattern of production (almusabbihin-nexfinance…)', async () => {
    await knex.raw('DROP SCHEMA t_al_musabbihin CASCADE');
    await knex.withSchema('platform').from('tenants').where({ slug: 'al-musabbihin' }).del();
    const result = await onboard(knex, SPEC_FILE, { config: { tenantBaseDomain: '{label}-nexfinance.test' }, showPassword: false });
    expect(result.domains).toEqual(['almusabbihin-nexfinance.test']);
  });

  it('adds a login image from the spec to an existing tenant that has none (idempotent deploys)', async () => {
    // Production state before this feature: the tenant exists without a login image.
    await knex.withSchema('platform').from('tenant_assets').where({ kind: 'login' }).del();
    await knex.raw("UPDATE platform.tenants SET branding = branding - 'loginImageUpdatedAt' - 'loginImageRemoved' WHERE slug = 'al-musabbihin'");
    const dir = path.dirname(SPEC_FILE);

    const first = await onboard(knex, path.join(dir, 'tenant.json'), { config, ifMissing: true });
    expect(first).toEqual({ status: 'updated', tenant: 'al-musabbihin', added: ['loginImage'] });
    const again = await onboard(knex, path.join(dir, 'tenant.json'), { config, ifMissing: true });
    expect(again).toEqual({ status: 'exists', tenant: 'al-musabbihin' });
    const row = await knex.withSchema('platform').from('tenant_assets').where({ kind: 'login' }).first('content_type');
    expect(row.content_type).toBe('image/jpeg');

    // An operator who removed the photo in the Console keeps it removed on the next deploy.
    const { id } = await knex.withSchema('platform').from('tenants').where({ slug: 'al-musabbihin' }).first('id');
    await require('../services/console').removeLoginImage(knex, 'ops', id);
    expect(await onboard(knex, path.join(dir, 'tenant.json'), { config, ifMissing: true }))
      .toEqual({ status: 'exists', tenant: 'al-musabbihin' });
  });
});
