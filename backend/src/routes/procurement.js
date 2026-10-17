'use strict';

const express = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { logActivity } = require('../lib/activity');
const { getRequestIp, ah, today } = require('../lib/http');
const { postReceivedPurchaseOrder } = require('../services/posting');

const router = express.Router();

router.get('/pr', auth, rbac('procurement'), ah(async (req, res) => {
  res.json({ purchaseRequests: await req.store.list('purchase_requests') });
}));

router.post('/pr', auth, rbac('procurement'), ah(async (req, res) => {
  const ipAddress = getRequestIp(req);
  const { quantity, estimatedCost, urgency, reason } = req.body;
  // The web form sends `item`; older API clients send `description`. Store both for either reader.
  const description = req.body.item || req.body.description;
  if (!description || !quantity || !estimatedCost) {
    return res.status(400).json({ error: 'item (or description), quantity, estimatedCost are required' });
  }
  const pr = await req.store.insert('purchase_requests', {
    id: await req.store.nextId('purchase_requests'),
    item: description,
    description,
    reason: reason || '',
    quantity: Number(quantity),
    estimatedCost: Number(estimatedCost),
    urgency: urgency || 'normal',
    status: 'pending',
    createdBy: req.user.email,
    createdAt: today(),
  });
  await logActivity(req.store, req.user.id, req.user.email, 'create_pr', 'procurement', `Created purchase request ${pr.id}`, { prId: pr.id, estimatedCost: pr.estimatedCost, quantity: pr.quantity }, { ipAddress });
  return res.status(201).json(pr);
}));

router.get('/po', auth, rbac('procurement'), ah(async (req, res) => {
  res.json({ purchaseOrders: await req.store.list('purchase_orders') });
}));

router.post('/po', auth, rbac('procurement'), ah(async (req, res) => {
  const ipAddress = getRequestIp(req);
  const { prId, vendor } = req.body;
  // The web form sends `totalCost`; API clients send `totalAmount`. Store both for either reader.
  const totalAmount = req.body.totalAmount ?? req.body.totalCost;
  if (!prId || !vendor || !totalAmount) {
    return res.status(400).json({ error: 'prId, vendor, totalAmount (or totalCost) are required' });
  }
  const po = await req.store.insert('purchase_orders', {
    id: await req.store.nextId('purchase_orders'),
    prId,
    vendor,
    totalAmount: Number(totalAmount),
    totalCost: Number(totalAmount),
    status: 'issued',
    createdAt: today(),
  });
  await logActivity(req.store, req.user.id, req.user.email, 'create_po', 'procurement', `Created purchase order ${po.id}`, { poId: po.id, prId: po.prId, vendor: po.vendor, totalAmount: po.totalAmount }, { ipAddress });
  return res.status(201).json(po);
}));

router.post('/po/:id/receive', auth, rbac('procurement'), ah(async (req, res) => {
  const ipAddress = getRequestIp(req);
  let alreadyReceived = false;
  const po = await req.store.withTransaction(async (tx) => {
    const updated = await tx.update('purchase_orders', req.params.id, (current) => {
      alreadyReceived = current.status === 'received';
      return alreadyReceived ? current : { ...current, status: 'received', receivedAt: today() };
    });
    if (updated && !alreadyReceived) await postReceivedPurchaseOrder(tx, updated);
    return updated;
  });
  if (!po) return res.status(404).json({ error: 'PO not found' });
  await logActivity(req.store, req.user.id, req.user.email, 'receive_po', 'procurement', `Marked purchase order ${po.id} as received`, { poId: po.id, receivedAt: po.receivedAt }, { ipAddress });
  return res.json(po);
}));

router.get('/reports', auth, rbac('procurement'), ah(async (req, res) => {
  const [purchaseRequests, purchaseOrders] = await Promise.all([
    req.store.list('purchase_requests'), req.store.list('purchase_orders'),
  ]);
  res.json({
    totalPR: purchaseRequests.length,
    totalPO: purchaseOrders.length,
    totalSpent: purchaseOrders.filter((p) => p.status === 'received').reduce((s, p) => s + p.totalAmount, 0),
    pendingPR: purchaseRequests.filter((p) => p.status === 'pending').length,
  });
}));

module.exports = router;
