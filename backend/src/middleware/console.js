'use strict';

const jwt = require('jsonwebtoken');
const { normalizeHost } = require('../services/tenants');

/** Console endpoints exist only on the configured console host(s); elsewhere they 404. */
const requireConsoleHost = (hosts = []) => {
  const allowed = new Set(hosts.map(normalizeHost));
  return (req, res, next) => {
    const host = normalizeHost(req.headers['x-forwarded-host']?.split(',')[0] || req.headers.host);
    if (!allowed.has(host)) return res.status(404).json({ error: 'Not found' });
    return next();
  };
};

const consoleAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.operator = jwt.verify(token, process.env.JWT_SECRET, { audience: 'console' });
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { requireConsoleHost, consoleAuth };
