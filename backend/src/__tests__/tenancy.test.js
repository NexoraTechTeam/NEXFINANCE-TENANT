'use strict';

const request = require('supertest');
const bcryptjs = require('bcryptjs');
const { bootstrap, activate } = require('./helpers/setup');
const { provisionTenant, setTenantStatus, findTenantByHost } = require('../services/tenants');
const { migrateAll } = require('../db/migrate');
const { createApp } = require('../app');

const A_HOST = 'al-musabbihin.nexfinance.test';
const B_HOST = 'sekolah-b.nexfinance.test';

let app;
let knex;
let tenantA;
let tenantB;

beforeAll(async () => {
  ({ app, knex } = await bootstrap({ demo: false }));
  tenantA = await provisionTenant(knex, {
    slug: 'al-musabbihin',
    name: 'Sekolah Islam Terpadu Al Musabbihin',
    domains: [A_HOST],
    admin: { username: 'admin-almusabbihin', name: 'Admin Al Musabbihin', password: 'Temp-Pass-123' },
  });
  tenantB = await provisionTenant(knex, {
    slug: 'sekolah-b',
    name: 'Sekolah B',
    domains: [B_HOST],
    admin: { username: 'admin-b', name: 'Admin B', password: 'Temp-Pass-456' },
  });
});

afterAll(async () => {
  await knex.destroy();
});

const on = (host) => new Proxy({}, {
  get: (_, method) => (path) => request(app)[method](path).set('Host', host),
});

const login = async (host, identifier, password) => {
  const res = await on(host).post('/api/v1/auth/login').send({ email: identifier, password });
  return res;
};

describe('tenant provisioning', () => {
  it('creates an isolated schema with default COA, roles and admin user', async () => {
    expect(tenantA.tenant.schemaName).toBe('t_al_musabbihin');
    const { rows } = await knex.raw("SELECT 1 FROM pg_namespace WHERE nspname = 't_al_musabbihin'");
    expect(rows).toHaveLength(1);

    const coa = await knex.withSchema('t_al_musabbihin').from('records').where({ collection: 'chart_of_accounts' });
    expect(coa.length).toBe(21);
    const roles = await knex.withSchema('t_al_musabbihin').from('role_permissions');
    expect(roles.map((r) => r.role).sort()).toEqual(['admin', 'auditor', 'bendahara', 'kabag', 'staff', 'super_admin']);

    const [admin] = await knex.withSchema('t_al_musabbihin').from('users').where({ username: 'admin-almusabbihin' });
    expect(admin.role).toBe('super_admin');
    expect(admin.must_change_password).toBe(true);
    expect(admin.password_hash).not.toBe('Temp-Pass-123');
    expect(await bcryptjs.compare('Temp-Pass-123', admin.password_hash)).toBe(true);
  });

  it('starts with clean operational data (no demo records)', async () => {
    const counts = await knex.withSchema('t_al_musabbihin').from('records')
      .whereNot({ collection: 'chart_of_accounts' }).count({ n: '*' });
    expect(Number(counts[0].n)).toBe(0);
  });

  it('generates a temporary password when none is supplied', async () => {
    const result = await provisionTenant(knex, {
      slug: 'sekolah-c',
      name: 'Sekolah C',
      domains: ['sekolah-c.nexfinance.test'],
      admin: { username: 'admin-c', name: 'Admin C' },
    });
    expect(result.admin.temporaryPassword).toMatch(/^.{12,}$/);
  });

  it('rejects invalid or duplicate slugs and duplicate domains', async () => {
    await expect(provisionTenant(knex, { slug: 'Bad Slug!', name: 'X', domains: ['x.test'] }))
      .rejects.toThrow(/slug/i);
    await expect(provisionTenant(knex, { slug: 'al-musabbihin', name: 'Dup', domains: ['dup.test'] }))
      .rejects.toThrow(/exists/i);
    await expect(provisionTenant(knex, { slug: 'other', name: 'Dup domain', domains: [A_HOST] }))
      .rejects.toThrow(/domain/i);
  });

  it('rolls back the schema when provisioning fails midway', async () => {
    await expect(provisionTenant(knex, {
      slug: 'broken',
      name: 'Broken',
      domains: ['broken.test'],
      admin: { username: 'x', name: 'X', password: 'short', role: 'not-a-role' },
    })).rejects.toThrow();
    const { rows } = await knex.raw("SELECT 1 FROM pg_namespace WHERE nspname = 't_broken'");
    expect(rows).toHaveLength(0);
    expect(await findTenantByHost(knex, 'broken.test')).toBeNull();
  });

  it('migrations are idempotent across all tenants', async () => {
    await expect(migrateAll(knex)).resolves.not.toThrow();
    await expect(migrateAll(knex)).resolves.not.toThrow();
  });
});

