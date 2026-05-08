const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { purchaseRequests, purchaseOrders } = require('../db');

router.get('/pr', auth, (req, res) => {
  res.json({ purchaseRequests });
});

router.post('/pr', auth, (req, res) => {
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
  res.status(201).json(pr);
});

router.get('/po', auth, (req, res) => {
  res.json({ purchaseOrders });
});

router.post('/po', auth, (req, res) => {
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
  res.status(201).json(po);
});

router.post('/po/:id/receive', auth, (req, res) => {
  const po = purchaseOrders.find(p => p.id === req.params.id);
  if (!po) return res.status(404).json({ error: 'PO not found' });
  po.status = 'received';
  po.receivedAt = new Date().toISOString().split('T')[0];
  res.json(po);
});

router.get('/reports', auth, (req, res) => {
  res.json({
    totalPR: purchaseRequests.length,
    totalPO: purchaseOrders.length,
    totalSpent: purchaseOrders.filter(p => p.status === 'received').reduce((s, p) => s + p.totalAmount, 0),
    pendingPR: purchaseRequests.filter(p => p.status === 'pending').length,
  });
});

module.exports = router;
