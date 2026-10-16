'use strict';

const jwt = require('jsonwebtoken');

/** Verifies a tenant-scoped JWT and that it was issued for the tenant serving this request. */
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { audience: 'tenant' });
    if (!req.tenant || decoded.tid !== req.tenant.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
