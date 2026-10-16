'use strict';

const express = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { logActivity } = require('../lib/activity');
const { ah, today } = require('../lib/http');
const { VALID_ROLES, VALID_MODULES } = require('../db/defaults');
const { insertUser } = require('../services/tenants');
const { toPublicUser } = require('./auth');

const router = express.Router();

const normalizeStudentInput = (payload = {}) => ({
  ...payload,
  class: payload.class || payload.className,
  guardianName: payload.guardianName || payload.parentName || '',
});

const toStudentPayload = (student) => ({
  ...student,
  guardianName: student.guardianName || student.parentName || '',
  parentName: student.parentName || student.guardianName || '',
});

const toEmployeePayload = (employee) => ({
  ...employee,
  baseSalary: Number(employee.baseSalary) || 0,
  certificationAllowance: Number(employee.certificationAllowance) || 0,
  familyAllowance: Number(employee.familyAllowance) || 0,
});

// Clients must never write internal/server-managed fields through PUT bodies.
const PROTECTED_FIELDS = ['id'];
const stripProtected = (body = {}) => Object.fromEntries(
  Object.entries(body).filter(([key]) => !PROTECTED_FIELDS.includes(key)),
);

// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────────────────────────────────────

router.get('/students', auth, rbac('master'), ah(async (req, res) => {
  const { class: cls, search } = req.query;
  let result = await req.store.list('students');
  if (cls) result = result.filter((s) => s.class === cls);
  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter((s) => s.name.toLowerCase().includes(q));
  }
  const data = result.map(toStudentPayload);
  res.json({ data, students: data, total: data.length });
}));

router.post('/students', auth, rbac('master'), ah(async (req, res) => {
  const input = normalizeStudentInput(req.body);
  const { nis, name, class: cls, guardianName, phone, email, address } = input;
  if (!nis || !name || !cls) {
    return res.status(400).json({ error: 'nis, name, and class are required' });
  }
  if ((await req.store.list('students', { where: { nis } })).length > 0) {
    return res.status(409).json({ error: 'NIS already exists' });
  }
  const newStudent = await req.store.insert('students', {
    nis,
    name,
    class: cls,
    guardianName: guardianName || '',
    parentName: guardianName || '',
    phone: phone || '',
    email: email || '',
    address: address || '',
    status: 'active',
    enrolledAt: today(),
  });
  await logActivity(req.store, req.user.id, req.user.email, 'create_student', 'master', `Created student ${name} (${nis})`, { studentId: newStudent.id });
  return res.status(201).json({ data: toStudentPayload(newStudent), student: toStudentPayload(newStudent) });
}));

router.put('/students/:id', auth, rbac('master'), ah(async (req, res) => {
  const input = stripProtected(normalizeStudentInput(req.body));
  const updated = await req.store.update('students', req.params.id, (current) => ({
    ...current,
    ...input,
    parentName: input.guardianName || input.parentName || current.parentName || '',
    guardianName: input.guardianName || input.parentName || current.guardianName || '',
  }));
  if (!updated) return res.status(404).json({ error: 'Student not found' });
  await logActivity(req.store, req.user.id, req.user.email, 'update_student', 'master', `Updated student ${updated.name}`, { studentId: updated.id });
  return res.json({ data: toStudentPayload(updated), student: toStudentPayload(updated) });
}));

router.delete('/students/:id', auth, rbac('master'), ah(async (req, res) => {
  const updated = await req.store.update('students', req.params.id, (current) => ({ ...current, status: 'inactive' }));
  if (!updated) return res.status(404).json({ error: 'Student not found' });
  await logActivity(req.store, req.user.id, req.user.email, 'deactivate_student', 'master', `Deactivated student ${updated.name}`, { studentId: updated.id });
  return res.json({ data: toStudentPayload(updated), student: toStudentPayload(updated), message: 'Student marked as inactive' });
}));

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEES
// ─────────────────────────────────────────────────────────────────────────────

