'use strict';

const { findTenantByHost, normalizeHost } = require('../services/tenants');
const { createStore } = require('../db/store');

/**
 * Resolves the tenant from the request host. The backend is only reachable through
 * the Next.js frontend (internal network), which forwards the browser host as
 * `x-forwarded-host`; direct calls use `Host`.
 */
function resolveTenant(knex, { cacheTtlMs = 30_000 } = {}) {
  const cache = new Map();

  const lookup = async (host) => {
    const hit = cache.get(host);
    if (hit && hit.expires > Date.now()) return hit.tenant;
    const tenant = await findTenantByHost(knex, host);
    if (cacheTtlMs > 0) cache.set(host, { tenant, expires: Date.now() + cacheTtlMs });
    return tenant;
  };

  const middleware = async (req, res, next) => {
    try {
      const forwarded = req.headers['x-forwarded-host']?.split(',')[0];
      const host = normalizeHost(forwarded || req.headers.host);
      const tenant = await lookup(host);
      if (!tenant) return res.status(404).json({ error: 'Tenant not found for this domain' });
      if (tenant.status !== 'active') {
        return res.status(403).json({ error: 'Layanan untuk sekolah ini sedang dinonaktifkan. Hubungi administrator.' });
      }
      req.tenant = tenant;
      req.store = createStore(knex, tenant.schemaName);
      return next();
    } catch (err) {
      return next(err);
    }
  };
  /** Drop cached lookups (after console changes to status or domains). */
  middleware.invalidate = () => cache.clear();
  return middleware;
}

module.exports = { resolveTenant };
