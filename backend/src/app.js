'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { resolveTenant } = require('./middleware/tenant');
const { createAuthRouter } = require('./routes/auth');
const { createConsoleRouter } = require('./routes/console');
const { createTenantRouter } = require('./routes/tenant');
const { requireConsoleHost } = require('./middleware/console');

/**
 * Builds the API. All tenant routes live under /api/v1 and are scoped by host.
 * @param {{ knex: import('knex').Knex, config?: object }} options
 */
function createApp({ knex, config = {} }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  // Browsers reach the API same-origin through the Next.js proxy; no cross-origin access.
  app.use(cors({ origin: false }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  const tenantResolver = resolveTenant(knex, { cacheTtlMs: config.tenantCacheTtlMs });

  app.use('/api/v1/console',
    requireConsoleHost(config.consoleHosts || []),
    createConsoleRouter({ knex, config, onTenantsChanged: tenantResolver.invalidate }));

  app.use('/api/v1', tenantResolver);
  app.use('/api/v1/tenant', createTenantRouter({ knex }));

  app.use('/api/v1/auth', createAuthRouter(config));
  app.use('/api/v1/accounting', require('./routes/accounting'));
  app.use('/api/v1/spp', require('./routes/spp'));
  app.use('/api/v1/payroll', require('./routes/payroll'));
  app.use('/api/v1/expenses', require('./routes/expenses'));
  app.use('/api/v1/procurement', require('./routes/procurement'));
  app.use('/api/v1/dashboard', require('./routes/dashboard'));
  app.use('/api/v1/master', require('./routes/master'));
  app.use('/api/v1/activity', require('./routes/activity'));
  app.use('/api/v1/notifications', require('./routes/notifications'));

  app.use('/api/v1', (req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== 'test') console.error(err);
    res.status(err.status || 500).json({ error: err.expose ? err.message : 'Internal Server Error' });
  });

  return app;
}

module.exports = { createApp };