router.get('/employees', auth, rbac('master'), ah(async (req, res) => {
  const data = (await req.store.list('employees')).map(toEmployeePayload);
  res.json({ data, employees: data, total: data.length });
}));

router.post('/employees', auth, rbac('master'), ah(async (req, res) => {
  const { name, position, baseSalary } = req.body;
  if (!name || !position || baseSalary === undefined) {
    return res.status(400).json({ error: 'name, position, and baseSalary are required' });
  }
  const newEmployee = await req.store.insert('employees', {
    name,
    position,
    baseSalary: Number(baseSalary),
    certificationAllowance: Number(req.body.certificationAllowance) || 0,
    familyAllowance: Number(req.body.familyAllowance) || 0,
    status: 'active',
  });
  await logActivity(req.store, req.user.id, req.user.email, 'create_employee', 'master', `Created employee ${name}`, { employeeId: newEmployee.id });
  return res.status(201).json({ data: toEmployeePayload(newEmployee), employee: toEmployeePayload(newEmployee) });
}));

router.put('/employees/:id', auth, rbac('master'), ah(async (req, res) => {
  const body = stripProtected(req.body);
  const updated = await req.store.update('employees', req.params.id, (current) => ({
    ...current,
    ...body,
    baseSalary: body.baseSalary !== undefined ? Number(body.baseSalary) : current.baseSalary,
    certificationAllowance: body.certificationAllowance !== undefined ? Number(body.certificationAllowance) : current.certificationAllowance,
    familyAllowance: body.familyAllowance !== undefined ? Number(body.familyAllowance) : current.familyAllowance,
  }));
  if (!updated) return res.status(404).json({ error: 'Employee not found' });
  await logActivity(req.store, req.user.id, req.user.email, 'update_employee', 'master', `Updated employee ${updated.name}`, { employeeId: updated.id });
  return res.json({ data: toEmployeePayload(updated), employee: toEmployeePayload(updated) });
}));

router.delete('/employees/:id', auth, rbac('master'), ah(async (req, res) => {
  const updated = await req.store.update('employees', req.params.id, (current) => ({ ...current, status: 'inactive' }));
  if (!updated) return res.status(404).json({ error: 'Employee not found' });
  await logActivity(req.store, req.user.id, req.user.email, 'deactivate_employee', 'master', `Deactivated employee ${updated.name}`, { employeeId: updated.id });
  return res.json({ data: toEmployeePayload(updated), employee: toEmployeePayload(updated), message: 'Employee marked as inactive' });
}));

// ─────────────────────────────────────────────────────────────────────────────
// USERS  (admin only)
// ─────────────────────────────────────────────────────────────────────────────

const adminOrSuperAdmin = (req, res, next) => {
  if (!['admin', 'super_admin'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Access denied: admin/super_admin only' });
  }
  return next();
};

const superAdminOnly = (req, res, next) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied: super_admin only' });
  }
  return next();
};

const usersTable = (store) => store.db.withSchema(store.schema).from('users');

router.get('/users', auth, adminOrSuperAdmin, ah(async (req, res) => {
  const rows = await usersTable(req.store).orderBy('created_at', 'asc').orderBy('id', 'asc');
  const data = rows.map(toPublicUser);
  res.json({ data, users: data, total: data.length });
}));

