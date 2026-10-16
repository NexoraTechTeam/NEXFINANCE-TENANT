'use strict';

/** Persists an audit entry in the tenant's activity log (same shape as before). */
async function logActivity(store, userId, userEmail, action, module, description, metadata = {}, options = {}) {
  await store.insert('activity_logs', {
    id: `LOG${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
    userId,
    userEmail,
    action,
    module,
    description,
    metadata,
    ipAddress: options.ipAddress || '127.0.0.1',
    timestamp: new Date().toISOString(),
    level: options.level || 'info',
  });
}

module.exports = { logActivity };
