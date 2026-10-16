const express = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { logActivity } = require('../lib/activity');
const { getNotificationConfig, sendEmailNotification, sendWhatsAppNotification } = require('../services/notifications');

const router = express.Router();

const getRequestIp = (req) => (
  req.headers['x-forwarded-for']?.split(',')[0]?.trim()
  || req.socket?.remoteAddress
  || '127.0.0.1'
);

router.get('/config', auth, rbac('notifications'), (req, res) => {
  res.json(getNotificationConfig());
});

router.post('/send', auth, rbac('notifications'), async (req, res) => {
  const ipAddress = getRequestIp(req);
  const { channels = [], to = {}, subject, message, html, metadata = {} } = req.body || {};

  if (!Array.isArray(channels) || channels.length === 0) {
    return res.status(400).json({ error: 'channels must be a non-empty array (email, whatsapp)' });
  }
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  await logActivity(req.store, req.user.id, req.user.email, 'notification_attempt', 'notifications', `Notification attempt via ${channels.join(', ')}`, { channels, to, metadata }, { ipAddress });

  const results = [];
  const errors = [];

  for (const channel of channels) {
    try {
      if (channel === 'email') {
        results.push(await sendEmailNotification({ to: to.email, subject, message, html, metadata }));
      } else if (channel === 'whatsapp') {
        results.push(await sendWhatsAppNotification({ to: to.phone, message, metadata }));
      } else {
        errors.push({ channel, error: 'Unsupported channel' });
      }
    } catch (err) {
      errors.push({
        channel,
        error: err.message,
        code: err.code || 'NOTIFICATION_SEND_FAILED',
        status: err.status || 502,
      });
    }
  }

  if (errors.length > 0) {
    await logActivity(req.store, req.user.id, req.user.email, 'notification_failed', 'notifications', 'Notification send failed', { results, errors, channels }, { ipAddress, level: 'warning' });
    return res.status(502).json({ status: 'failed', results, errors });
  }

  await logActivity(req.store, req.user.id, req.user.email, 'notification_sent', 'notifications', 'Notification sent successfully', { results, channels }, { ipAddress });
  return res.json({ status: 'success', results });
});

module.exports = router;