router.post('/users', auth, adminOrSuperAdmin, ah(async (req, res) => {
  const { email, username, password, role, name } = req.body;
  const userRole = req.user.role === 'super_admin' ? role : 'staff';

  if ((!email && !username) || !password || !name || (req.user.role === 'super_admin' && !role)) {
    return res.status(400).json({ error: 'email, password, name, and role for super_admin are required' });
  }
  if (req.user.role !== 'super_admin' && role) {
    return res.status(403).json({ error: 'Only super_admin can assign user roles' });
  }
  if (!VALID_ROLES.includes(userRole)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  const duplicate = await usersTable(req.store)
    .modify((q) => { if (email) q.orWhereRaw('lower(email) = lower(?)', [email]); if (username) q.orWhere('username', username); })
    .first('id');
  if (duplicate) return res.status(409).json({ error: 'Email already registered' });

  const created = await insertUser(req.store, { email, username, name, role: userRole, password });
  await logActivity(req.store, req.user.id, req.user.email, 'create_user', 'master', `Created user ${email || username} with role ${userRole}`, { newUserId: created.id, role: userRole });
  return res.status(201).json({ data: toPublicUser(created) });
}));

router.delete('/users/:id', auth, adminOrSuperAdmin, ah(async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot deactivate your own account' });
  const [updated] = await usersTable(req.store).where({ id: req.params.id })
    .update({ status: 'inactive', updated_at: req.store.db.fn.now() }).returning('*');
  if (!updated) return res.status(404).json({ error: 'User not found' });
  await logActivity(req.store, req.user.id, req.user.email, 'deactivate_user', 'master', `Deactivated user ${updated.email || updated.username}`, { userId: updated.id });
  return res.json({ data: toPublicUser(updated), message: 'User deactivated' });
}));

router.put('/users/:id', auth, adminOrSuperAdmin, ah(async (req, res) => {
  const existing = await usersTable(req.store).where({ id: req.params.id }).first();
  if (!existing) return res.status(404).json({ error: 'User not found' });

  if (req.body.role && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only super_admin can change user roles' });
  }
  if (req.body.role && !VALID_ROLES.includes(req.body.role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
  }

  const allowedFields = ['name', 'email', 'status'];
  const updates = Object.fromEntries(allowedFields.filter((f) => req.body[f] !== undefined).map((f) => [f, req.body[f]]));
  if (req.user.role === 'super_admin' && req.body.role) updates.role = req.body.role;
  const [updated] = await usersTable(req.store).where({ id: existing.id })
    .update({ ...updates, updated_at: req.store.db.fn.now() }).returning('*');

  await logActivity(req.store, req.user.id, req.user.email, 'update_user', 'master', `Updated user ${updated.email || updated.username}`, { userId: updated.id, role: updated.role });
  return res.json({ data: toPublicUser(updated) });
}));

router.patch('/users/:id/role', auth, superAdminOnly, ah(async (req, res) => {
  const { role } = req.body;
  if (!role || !VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `role is required and must be one of: ${VALID_ROLES.join(', ')}` });
  }
  const [updated] = await usersTable(req.store).where({ id: req.params.id })
    .update({ role, updated_at: req.store.db.fn.now() }).returning('*');
  if (!updated) return res.status(404).json({ error: 'User not found' });
  await logActivity(req.store, req.user.id, req.user.email, 'update_user_role', 'master', `Updated role for ${updated.email || updated.username} to ${role}`, { userId: updated.id, role });
  return res.json({ data: toPublicUser(updated) });
}));

router.get('/role-permissions', auth, superAdminOnly, ah(async (req, res) => {
  res.json({ data: await rbac.loadPermissions(req.store) });
}));

router.patch('/role-permissions/:role', auth, superAdminOnly, ah(async (req, res) => {
  const { role } = req.params;
  const { permissions } = req.body;

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
  }
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ error: 'permissions must be an array' });
  }
  const uniquePermissions = [...new Set(permissions)];
  if (uniquePermissions.some((m) => m !== '*' && !VALID_MODULES.includes(m))) {
    return res.status(400).json({ error: `Invalid permissions. Allowed modules: ${VALID_MODULES.join(', ')} or '*'` });
  }
  const normalizedPermissions = uniquePermissions.includes('*')
    ? ['*']
    : uniquePermissions.filter((m) => VALID_MODULES.includes(m));

  await req.store.db.withSchema(req.store.schema).insert({ role, permissions: normalizedPermissions })
    .into('role_permissions').onConflict('role').merge();

  await logActivity(req.store, req.user.id, req.user.email, 'update_role_permissions', 'master', `Updated role-permission matrix for ${role}`, { role, permissions: normalizedPermissions });
  return res.json({ data: { role, permissions: normalizedPermissions } });
}));

module.exports = router;
