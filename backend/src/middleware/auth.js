'use strict';

const jwt = require('jsonwebtoken');

/**
 * Verifies a tenant-scoped JWT, that it was issued for the tenant serving this request, and that the account
 * is still active. The role comes from the database (role changes apply at once); while a temporary password
 * is pending only the /auth endpoints are reachable.
 */
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { audience: 'tenant' });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (!req.tenant || decoded.tid !== req.tenant.id) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const user = await req.store.db.withSchema(req.store.schema).from('users')
      .where({ id: decoded.id }).first('role', 'status', 'must_change_password');
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Akun tidak aktif. Silakan masuk kembali.' });
    }
    req.user = { ...decoded, role: user.role };
    if (user.must_change_password && !req.originalUrl.startsWith('/api/v1/auth/')) {
      return res.status(403).json({ error: 'Ganti password sementara terlebih dahulu.', code: 'PASSWORD_CHANGE_REQUIRED' });
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = authMiddleware;
