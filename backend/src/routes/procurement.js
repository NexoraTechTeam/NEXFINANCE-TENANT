const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { purchaseRequests, purchaseOrders, logActivity } = require('../db');

const getRequestIp = (req) => (
  req.headers['x-forwarded-for']?.split(',')[0]?.trim()
  || req.socket?.remoteAddress
  || '127.0.0.1'
);

router.get('/pr', auth, rbac('procurement'), (req, res) => {
  res.json({ purchaseRequests });
});

router.post('/pr', auth, rbac('procurement'), (req, res) => {
  const ipAddress = getRequestIp(req);
  const { description, quantity, estimatedCost, urgency } = req.body;
  if (!description || !quantity || !estimatedCost) {
    return res.status(400).json({ error: 'description, quantity, estimatedCost are required' });
  }
  const pr = {
    id: `PR${Date.now()}`,
    description,
    quantity: Number(quantity),
    estimatedCost: Number(estimatedCost),
    urgency: urgency || 'normal',
    status: 'pending',
    createdBy: req.user.email,
    createdAt: new Date().toISOString().split('T')[0],
  };
  purchaseRequests.unshift(pr);
  logActivity(req.user.id, req.user.email, 'create_pr', 'procurement', `Created purchase request ${pr.id}`, { prId: pr.id, estimatedCost: pr.estimatedCost, quantity: pr.quantity }, { ipAddress });
  res.status(201).json(pr);
});

router.get('/po', auth, rbac('procurement'), (req, res) => {
  res.json({ purchaseOrders });
});

router.post('/po', auth, rbac('procurement'), (req, res) => {
  const ipAddress = getRequestIp(req);
  const { prId, vendor, totalAmount } = req.body;
  if (!prId || !vendor || !totalAmount) {
    return res.status(400).json({ error: 'prId, vendor, totalAmount are required' });
  }
  const po = {
    id: `PO${Date.now()}`,
    prId,
    vendor,
    totalAmount: Number(totalAmount),
    status: 'issued',
    createdAt: new Date().toISOString().split('T')[0],
  };
  purchaseOrders.unshift(po);
  logActivity(req.user.id, req.user.email, 'create_po', 'procurement', `Created purchase order ${po.id}`, { poId: po.id, prId: po.prId, vendor: po.vendor, totalAmount: po.totalAmount }, { ipAddress });
  res.status(201).json(po);
});

router.post('/po/:id/receive', auth, rbac('procurement'), (req, res) => {
  const ipAddress = getRequestIp(req);
  const po = purchaseOrders.find(p => p.id === req.params.id);
  if (!po) return res.status(404).json({ error: 'PO not found' });
  po.status = 'received';
  po.receivedAt = new Date().toISOString().split('T')[0];
  logActivity(req.user.id, req.user.email, 'receive_po', 'procurement', `Marked purchase order ${po.id} as received`, { poId: po.id, receivedAt: po.receivedAt }, { ipAddress });
  res.json(po);
});

router.get('/reports', auth, rbac('procurement'), (req, res) => {
  res.json({
    totalPR: purchaseRequests.length,
    totalPO: purchaseOrders.length,
    totalSpent: purchaseOrders.filter(p => p.status === 'received').reduce((s, p) => s + p.totalAmount, 0),
    pendingPR: purchaseRequests.filter(p => p.status === 'pending').length,
  });
});

module.exports = router;
