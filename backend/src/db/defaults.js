'use strict';

const VALID_ROLES = ['super_admin', 'admin', 'bendahara', 'kabag', 'staff', 'auditor'];
const VALID_MODULES = ['dashboard', 'spp', 'payroll', 'expenses', 'procurement', 'accounting', 'reports', 'master', 'activity', 'notifications'];

/** Default role → module matrix applied to every new tenant (editable per tenant afterwards). */
const DEFAULT_PERMISSIONS = {
  super_admin: ['*'],
  admin: ['*'],
  bendahara: ['dashboard', 'spp', 'payroll', 'expenses', 'accounting', 'reports', 'master', 'activity', 'notifications'],
  kabag: ['dashboard', 'expenses', 'procurement', 'activity', 'notifications'],
  staff: ['dashboard', 'expenses', 'notifications'],
  auditor: ['dashboard', 'reports', 'accounting'],
};

/** ISAK 35 chart of accounts seeded into every tenant. */
const DEFAULT_CHART_OF_ACCOUNTS = require('./demo-data').chartOfAccounts;

module.exports = { VALID_ROLES, VALID_MODULES, DEFAULT_PERMISSIONS, DEFAULT_CHART_OF_ACCOUNTS };
