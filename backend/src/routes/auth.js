'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { logActivity } = require('../lib/activity');
const { getRequestIp, ah } = require('../lib/http');

const LOGIN_FAILED_MESSAGE = 'Email atau password salah.';
const CURRENT_PASSWORD_FAILED_MESSAGE = 'Password saat ini salah.';

const users = (store) => store.db.withSchema(store.schema).from('users');

/** Public user shape (never exposes the hash). */
const toPublicUser = (row) => ({
  id: row.id,
  username: row.username,
  email: row.email,
  role: row.role,
  name: row.name,
  status: row.status,
  mustChangePassword: row.must_change_password,
});

const findByIdentifier = (store, identifier) => users(store)
  .whereRaw('lower(email) = lower(?)', [identifier])
  .orWhere('username', identifier)
  .first();

const createToken = (row, tenant) => jwt.sign(
  { id: row.id, email: row.email, username: row.username, role: row.role, name: row.name, tid: tenant.id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRY || '24h', audience: 'tenant' },
);

function createAuthRouter(config = {}) {
  const router = express.Router();

  const loginLimiter = rateLimit({
    windowMs: config.loginRateLimit?.windowMs ?? 15 * 60 * 1000,
    max: config.loginRateLimit?.max ?? 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    keyGenerator: (req) => `${req.tenant?.id}:${getRequestIp(req)}`,
    message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.' },
  });

  router.post('/login', loginLimiter, ah(async (req, res) => {
    const { store } = req;
    const identifier = (req.body?.email || req.body?.username || '').trim();
    const password = req.body?.password;
    const ipAddress = getRequestIp(req);

    if (!identifier || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await findByIdentifier(store, identifier);
    if (!user || user.status === 'inactive') {
      await logActivity(store, user?.id || 'anonymous', identifier, 'login_failed', 'auth', `Failed login for ${identifier}`, { reason: 'user_not_found_or_inactive' }, { level: 'warning', ipAddress });
      return res.status(401).json({ error: LOGIN_FAILED_MESSAGE });
    }

    if (!(await bcryptjs.compare(password, user.password_hash))) {
      await logActivity(store, user.id, identifier, 'login_failed', 'auth', `Failed login for ${identifier}`, { reason: 'invalid_password' }, { level: 'warning', ipAddress });
      return res.status(401).json({ error: LOGIN_FAILED_MESSAGE });
    }

    await logActivity(store, user.id, user.email || user.username, 'login', 'auth', `User ${identifier} logged in`, { role: user.role }, { ipAddress });
    return res.json({ token: createToken(user, req.tenant), user: toPublicUser(user) });
  }));

  router.post('/change-password', auth, ah(async (req, res) => {
    const { store } = req;
    const { currentPassword, newPassword, confirmPassword } = req.body || {};
    if (!currentPassword || !newPassword || !confirmPassword) return res.status(400).json({ error: 'currentPassword, newPassword, and confirmPassword are required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
    if (newPassword !== confirmPassword) return res.status(400).json({ error: 'New password confirmation does not match' });

    const user = await users(store).where({ id: req.user.id }).first();
    if (!user || !(await bcryptjs.compare(currentPassword, user.password_hash))) {
      return res.status(401).json({ error: CURRENT_PASSWORD_FAILED_MESSAGE });
    }
    if (currentPassword === newPassword) return res.status(400).json({ error: 'New password must be different from current password' });

    await users(store).where({ id: user.id }).update({
      password_hash: await bcryptjs.hash(newPassword, 10),
      must_change_password: false,
      updated_at: store.db.fn.now(),
    });
    await logActivity(store, user.id, user.email || user.username, 'change_password', 'auth', `Password changed for ${user.email || user.username}`, {});
    return res.json({ message: 'Password changed successfully' });
  }));

  router.get('/me', auth, ah(async (req, res) => {
    const user = await users(req.store).where({ id: req.user.id }).first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const matrix = await rbac.loadPermissions(req.store);
    return res.json({
      user: toPublicUser(user),
      permissions: matrix[user.role] || [],
      rolePermissions: matrix,
    });
  }));

  router.get('/permissions', auth, ah(async (req, res) => {
    const role = req.user?.role || 'staff';
    const matrix = await rbac.loadPermissions(req.store);
    return res.json({ role, permissions: matrix[role] || [], rolePermissions: matrix });
  }));

  router.get('/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ valid: false });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { audience: 'tenant' });
      if (decoded.tid !== req.tenant.id) return res.status(401).json({ valid: false });
      return res.json({ valid: true, user: decoded });
    } catch {
      return res.status(401).json({ valid: false });
    }
  });

  return router;
}

module.exports = { createAuthRouter, toPublicUser };
