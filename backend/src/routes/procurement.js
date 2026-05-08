const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Mock PR and PO data
const purchaseRequests = [];
const purchaseOrders = [];

router.post('/pr', auth, (req, res) => {
  const { description, quantity, estimatedCost, urgency } = req.body;
  
  if (!description || !quantity || !estimatedCost) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const pr = {
    id: `PR${Date.now()}`,
    description,
    quantity,
    estimatedCost,
    urgency: urgency || 'normal',
    status: 'pending',
    createdBy: req.user.email,
    createdAt: new Date()
  };

  purchaseRequests.push(pr);
  res.status(201).json(pr);
});

router.post('/po', auth, (req, res) => {
  const { prId, vendor, totalAmount } = req.body;
  
  if (!prId || !vendor || !totalAmount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const po = {
    id: `PO${Date.now()}`,
    prId,
    vendor,
    totalAmount,
    status: 'issued',
    createdAt: new Date()
  };

  purchaseOrders.push(po);
  res.status(201).json(po);
});

router.post('/po/:id/receive', auth, (req, res) => {
  const po = purchaseOrders.find(p => p.id === req.params.id);
  
  if (!po) {
    return res.status(404).json({ error: 'PO not found' });
  }

  po.status = 'received';
  po.receivedAt = new Date();

  res.json(po);
});

router.get('/reports', auth, (req, res) => {
  const totalPR = purchaseRequests.length;
  const totalPO = purchaseOrders.length;
  const totalSpent = purchaseOrders.reduce((sum, p) => sum + p.totalAmount, 0);

  res.json({
    totalPurchaseRequests: totalPR,
    totalPurchaseOrders: totalPO,
    totalAmountSpent: totalSpent,
    pendingPR: purchaseRequests.filter(p => p.status === 'pending').length
  });
});

module.exports = router;
