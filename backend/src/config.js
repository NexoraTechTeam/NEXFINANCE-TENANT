'use strict';

const list = (value) => String(value || '').split(',').map((v) => v.trim()).filter(Boolean);

/** Runtime configuration from the environment. */
function loadConfig(env = process.env) {
  return {
    consoleHosts: list(env.CONSOLE_HOSTS),
    tenantBaseDomain: env.TENANT_BASE_DOMAIN || null,
    tenantCacheTtlMs: Number(env.TENANT_CACHE_TTL_MS) || 30_000,
    loginRateLimit: { max: Number(env.LOGIN_RATE_LIMIT_MAX) || 10 },
    consoleAdmin: {
      email: env.CONSOLE_ADMIN_EMAIL,
      name: env.CONSOLE_ADMIN_NAME || 'Nexora Operator',
      password: env.CONSOLE_ADMIN_PASSWORD,
    },
    demoTenantHosts: list(env.DEMO_TENANT_HOSTS),
  };
}

module.exports = { loadConfig };
