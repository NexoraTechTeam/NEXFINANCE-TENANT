const PERMISSIONS = {
  super_admin: ['*'],
  admin:     ['*'],
  bendahara: ['dashboard', 'spp', 'payroll', 'expenses', 'accounting', 'reports', 'master', 'activity', 'notifications'],
  kabag:     ['dashboard', 'expenses', 'procurement', 'activity', 'notifications'],
  staff:     ['dashboard', 'expenses', 'notifications'],
  auditor:   ['dashboard', 'reports', 'accounting'],
};

const getPermissionsForRole = (role = 'staff') => PERMISSIONS[role] || [];
const hasModuleAccess = (role = 'staff', module) => {
  const allowed = getPermissionsForRole(role);
  return allowed.includes('*') || allowed.includes(module);
};

/**
 * RBAC middleware factory.
 * Usage: router.get('/path', auth, rbac('module'), handler)
 * @param {string} module - the module/resource name to check access for
 */
const rbac = (module) => (req, res, next) => {
  const role = req.user?.role || 'staff';
  if (hasModuleAccess(role, module)) return next();
  return res.status(403).json({ error: 'Access denied', required: module, role });
};

rbac.PERMISSIONS = PERMISSIONS;
rbac.getPermissionsForRole = getPermissionsForRole;
rbac.hasModuleAccess = hasModuleAccess;

module.exports = rbac;
