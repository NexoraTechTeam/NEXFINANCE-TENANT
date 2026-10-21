'use strict';

const express = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { logActivity } = require('../lib/activity');
const { ah } = require('../lib/http');

const router = express.Router();

// GET /api/v1/activity
// Query params: limit, offset, module, action, search
router.get('/', auth, rbac('activity'), ah(async (req, res) => {
  try {
    const activityLogs = await req.store.list('activity_logs');
    const limit  = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const { module, action, search } = req.query;

    let result = [...activityLogs];

    if (module) {
      result = result.filter(l => l.module === module);
    }
    if (action) {
      result = result.filter(l => l.action === action);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        (l.description || '').toLowerCase().includes(q) ||
        (l.userEmail || '').toLowerCase().includes(q) ||
        (l.action || '').toLowerCase().includes(q)
      );
    }

    const total = result.length;
    const data  = result.slice(offset, offset + limit);

    res.json({ data, total, limit, offset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}));

// GET /api/v1/activity/stats
router.get('/stats', auth, rbac('activity'), ah(async (req, res) => {
  try {
    const activityLogs = await req.store.list('activity_logs');
    // Count by module
    const byModule = {};
    // Count by level
    const byLevel = {};
    // Daily counts — last 7 days
    const daily = {};

    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      daily[d.toISOString().split('T')[0]] = 0;
    }

    for (const log of activityLogs) {
      // by module
      byModule[log.module] = (byModule[log.module] || 0) + 1;

      // by level
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;

      // daily (last 7 days)
      const day = log.timestamp.split('T')[0];
      if (day in daily) {
        daily[day]++;
      }
    }

    const dailyArray = Object.entries(daily).map(([date, count]) => ({ date, count }));

    res.json({
      data: {
        total: activityLogs.length,
        byModule,
        byLevel,
        dailyLast7Days: dailyArray,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}));

// DELETE /api/v1/activity/clear — admin / super_admin, keep the latest 100
router.delete('/clear', auth, ah(async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Access denied: admin only' });
  }
  const latest = (await req.store.list('activity_logs')).slice(0, 100).map((l) => l.id);
  const removed = await req.store.removeWhere('activity_logs', latest);
  await logActivity(req.store, req.user.id, req.user.email, 'clear_activity_logs', 'activity', `Cleared ${removed} activity logs`, { removed, retained: latest.length });
  return res.json({ message: `Cleared ${removed} old log entries. ${latest.length} entries retained.` });
}));

module.exports = router;
