'use strict';

const { DEFAULT_PERMISSIONS } = require('../db/defaults');

const allows = (permissions, module) => permissions.includes('*') || permissions.includes(module);

/** Loads the tenant's role → modules matrix from its schema. */
async function loadPermissions(store) {
  const rows = await store.db.withSchema(store.schema).from('role_permissions').select('role', 'permissions');
  return Object.fromEntries(rows.map((r) => [r.role, r.permissions]));
}

/**
 * RBAC middleware factory (per tenant, persisted).
 * Usage: router.get('/path', auth, rbac('module'), handler)
 */
const rbac = (module) => async (req, res, next) => {
  try {
    const role = req.user?.role || 'staff';
    const matrix = await loadPermissions(req.store);
    if (allows(matrix[role] || [], module)) return next();
    return res.status(403).json({ error: 'Access denied', required: module, role });
  } catch (err) {
    return next(err);
  }
};

/** Roles that may read a module but never change it (the auditor reviews the books only). */
const READ_ONLY_ROLES = new Set(['auditor']);
const denyReadOnly = (req, res, next) => (READ_ONLY_ROLES.has(req.user?.role)
  ? res.status(403).json({ error: 'Peran ini hanya dapat melihat data (baca saja).' })
  : next());

rbac.DEFAULT_PERMISSIONS = DEFAULT_PERMISSIONS;
rbac.denyReadOnly = denyReadOnly;
rbac.loadPermissions = loadPermissions;
rbac.allows = allows;

module.exports = rbac;
