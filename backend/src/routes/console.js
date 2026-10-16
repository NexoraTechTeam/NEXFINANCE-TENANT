'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { consoleAuth } = require('../middleware/console');
const { ah, getRequestIp } = require('../lib/http');
const svc = require('../services/console');

const LOGO_LIMIT = '2mb';

/** Nexora operator console API: tenant registry, branding, domains, credentials. */
function createConsoleRouter({ knex, config = {}, onTenantsChanged = () => {} }) {
  const router = express.Router();
  const image = express.raw({ type: 'image/*', limit: LOGO_LIMIT });
  const actor = (req) => req.operator.email;
  const changed = (result) => { onTenantsChanged(); return result; };

  router.post('/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: config.loginRateLimit?.max ?? 10,
    skipSuccessfulRequests: true,
    validate: false,
    keyGenerator: (req) => `console:${getRequestIp(req)}`,
    message: { error: 'Terlalu banyak percobaan login.' },
  }), ah(async (req, res) => {
    const user = await svc.verifyConsoleUser(knex, req.body?.email, req.body?.password);
    if (!user) return res.status(401).json({ error: 'Email atau password salah.' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
      audience: 'console', expiresIn: '12h',
    });
    return res.json({ token, operator: { id: user.id, email: user.email, name: user.name } });
  }));

  router.use(consoleAuth);

  router.get('/me', (req, res) => res.json({ operator: req.operator, tenantBaseDomain: config.tenantBaseDomain || null }));

  router.post('/palette/preview', image, ah(async (req, res) => {
    const png = await svc.normaliseLogo(req.body);
    res.json({ palette: await svc.paletteFromLogo(png) });
  }));

  router.post('/palette/from-colors', ah(async (req, res) => {
    res.json({ palette: svc.paletteFromColors(req.body || {}) });
  }));

  router.get('/tenants', ah(async (req, res) => {
    res.json({ tenants: await svc.listTenants(knex) });
  }));

  router.post('/tenants', ah(async (req, res) => {
    const result = await svc.createTenant(knex, actor(req), req.body || {}, config);
    res.status(201).json(changed(result));
  }));

  router.get('/tenants/:id', ah(async (req, res) => {
    res.json({ tenant: await svc.getTenant(knex, req.params.id) });
  }));

  router.patch('/tenants/:id', ah(async (req, res) => {
    res.json({ tenant: changed(await svc.updateTenant(knex, actor(req), req.params.id, req.body)) });
  }));

  router.put('/tenants/:id/logo', image, ah(async (req, res) => {
    const tenant = await svc.setLogo(knex, actor(req), req.params.id, req.body, { keepPalette: req.query.keepPalette === '1' });
    res.json({ tenant: changed(tenant) });
  }));

  router.post('/tenants/:id/domains', ah(async (req, res) => {
    res.status(201).json({ tenant: changed(await svc.addDomain(knex, actor(req), req.params.id, req.body?.domain)) });
  }));

  router.delete('/tenants/:id/domains/:domain', ah(async (req, res) => {
    res.json({ tenant: changed(await svc.removeDomain(knex, actor(req), req.params.id, req.params.domain)) });
  }));

  router.post('/tenants/:id/reset-password', ah(async (req, res) => {
    res.json(await svc.resetPassword(knex, actor(req), req.params.id, req.body || {}));
  }));

  router.get('/audit', ah(async (req, res) => {
    res.json({ entries: await svc.listAudit(knex, { limit: Number(req.query.limit) || 100 }) });
  }));

  router.use((req, res) => res.status(404).json({ error: 'Not found' }));
  return router;
}

module.exports = { createConsoleRouter };
