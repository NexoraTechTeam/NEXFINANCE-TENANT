const express = require('express');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { users, getUserByEmail, logActivity } = require('../db');
const router = express.Router();

const VALID_ROLES = ['super_admin', 'admin', 'bendahara', 'kabag', 'staff', 'auditor'];

const getRequestIp = (req) => (
  req.headers['x-forwarded-for']?.split(',')[0]?.trim()
  || req.socket?.remoteAddress
  || '127.0.0.1'
);

const maskUser = (user) => {
  const { password, ...safe } = user;
  return safe;
};

const buildAuthPayload = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  name: user.name,
});

const createToken = (user) => jwt.sign(
  buildAuthPayload(user),
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRY || '24h' },
);

const verifyPassword = async (rawPassword, storedPassword) => {
  if (!storedPassword) return false;
  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
    return bcryptjs.compare(rawPassword, storedPassword);
  }
  return storedPassword === rawPassword;
};

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = getRequestIp(req);
  const user = getUserByEmail(email);

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  if (!user || user.status === 'inactive') {
    logActivity(user?.id || 'anonymous', email, 'login_failed', 'auth', `Failed login for ${email}`, { reason: 'user_not_found_or_inactive' }, { level: 'warning', ipAddress });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const passwordValid = await verifyPassword(password, user.password);
  if (!passwordValid) {
    logActivity(user.id, email, 'login_failed', 'auth', `Failed login for ${email}`, { reason: 'invalid_password' }, { level: 'warning', ipAddress });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = createToken(user);
  logActivity(user.id, email, 'login', 'auth', `User ${email} logged in`, { role: user.role }, { ipAddress });

  res.json({ token, user: maskUser(user) });
});

router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  const ipAddress = getRequestIp(req);
  const userRole = role || 'staff';

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  if (!VALID_ROLES.includes(userRole)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
  }
  if (getUserByEmail(email)) {
    logActivity('anonymous', email, 'register_failed', 'auth', `Failed registration for ${email}`, { reason: 'email_exists' }, { level: 'warning', ipAddress });
    return res.status(400).json({ error: 'Email already registered' });
  }

  const hashedPassword = await bcryptjs.hash(password, 10);
  const id = `USR${String(users.length + 1).padStart(3, '0')}`;
  const newUser = {
    id,
    email,
    password: hashedPassword,
    role: userRole,
    name: name || email.split('@')[0],
    status: 'active',
  };

  users.push(newUser);
  const token = createToken(newUser);
  logActivity(newUser.id, newUser.email, 'register', 'auth', `User ${email} registered`, { role: userRole }, { ipAddress });

  res.status(201).json({ token, user: maskUser(newUser) });
});

router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};
  if (!currentPassword || !newPassword || !confirmPassword) return res.status(400).json({ error: 'currentPassword, newPassword, and confirmPassword are required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  if (newPassword !== confirmPassword) return res.status(400).json({ error: 'New password confirmation does not match' });
  const idx = users.findIndex((user) => user.id === req.user.id);
  const user = idx >= 0 ? users[idx] : getUserByEmail(req.user.email);
  if (!user || !(await verifyPassword(currentPassword, user.password))) return res.status(401).json({ error: 'Current password is incorrect' });
  if (currentPassword === newPassword) return res.status(400).json({ error: 'New password must be different from current password' });
  users[idx] = { ...user, password: await bcryptjs.hash(newPassword, 10) };
  logActivity(user.id, user.email, 'change_password', 'auth', `Password changed for ${user.email}`, {});
  return res.json({ message: 'Password changed successfully' });
});

router.get('/me', auth, (req, res) => {
  const user = users.find((u) => u.id === req.user.id) || getUserByEmail(req.user.email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const permissions = rbac.getPermissionsForRole(user.role);
  return res.json({
    user: maskUser(user),
    permissions,
    rolePermissions: rbac.PERMISSIONS,
  });
});

router.get('/permissions', auth, (req, res) => {
  const role = req.user?.role || 'staff';
  return res.json({
    role,
    permissions: rbac.getPermissionsForRole(role),
    rolePermissions: rbac.PERMISSIONS,
  });
});

router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
