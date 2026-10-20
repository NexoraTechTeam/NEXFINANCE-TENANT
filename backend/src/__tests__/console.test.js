'use strict';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { bootstrap } = require('./helpers/setup');
const { ensureConsoleAdmin } = require('../services/console');
const { hexToHsl } = require('../services/palette');

const CONSOLE = 'console.nexfinance.test';
const LOGO = fs.readFileSync(path.join(__dirname, 'fixtures', 'al-musabbihin-logo.png'));

let app;
let knex;
let token;

beforeAll(async () => {
  ({ app, knex } = await bootstrap({
    demo: false,
    appConfig: { consoleHosts: [CONSOLE], tenantBaseDomain: 'nexfinance.test' },
  }));
  await ensureConsoleAdmin(knex, { email: 'ops@nexoratech.co', name: 'Nexora Ops', password: 'Console-Pass-123' });
  const res = await request(app).post('/api/v1/console/auth/login').set('Host', CONSOLE)
    .send({ email: 'ops@nexoratech.co', password: 'Console-Pass-123' });
  token = res.body.token;
});

afterAll(async () => {
  await knex.destroy();
});

const consoleApi = new Proxy({}, {
  get: (_, method) => (p) => request(app)[method](p).set('Host', CONSOLE).set('Authorization', `Bearer ${token}`),
});
const tenantApi = (host) => new Proxy({}, {
  get: (_, method) => (p) => request(app)[method](p).set('Host', host),
});

describe('console access', () => {
  it('is only reachable on console hosts', async () => {
    const res = await request(app).post('/api/v1/console/auth/login').set('Host', 'al-musabbihin.nexfinance.test')
      .send({ email: 'ops@nexoratech.co', password: 'Console-Pass-123' });
    expect(res.statusCode).toBe(404);
  });

  it('requires a console token', async () => {
    const res = await request(app).get('/api/v1/console/tenants').set('Host', CONSOLE);
    expect(res.statusCode).toBe(401);
  });

  it('does not create a second bootstrap admin', async () => {
    await ensureConsoleAdmin(knex, { email: 'other@nexoratech.co', name: 'Other', password: 'Another-Pass-123' });
    const { rows } = await knex.raw('SELECT count(*)::int AS n FROM platform.platform_users');
    expect(rows[0].n).toBe(1);
  });
});