describe('tenant resolution by host', () => {
  it('returns 404 for unknown hosts', async () => {
    const res = await on('unknown.example.com').post('/api/v1/auth/login').send({ email: 'a', password: 'b' });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/tenant/i);
  });

  it('resolves via x-forwarded-host from the frontend proxy', async () => {
    const res = await request(app).post('/api/v1/auth/login')
      .set('Host', 'nexfin-saas-backend:5000')
      .set('X-Forwarded-Host', A_HOST)
      .send({ email: 'admin-almusabbihin', password: 'Temp-Pass-123' });
    expect(res.statusCode).toBe(200);
  });

  it('keeps /health tenant-agnostic', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });

  it('blocks suspended tenants with 403', async () => {
    await setTenantStatus(knex, tenantB.tenant.id, 'suspended');
    const res = await login(B_HOST, 'admin-b', 'Temp-Pass-456');
    expect(res.statusCode).toBe(403);
    await setTenantStatus(knex, tenantB.tenant.id, 'active');
  });
});

describe('tenant login and isolation', () => {
  it('logs in with a username and flags the forced password change', async () => {
    const res = await login(A_HOST, 'admin-almusabbihin', 'Temp-Pass-123');
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toMatchObject({ username: 'admin-almusabbihin', role: 'super_admin', mustChangePassword: true });
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('does not accept tenant A credentials on tenant B', async () => {
    const res = await login(B_HOST, 'admin-almusabbihin', 'Temp-Pass-123');
    expect(res.statusCode).toBe(401);
  });

  it('rejects a tenant A token on tenant B', async () => {
    const { body } = await login(A_HOST, 'admin-almusabbihin', 'Temp-Pass-123');
    const res = await on(B_HOST).get('/api/v1/master/students').set('Authorization', `Bearer ${body.token}`);
    expect(res.statusCode).toBe(401);
  });

  it('clears the forced-change flag after the password is changed', async () => {
    const a = await login(A_HOST, 'admin-almusabbihin', 'Temp-Pass-123');
    const changed = await on(A_HOST).post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${a.body.token}`)
      .send({ currentPassword: 'Temp-Pass-123', newPassword: 'NewSecure-789', confirmPassword: 'NewSecure-789' });
    expect(changed.statusCode).toBe(200);
    const again = await login(A_HOST, 'admin-almusabbihin', 'NewSecure-789');
    expect(again.body.user.mustChangePassword).toBe(false);
  });

  it('keeps data separated between tenants and persists it across app restarts', async () => {
    const a = await login(A_HOST, 'admin-almusabbihin', 'NewSecure-789'); // activated in the previous test
    const created = await on(A_HOST).post('/api/v1/master/students')
      .set('Authorization', `Bearer ${a.body.token}`)
      .send({ nis: '2026-001', name: 'Siswa Pertama', class: '7A' });
    expect(created.statusCode).toBe(201);

    const bToken = await activate(app, B_HOST, 'admin-b', 'Temp-Pass-456', 'NewSecure-456');
    const listB = await on(B_HOST).get('/api/v1/master/students').set('Authorization', `Bearer ${bToken}`);
    expect(listB.body.total).toBe(0);

    const restarted = createApp({ knex, config: { loginRateLimit: { max: 1000 }, tenantCacheTtlMs: 0 } });
    const listA = await request(restarted).get('/api/v1/master/students')
      .set('Host', A_HOST).set('Authorization', `Bearer ${a.body.token}`);
    expect(listA.body.total).toBe(1);
    expect(listA.body.data[0]).toMatchObject({ nis: '2026-001', name: 'Siswa Pertama', class: '7A', status: 'active' });
  });
});
