'use strict';

process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-production';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index');

// ── Health Check ─────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});

// ── Auth: Login ───────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/login', () => {
  it('returns 200 and a token with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@nexfinance.com', password: 'admin123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 401 with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@nexfinance.com', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 401 with unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@nexfinance.com', password: 'somepassword' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when email or password is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@nexfinance.com' });
    expect(res.statusCode).toBe(400);
  });
});

// ── Auth: Protected Routes ────────────────────────────────────────────────────
describe('Protected routes return 401 without token', () => {
  const protectedRoutes = [
    ['GET', '/api/v1/auth/me'],
    ['GET', '/api/v1/auth/permissions'],
    ['GET', '/api/v1/dashboard/kpi'],
    ['GET', '/api/v1/dashboard/monthly-report'],
    ['GET', '/api/v1/spp/invoices'],
    ['GET', '/api/v1/payroll/history'],
    ['GET', '/api/v1/expenses'],
    ['GET', '/api/v1/procurement/pr'],
    ['GET', '/api/v1/accounting/journals'],
    ['GET', '/api/v1/activity'],
    ['GET', '/api/v1/notifications/config'],
  ];

  protectedRoutes.forEach(([method, path]) => {
    it(`${method} ${path} → 401`, async () => {
      const res = await request(app)[method.toLowerCase()](path);
      expect(res.statusCode).toBe(401);
    });
  });
});

// ── Auth: Token-based access ──────────────────────────────────────────────────
describe('Authenticated requests', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@nexfinance.com', password: 'admin123' });
    token = res.body.token;
  });

  it('GET /api/v1/auth/me returns user profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('admin@nexfinance.com');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('GET /api/v1/dashboard/kpi returns KPI data', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/kpi')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('monthRevenue');
    expect(res.body).toHaveProperty('totalStudents');
  });

  it('GET /api/v1/spp/invoices returns invoice list', async () => {
    const res = await request(app)
      .get('/api/v1/spp/invoices')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.invoices || res.body)).toBe(true);
  });

  it('GET /api/v1/accounting/journals returns journal list', async () => {
    const res = await request(app)
      .get('/api/v1/accounting/journals')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });
});

// ── Auth: Verify endpoint ─────────────────────────────────────────────────────
describe('GET /api/v1/auth/verify', () => {
  it('returns valid:false without token', async () => {
    const res = await request(app).get('/api/v1/auth/verify');
    expect(res.statusCode).toBe(401);
    expect(res.body.valid).toBe(false);
  });

  it('returns valid:true with a valid token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bendahara@nexfinance.com', password: 'bendahara123' });
    const res = await request(app)
      .get('/api/v1/auth/verify')
      .set('Authorization', `Bearer ${loginRes.body.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.valid).toBe(true);
  });
});