describe('tenant lifecycle from the console', () => {
  let tenantId;
  let tempPassword;

  it('previews a palette from an uploaded logo', async () => {
    const res = await consoleApi.post('/api/v1/console/palette/preview')
      .set('Content-Type', 'image/png').send(LOGO);
    expect(res.statusCode).toBe(200);
    expect(hexToHsl(res.body.palette.primary).h).toBeGreaterThan(190);
  });

  it('creates a tenant with a default subdomain and a one-time admin password', async () => {
    const res = await consoleApi.post('/api/v1/console/tenants').send({
      slug: 'al-musabbihin',
      name: 'Sekolah Islam Terpadu Al Musabbihin',
      schoolInfo: { shortName: 'SIT Al Musabbihin', city: 'Bandung' },
      admin: { username: 'admin-almusabbihin', name: 'Admin Al Musabbihin', role: 'super_admin' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.domains).toEqual(['al-musabbihin.nexfinance.test']);
    expect(res.body.admin.username).toBe('admin-almusabbihin');
    expect(res.body.admin.temporaryPassword.length).toBeGreaterThanOrEqual(12);
    tenantId = res.body.tenant.id;
    tempPassword = res.body.admin.temporaryPassword;

    const login = await tenantApi('al-musabbihin.nexfinance.test').post('/api/v1/auth/login')
      .send({ email: 'admin-almusabbihin', password: tempPassword });
    expect(login.statusCode).toBe(200);
    expect(login.body.user.mustChangePassword).toBe(true);
  });

  it('uploads the logo and derives the tenant palette from it', async () => {
    const res = await consoleApi.put(`/api/v1/console/tenants/${tenantId}/logo`)
      .set('Content-Type', 'image/png').send(LOGO);
    expect(res.statusCode).toBe(200);
    expect(res.body.tenant.branding.palette.source).toBe('logo');

    const config = await tenantApi('al-musabbihin.nexfinance.test').get('/api/v1/tenant/config');
    expect(config.statusCode).toBe(200);
    expect(config.body).toMatchObject({
      slug: 'al-musabbihin',
      name: 'Sekolah Islam Terpadu Al Musabbihin',
      shortName: 'SIT Al Musabbihin',
      showPoweredBy: true,
    });
    expect(config.body.logoUrl).toMatch(/^\/api\/v1\/tenant\/logo\?v=/);
    expect(hexToHsl(config.body.palette.primary).h).toBeGreaterThan(190);

    const logo = await tenantApi('al-musabbihin.nexfinance.test').get('/api/v1/tenant/logo');
    expect(logo.statusCode).toBe(200);
    expect(logo.headers['content-type']).toMatch(/image\/png/);
    expect(logo.headers['cache-control']).toMatch(/max-age/);
  });

  it('rejects oversized or non-image logos', async () => {
    const bad = await consoleApi.put(`/api/v1/console/tenants/${tenantId}/logo`)
      .set('Content-Type', 'image/png').send(Buffer.from('nope'));
    expect(bad.statusCode).toBe(400);
  });

  it('uploads a login page image, serves it publicly and can remove it', async () => {
    const up = await consoleApi.put(`/api/v1/console/tenants/${tenantId}/login-image`)
      .set('Content-Type', 'image/png').send(LOGO);
    expect(up.statusCode).toBe(200);
    expect(up.body.tenant.branding.loginImageUpdatedAt).toBeTruthy();
    expect(up.body.tenant.branding.palette.source).toBe('logo');

    const config = await tenantApi('al-musabbihin.nexfinance.test').get('/api/v1/tenant/config');
    expect(config.body.loginImageUrl).toMatch(/^\/api\/v1\/tenant\/login-image\?v=/);
    const img = await tenantApi('al-musabbihin.nexfinance.test').get('/api/v1/tenant/login-image');
    expect(img.statusCode).toBe(200);
    expect(img.headers['content-type']).toMatch(/image\/jpeg/);

    const bad = await consoleApi.put(`/api/v1/console/tenants/${tenantId}/login-image`)
      .set('Content-Type', 'image/jpeg').send(Buffer.from('nope'));
    expect(bad.statusCode).toBe(400);

    // Console previews load assets from the console host itself (works before a school domain has DNS).
    const preview = await request(app).get(`/api/v1/console/tenants/${tenantId}/assets/login`).set('Host', CONSOLE);
    expect(preview.statusCode).toBe(200);
    expect(preview.headers['content-type']).toMatch(/image\/jpeg/);
    expect((await request(app).get(`/api/v1/console/tenants/${tenantId}/assets/secret`).set('Host', CONSOLE)).statusCode).toBe(404);

    await consoleApi.delete(`/api/v1/console/tenants/${tenantId}/login-image`).expect(200);
    const after = await tenantApi('al-musabbihin.nexfinance.test').get('/api/v1/tenant/config');
    expect(after.body.loginImageUrl).toBeNull();
    expect((await tenantApi('al-musabbihin.nexfinance.test').get('/api/v1/tenant/login-image')).statusCode).toBe(404);
  });

  it('can replace the logo without regenerating the colours', async () => {
    await consoleApi.patch(`/api/v1/console/tenants/${tenantId}`)
      .send({ branding: { palette: { primary: '#196fb0', sidebar: '#0e3b2e' } } }).expect(200);
    const res = await consoleApi.put(`/api/v1/console/tenants/${tenantId}/logo?keepPalette=1`)
      .set('Content-Type', 'image/png').send(LOGO);
    expect(res.statusCode).toBe(200);
    expect(res.body.tenant.branding.palette).toMatchObject({ source: 'manual', sidebar: '#0e3b2e' });
  });

  it('sets the login page welcome text (trimmed, length-capped) and clears it with empty strings', async () => {
    const res = await consoleApi.patch(`/api/v1/console/tenants/${tenantId}`).send({
      branding: { loginTitle: '  Ahlan wa sahlan, keluarga Al Musabbihin  ', loginMessage: 'x'.repeat(400) },
    });
    expect(res.statusCode).toBe(200);
    const config = await tenantApi('al-musabbihin.nexfinance.test').get('/api/v1/tenant/config');
    expect(config.body.login.title).toBe('Ahlan wa sahlan, keluarga Al Musabbihin');
    expect(config.body.login.message).toHaveLength(240);

    await consoleApi.patch(`/api/v1/console/tenants/${tenantId}`).send({ branding: { loginTitle: '', loginMessage: '' } }).expect(200);
    const cleared = await tenantApi('al-musabbihin.nexfinance.test').get('/api/v1/tenant/config');
    expect(cleared.body.login).toEqual({ title: null, message: null });
  });

  it('allows manual palette overrides and branding edits', async () => {
    const res = await consoleApi.patch(`/api/v1/console/tenants/${tenantId}`).send({
      name: 'SIT Al Musabbihin',
      branding: { palette: { primary: '#1E6FC0', secondary: '#3FAA48' }, showPoweredBy: false },
    });
    expect(res.statusCode).toBe(200);
    const config = await tenantApi('al-musabbihin.nexfinance.test').get('/api/v1/tenant/config');
    expect(config.body.name).toBe('SIT Al Musabbihin');
    expect(config.body.palette).toMatchObject({ source: 'manual', primary: '#1e6fc0' });
    expect(config.body.showPoweredBy).toBe(false);
  });

  it('adds a custom domain and refuses removing the last one', async () => {
    const add = await consoleApi.post(`/api/v1/console/tenants/${tenantId}/domains`).send({ domain: 'al-musabbihin.sch.id' });
    expect(add.statusCode).toBe(201);
    const viaCustom = await tenantApi('al-musabbihin.sch.id').get('/api/v1/tenant/config');
    expect(viaCustom.statusCode).toBe(200);

    await consoleApi.delete(`/api/v1/console/tenants/${tenantId}/domains/al-musabbihin.sch.id`).expect(200);
    const last = await consoleApi.delete(`/api/v1/console/tenants/${tenantId}/domains/al-musabbihin.nexfinance.test`);
    expect(last.statusCode).toBe(400);
  });

  it('suspends and re-activates a tenant immediately', async () => {
    await consoleApi.patch(`/api/v1/console/tenants/${tenantId}`).send({ status: 'suspended' }).expect(200);
    expect((await tenantApi('al-musabbihin.nexfinance.test').get('/api/v1/tenant/config')).statusCode).toBe(403);
    await consoleApi.patch(`/api/v1/console/tenants/${tenantId}`).send({ status: 'active' }).expect(200);
    expect((await tenantApi('al-musabbihin.nexfinance.test').get('/api/v1/tenant/config')).statusCode).toBe(200);
  });

  it('resets an admin password with a new temporary one', async () => {
    const res = await consoleApi.post(`/api/v1/console/tenants/${tenantId}/reset-password`).send({ username: 'admin-almusabbihin' });
    expect(res.statusCode).toBe(200);
    const login = await tenantApi('al-musabbihin.nexfinance.test').post('/api/v1/auth/login')
      .send({ email: 'admin-almusabbihin', password: res.body.temporaryPassword });
    expect(login.statusCode).toBe(200);
    expect(login.body.user.mustChangePassword).toBe(true);
  });

  it('resets any school user by email typed into the username field', async () => {
    const login = await tenantApi('al-musabbihin.nexfinance.test').post('/api/v1/auth/login')
      .send({ email: 'admin-almusabbihin', password: (await consoleApi.post(`/api/v1/console/tenants/${tenantId}/reset-password`).send({ username: 'admin-almusabbihin' })).body.temporaryPassword });
    const token = login.body.token;
    await tenantApi('al-musabbihin.nexfinance.test').post('/api/v1/master/users').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bendahara', email: 'Bendahara@Al-Musabbihin.sch.id', password: 'Initial-123', role: 'bendahara' }).expect(201);
    const res = await consoleApi.post(`/api/v1/console/tenants/${tenantId}/reset-password`).send({ username: 'bendahara@al-musabbihin.sch.id' });
    expect(res.statusCode).toBe(200);
    const relog = await tenantApi('al-musabbihin.nexfinance.test').post('/api/v1/auth/login')
      .send({ email: 'bendahara@al-musabbihin.sch.id', password: res.body.temporaryPassword });
    expect(relog.statusCode).toBe(200);
  });

  it('lists tenants with domains and user counts, and keeps an audit trail', async () => {
    const list = await consoleApi.get('/api/v1/console/tenants');
    expect(list.statusCode).toBe(200);
    expect(list.body.tenants[0]).toMatchObject({ slug: 'al-musabbihin', userCount: 2 });
    expect(list.body.tenants[0].domains).toContain('al-musabbihin.nexfinance.test');

    const audit = await consoleApi.get('/api/v1/console/audit');
    const actions = audit.body.entries.map((e) => e.action);
    expect(actions).toEqual(expect.arrayContaining(['tenant.create', 'tenant.logo', 'tenant.update', 'tenant.domain_add', 'tenant.reset_password']));
  });

  it('does not leak the schema name or internal ids in the public config', async () => {
    const config = await tenantApi('al-musabbihin.nexfinance.test').get('/api/v1/tenant/config');
    expect(config.body).not.toHaveProperty('schemaName');
    expect(config.body).not.toHaveProperty('id');
  });
});
