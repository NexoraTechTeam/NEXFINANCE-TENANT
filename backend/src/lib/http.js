'use strict';

const getRequestIp = (req) => (
  req.headers['x-forwarded-for']?.split(',')[0]?.trim()
  || req.socket?.remoteAddress
  || '127.0.0.1'
);

/** Wraps an async route handler so rejections reach the error middleware. */
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const today = () => new Date().toISOString().split('T')[0];

/** 400 error whose message is safe to show to the client. */
const badRequest = (message) => Object.assign(new Error(message), { status: 400, expose: true });

module.exports = { getRequestIp, ah, today, badRequest };
