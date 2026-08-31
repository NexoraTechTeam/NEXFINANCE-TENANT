const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { students, employees, users, logActivity } = require('../db');
const VALID_ROLES = ['super_admin', 'admin', 'bendahara', 'kabag', 'staff', 'auditor'];
const VALID_MODULES = ['dashboard', 'spp', 'payroll', 'expenses', 'procurement', 'accounting', 'reports', 'master', 'activity', 'notifications'];

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

// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/master/students
router.get('/students', auth, rbac('master'), (req, res) => {
  try {
    const { class: cls, search } = req.query;
    let result = [...students];

    if (cls) {
      result = result.filter(s => s.class === cls);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }

    const data = result.map(toStudentPayload);
    res.json({ data, students: data, total: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/master/students
router.post('/students', auth, rbac('master'), (req, res) => {
  try {
    const input = normalizeStudentInput(req.body);
    const { nis, name, class: cls, guardianName, phone, email, address } = input;

    if (!nis || !name || !cls) {
      return res.status(400).json({ error: 'nis, name, and class are required' });
    }

    if (students.find(s => s.nis === nis)) {
      return res.status(409).json({ error: 'NIS already exists' });
    }

    const newStudent = {
      id: `STU${String(students.length + 1).padStart(3, '0')}`,
      nis,
      name,
      class: cls,
      guardianName: guardianName || '',
      parentName: guardianName || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      status: 'active',
      enrolledAt: new Date().toISOString().split('T')[0],
    };

    students.push(newStudent);
    logActivity(req.user.id, req.user.email, 'create_student', 'master', `Created student ${name} (${nis})`, { studentId: newStudent.id });

    res.status(201).json({ data: toStudentPayload(newStudent), student: toStudentPayload(newStudent) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/v1/master/students/:id
router.put('/students/:id', auth, rbac('master'), (req, res) => {
  try {
    const idx = students.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Student not found' });

    const input = normalizeStudentInput(req.body);
    const updated = {
      ...students[idx],
      ...input,
      parentName: input.guardianName || input.parentName || students[idx].parentName || '',
      guardianName: input.guardianName || input.parentName || students[idx].guardianName || '',
      id: students[idx].id,
    };
    students[idx] = updated;

    logActivity(req.user.id, req.user.email, 'update_student', 'master', `Updated student ${updated.name}`, { studentId: updated.id });

    res.json({ data: toStudentPayload(updated), student: toStudentPayload(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/v1/master/students/:id  — soft delete (mark inactive)
router.delete('/students/:id', auth, rbac('master'), (req, res) => {
  try {
    const idx = students.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Student not found' });

    students[idx].status = 'inactive';
    logActivity(req.user.id, req.user.email, 'deactivate_student', 'master', `Deactivated student ${students[idx].name}`, { studentId: students[idx].id });

    res.json({ data: toStudentPayload(students[idx]), student: toStudentPayload(students[idx]), message: 'Student marked as inactive' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/master/employees
router.get('/employees', auth, rbac('master'), (req, res) => {
  try {
    const data = employees.map(toEmployeePayload);
    res.json({ data, employees: data, total: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/master/employees
router.post('/employees', auth, rbac('master'), (req, res) => {
  try {
    const { name, position, baseSalary } = req.body;

    if (!name || !position || baseSalary === undefined) {
      return res.status(400).json({ error: 'name, position, and baseSalary are required' });
    }

    const newEmployee = {
      id: `EMP${String(employees.length + 1).padStart(3, '0')}`,
      name,
      position,
      baseSalary: Number(baseSalary),
      certificationAllowance: Number(req.body.certificationAllowance) || 0,
      familyAllowance: Number(req.body.familyAllowance) || 0,
      status: 'active',
    };

    employees.push(newEmployee);
    logActivity(req.user.id, req.user.email, 'create_employee', 'master', `Created employee ${name}`, { employeeId: newEmployee.id });

    res.status(201).json({ data: toEmployeePayload(newEmployee), employee: toEmployeePayload(newEmployee) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/v1/master/employees/:id
router.put('/employees/:id', auth, rbac('master'), (req, res) => {
  try {
    const idx = employees.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Employee not found' });

    const updated = {
      ...employees[idx],
      ...req.body,
      baseSalary: req.body.baseSalary !== undefined ? Number(req.body.baseSalary) : employees[idx].baseSalary,
      certificationAllowance: req.body.certificationAllowance !== undefined ? Number(req.body.certificationAllowance) : employees[idx].certificationAllowance,
      familyAllowance: req.body.familyAllowance !== undefined ? Number(req.body.familyAllowance) : employees[idx].familyAllowance,
      id: employees[idx].id,
    };
    employees[idx] = updated;

    logActivity(req.user.id, req.user.email, 'update_employee', 'master', `Updated employee ${updated.name}`, { employeeId: updated.id });

    res.json({ data: toEmployeePayload(updated), employee: toEmployeePayload(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/v1/master/employees/:id — soft delete
router.delete('/employees/:id', auth, rbac('master'), (req, res) => {
  try {
    const idx = employees.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Employee not found' });

    employees[idx].status = 'inactive';
    logActivity(req.user.id, req.user.email, 'deactivate_employee', 'master', `Deactivated employee ${employees[idx].name}`, { employeeId: employees[idx].id });

    res.json({ data: toEmployeePayload(employees[idx]), employee: toEmployeePayload(employees[idx]), message: 'Employee marked as inactive' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

const maskUser = (u) => {
  const { password, ...safe } = u;
  return safe;
};

// GET /api/v1/master/users
router.get('/users', auth, adminOrSuperAdmin, (req, res) => {
  try {
    res.json({ data: users.map(maskUser), users: users.map(maskUser), total: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/master/users
router.post('/users', auth, adminOrSuperAdmin, (req, res) => {
  try {
    const { email, password, role, name } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({ error: 'email, password, role, and name are required' });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }

    if (users.find(u => u.email === email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const newUser = {
      id: `USR${String(users.length + 1).padStart(3, '0')}`,
      email,
      password,
      role,
      name,
      status: 'active',
    };

    users.push(newUser);
    logActivity(req.user.id, req.user.email, 'create_user', 'master', `Created user ${email} with role ${role}`, { newUserId: newUser.id, role });

    res.status(201).json({ data: maskUser(newUser) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/v1/master/users/:id
router.put('/users/:id', auth, adminOrSuperAdmin, (req, res) => {
  try {
    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    if (req.body.role && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super_admin can change user roles' });
    }
    if (req.body.role && !VALID_ROLES.includes(req.body.role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const allowedFields = ['name', 'email', 'status'];
    const updates = Object.fromEntries(allowedFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
    if (req.user.role === 'super_admin' && req.body.role) updates.role = req.body.role;
    const updated = { ...users[idx], ...updates, id: users[idx].id };
    users[idx] = updated;

    logActivity(req.user.id, req.user.email, 'update_user', 'master', `Updated user ${updated.email}`, { userId: updated.id, role: updated.role });

    res.json({ data: maskUser(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/v1/master/users/:id/role
router.patch('/users/:id/role', auth, superAdminOnly, (req, res) => {
  try {
    const idx = users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    const { role } = req.body;
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role is required and must be one of: ${VALID_ROLES.join(', ')}` });
    }

    users[idx].role = role;
    logActivity(req.user.id, req.user.email, 'update_user_role', 'master', `Updated role for ${users[idx].email} to ${role}`, { userId: users[idx].id, role });
    return res.json({ data: maskUser(users[idx]) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/master/role-permissions
router.get('/role-permissions', auth, superAdminOnly, (req, res) => {
  try {
    return res.json({ data: rbac.PERMISSIONS });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/v1/master/role-permissions/:role
router.patch('/role-permissions/:role', auth, superAdminOnly, (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'permissions must be an array' });
    }

    const uniquePermissions = [...new Set(permissions)];
    const hasInvalid = uniquePermissions.some((module) => module !== '*' && !VALID_MODULES.includes(module));
    if (hasInvalid) {
      return res.status(400).json({ error: `Invalid permissions. Allowed modules: ${VALID_MODULES.join(', ')} or '*'` });
    }

    const normalizedPermissions = uniquePermissions.includes('*')
      ? ['*']
      : uniquePermissions.filter((module) => VALID_MODULES.includes(module));

    rbac.PERMISSIONS[role] = normalizedPermissions;

    logActivity(
      req.user.id,
      req.user.email,
      'update_role_permissions',
      'master',
      `Updated role-permission matrix for ${role}`,
      { role, permissions: normalizedPermissions },
    );

    return res.json({ data: { role, permissions: normalizedPermissions } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
