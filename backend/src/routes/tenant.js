'use strict';

const express = require('express');
const { ah } = require('../lib/http');
const { publicConfig } = require('../services/branding');

/** Public, host-scoped tenant branding for the frontend (no auth). */
function createTenantRouter({ knex }) {
  const router = express.Router();

  router.get('/config', (req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    res.json(publicConfig(req.tenant));
  });

  const serveAsset = (kind, missing) => ah(async (req, res) => {
    const asset = await knex.withSchema('platform').from('tenant_assets')
      .where({ tenant_id: req.tenant.id, kind }).first('content_type', 'data');
    if (!asset) return res.status(404).json({ error: missing });
    res.set('Content-Type', asset.content_type);
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(asset.data);
  });

  router.get('/logo', serveAsset('logo', 'No logo'));
  router.get('/login-image', serveAsset('login', 'No login image'));

  return router;
}

module.exports = { createTenantRouter };
