'use strict';

const express = require('express');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { logActivity } = require('../lib/activity');
const { getRequestIp, ah } = require('../lib/http');
const { sendEmailNotification, sendWhatsAppNotification } = require('../services/notifications');
const { postSppInvoice, postSppPayment } = require('../services/posting');

const router = express.Router();

const enrichInvoice = (invoice) => ({
  ...invoice,
  invoiceNumber: invoice.invoiceNumber || invoice.id,
  paidAt: invoice.paidAt || null,
  paymentMethod: invoice.paymentMethod || null,
  payerName: invoice.payerName || invoice.parentName || invoice.guardianName || null,
  payerPhone: invoice.payerPhone || invoice.phone || null,
  payerEmail: invoice.payerEmail || invoice.email || null,
});

router.get('/invoices', auth, rbac('spp'), ah(async (req, res) => {
  const invoices = await req.store.list('spp_invoices');
  res.json({ invoices: invoices.map(enrichInvoice) });
}));

router.post('/invoices', auth, rbac('spp'), ah(async (req, res) => {
  const { store } = req;
  const ipAddress = getRequestIp(req);
  const {
    studentId, studentName, class: className, amount, month,
    payerName, payerPhone, payerEmail, guardianName, parentName,
  } = req.body;
  if (!studentId || !studentName || !amount || !month) {
    return res.status(400).json({ error: 'Missing required fields: studentId, studentName, amount, month' });
  }
  const student = await store.get('students', studentId);
  const invoice = await store.withTransaction(async (tx) => {
    const id = await tx.nextId('spp_invoices');
    const created = await tx.insert('spp_invoices', {
    id,
    invoiceNumber: id,
    studentId,
    studentName,
    class: className || student?.class || '-',
    amount: Number(amount),
    month,
    status: 'unpaid',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    payerName: payerName || guardianName || parentName || student?.guardianName || student?.parentName || null,
    payerPhone: payerPhone || student?.phone || null,
    payerEmail: payerEmail || student?.email || null,
    });
    await postSppInvoice(tx, created);
    return created;
  });
  await logActivity(store, req.user.id, req.user.email, 'create_invoice', 'spp', `Created SPP invoice ${invoice.id} for ${invoice.studentName}`, { invoiceId: invoice.id, studentId: invoice.studentId, amount: invoice.amount, month: invoice.month }, { ipAddress });
  return res.status(201).json(enrichInvoice(invoice));
}));

router.post('/payment', auth, rbac('spp'), ah(async (req, res) => {
  const { store } = req;
  const ipAddress = getRequestIp(req);
  const { invoiceId, method, notify = false, notificationChannels = ['email', 'whatsapp'], payerContact = {} } = req.body;
  if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' });

  let conflict = null;
  const invoice = await store.withTransaction(async (tx) => {
    const updated = await tx.update('spp_invoices', invoiceId, (current) => {
    if (current.status === 'paid') { conflict = 'Invoice already paid'; return current; }
    return {
      ...current,
      status: 'paid',
      paidAt: new Date().toISOString(),
      paymentMethod: method || 'Transfer',
      invoiceNumber: current.invoiceNumber || current.id,
      payerName: current.payerName || payerContact.name || null,
      payerPhone: current.payerPhone || payerContact.phone || null,
      payerEmail: current.payerEmail || payerContact.email || null,
    };
    });
    if (updated && !conflict) await postSppPayment(tx, updated);
    return updated;
  });
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  if (conflict) return res.status(400).json({ error: conflict });

  await logActivity(store, req.user.id, req.user.email, 'record_payment', 'spp', `Recorded payment for ${invoice.studentName} (${invoice.id})`, {
    invoiceId: invoice.id,
    studentId: invoice.studentId,
    studentName: invoice.studentName,
    class: invoice.class,
    month: invoice.month,
    amount: invoice.amount,
    paymentMethod: invoice.paymentMethod,
    paidAt: invoice.paidAt,
  }, { ipAddress });

  let notification = null;
  if (notify) {
    const message = `Pembayaran SPP berhasil diterima. Invoice ${invoice.invoiceNumber} untuk ${invoice.studentName} (${invoice.class}) bulan ${invoice.month} sebesar Rp${invoice.amount.toLocaleString('id-ID')} via ${invoice.paymentMethod}.`;
    const channels = Array.isArray(notificationChannels) ? notificationChannels : ['email', 'whatsapp'];
    const results = [];
    const errors = [];

    for (const channel of channels) {
      try {
        if (channel === 'email') {
          results.push(await sendEmailNotification({
            to: invoice.payerEmail,
            subject: `Bukti Pembayaran SPP ${invoice.invoiceNumber}`,
            message,
            metadata: { invoiceId: invoice.id, studentId: invoice.studentId },
          }));
        } else if (channel === 'whatsapp') {
          results.push(await sendWhatsAppNotification({
            to: invoice.payerPhone,
            message,
            metadata: { invoiceId: invoice.id, studentId: invoice.studentId },
          }));
        }
      } catch (err) {
        errors.push({ channel, error: err.message, code: err.code || 'NOTIFICATION_SEND_FAILED' });
      }
    }

    if (errors.length > 0) {
      await logActivity(store, req.user.id, req.user.email, 'payment_notification_failed', 'spp', `Payment notification failed for ${invoice.id}`, { invoiceId: invoice.id, results, errors }, { ipAddress, level: 'warning' });
      return res.status(502).json({ error: 'Payment recorded but notification failed', invoice: enrichInvoice(invoice), notification: { status: 'failed', results, errors } });
    }

    notification = { status: 'success', results };
    await logActivity(store, req.user.id, req.user.email, 'payment_notification_sent', 'spp', `Payment notification sent for ${invoice.id}`, { invoiceId: invoice.id, channels }, { ipAddress });
  }

  return res.json({
    status: 'success',
    invoice: enrichInvoice(invoice),
    receipt: {
      invoiceNumber: invoice.invoiceNumber,
      paidAt: invoice.paidAt,
      studentName: invoice.studentName,
      class: invoice.class,
      month: invoice.month,
      amount: invoice.amount,
      paymentMethod: invoice.paymentMethod,
      studentId: invoice.studentId,
      payerName: invoice.payerName,
      payerPhone: invoice.payerPhone,
      payerEmail: invoice.payerEmail,
    },
    notification,
  });
}));

router.get('/reports', auth, rbac('spp'), ah(async (req, res) => {
  const sppInvoices = await req.store.list('spp_invoices');
  const total = sppInvoices.length;
  const paid = sppInvoices.filter((i) => i.status === 'paid').length;
  const totalCollected = sppInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalInvoiced = sppInvoices.reduce((s, i) => s + i.amount, 0);
  res.json({
    totalStudents: total,
    totalPaid: paid,
    totalUnpaid: total - paid,
    collectionRate: total > 0 ? ((paid / total) * 100).toFixed(1) + '%' : '0%',
    totalCollected,
    totalInvoiced,
  });
}));

module.exports = router;
