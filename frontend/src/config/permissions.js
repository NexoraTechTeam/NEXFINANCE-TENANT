export const ROLE_PERMISSIONS = {
  admin: ['*'],
  bendahara: ['dashboard', 'spp', 'payroll', 'expenses', 'accounting', 'reports', 'master', 'activity', 'notifications'],
  kabag: ['dashboard', 'expenses', 'procurement', 'activity', 'notifications'],
  staff: ['dashboard', 'expenses', 'notifications'],
  auditor: ['dashboard', 'reports', 'accounting'],
};

export const resolvePermissionsByRole = (role) => ROLE_PERMISSIONS[role] || [];

export const hasModulePermission = (permissions = [], module) => {
  if (!module) return true;
  return permissions.includes('*') || permissions.includes(module);
};
