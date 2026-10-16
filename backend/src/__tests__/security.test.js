'use strict';

const request = require('supertest');
const { bootstrap, DEMO_HOST } = require('./helpers/setup');
const { provisionTenant } = require('../services/tenants');
const { createApp } = require('../app');

let app;
let knex;
const OTHER_HOST = 'other.localhost';

beforeAll(async () => {
  ({ app, knex } = await bootstrap({ demo: true }));
  await provisionTenant(knex, {
    slug: 'other', name: 'Other', domains: [OTHER_HOST],
    admin: { username: 'root-other', name: 'Root', password: 'Other-Pass-123' },
  });
});

afterAll(async () => {
  await knex.destroy();
});

const http = new Proxy({}, {
  get: (_, method) => (path) => request(app)[method](path).set('Host', DEMO_HOST),
});

const token = async (email, password) => (await http.post('/api/v1/auth/login').send({ email, password })).body.token;

describe('security hardening', () => {
  it('removes public self-registration', async () => {
    const res = await http.post('/api/v1/auth/register')
      .send({ email: 'evil@example.com', password: 'whatever123', role: 'super_admin' });
    expect(res.statusCode).toBe(404);
  });

  it('stores passwords of users created by admins as bcrypt hashes', async () => {
    const t = await token('superadmin@nexfinance.com', 'superadmin123');
    const res = await http.post('/api/v1/master/users').set('Authorization', `Bearer ${t}`)
      .send({ name: 'Hashed', email: 'hashed@example.com', password: 'plain-text-123', role: 'staff' });
    expect(res.statusCode).toBe(201);
    const [row] = await knex.withSchema('t_demo').from('users').where({ email: 'hashed@example.com' });
    expect(row.password_hash).toMatch(/^\$2[aby]\$/);
    const login = await http.post('/api/v1/auth/login').send({ email: 'hashed@example.com', password: 'plain-text-123' });
    expect(login.statusCode).toBe(200);
  });

  it('migrates seeded demo passwords to hashes', async () => {
    const rows = await knex.withSchema('t_demo').from('users').select('password_hash');
    for (const row of rows) expect(row.password_hash).toMatch(/^\$2[aby]\$/);
  });

  it('rate-limits repeated login attempts per tenant and IP', async () => {
    const limited = createApp({ knex, config: { loginRateLimit: { max: 3, windowMs: 60_000 } } });
    const attempt = () => request(limited).post('/api/v1/auth/login').set('Host', DEMO_HOST)
      .send({ email: 'admin@nexfinance.com', password: 'wrong' });
    for (let i = 0; i < 3; i += 1) expect((await attempt()).statusCode).toBe(401);
    expect((await attempt()).statusCode).toBe(429);
  });

  it('persists role permission changes per tenant only', async () => {
    const t = await token('superadmin@nexfinance.com', 'superadmin123');
    const res = await http.patch('/api/v1/master/role-permissions/staff').set('Authorization', `Bearer ${t}`)
      .send({ permissions: ['dashboard', 'expenses', 'notifications', 'spp'] });
    expect(res.statusCode).toBe(200);

    const staff = await token('staff@nexfinance.com', 'staff123');
    const spp = await http.get('/api/v1/spp/invoices').set('Authorization', `Bearer ${staff}`);
    expect(spp.statusCode).toBe(200);

    const [other] = await knex.withSchema('t_other').from('role_permissions').where({ role: 'staff' });
    expect(other.permissions).not.toContain('spp');
  });

  it('lets super_admin clear old activity logs', async () => {
    const t = await token('superadmin@nexfinance.com', 'superadmin123');
    const res = await http.delete('/api/v1/activity/clear').set('Authorization', `Bearer ${t}`);
    expect(res.statusCode).toBe(200);
  });

  it('rejects tokens without a tenant claim', async () => {
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ id: 'USR000', email: 'superadmin@nexfinance.com', role: 'super_admin' }, process.env.JWT_SECRET);
    const res = await http.get('/api/v1/master/users').set('Authorization', `Bearer ${forged}`);
    expect(res.statusCode).toBe(401);
  });
});
