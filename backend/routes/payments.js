const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const prisma = new PrismaClient();

// Get payments
router.get('/', authenticate, async (req, res) => {
  try {
    const { tenantId, status, month, year } = req.query;
    const where = {};
    if (tenantId) where.tenantId = tenantId;
    if (status) where.status = status;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const payments = await prisma.payment.findMany({
      where,
      include: {
        tenant: {
          include: { bed: { include: { room: { include: { floor: { include: { block: true } } } } } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Dashboard payment summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [paid, unpaid, overdue, partial] = await Promise.all([
      prisma.payment.aggregate({ where: { status: 'PAID', month, year }, _sum: { amount: true }, _count: true }),
      prisma.payment.aggregate({ where: { status: 'UNPAID', month, year }, _sum: { amount: true }, _count: true }),
      prisma.payment.aggregate({ where: { status: 'OVERDUE' }, _sum: { amount: true }, _count: true }),
      prisma.payment.aggregate({ where: { status: 'PARTIALLY_PAID', month, year }, _sum: { dueAmount: true }, _count: true }),
    ]);

    res.json({
      totalPaid: paid._sum.amount || 0,
      totalUnpaid: unpaid._sum.amount || 0,
      totalOverdue: overdue._sum.amount || 0,
      totalPartial: partial._sum.dueAmount || 0,
      paidCount: paid._count,
      unpaidCount: unpaid._count,
      overdueCount: overdue._count,
      month, year
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Monthly collection trend (last 6 months)
router.get('/trend', authenticate, async (req, res) => {
  try {
    const results = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const agg = await prisma.payment.aggregate({
        where: { status: 'PAID', month: m, year: y },
        _sum: { amount: true }
      });
      results.push({ month: m, year: y, label: d.toLocaleString('default', { month: 'short', year: '2-digit' }), amount: agg._sum.amount || 0 });
    }
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Record manual payment (cash / admin update)
router.post('/:id/record', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'STAFF'), async (req, res) => {
  try {
    const { amount, method, transactionId, notes } = req.body;
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const paid = parseFloat(amount);
    const newDue = Math.max(0, payment.amount - paid);
    const status = newDue === 0 ? 'PAID' : paid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

    const updated = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        paidDate: new Date(),
        dueAmount: newDue,
        status,
        method: method || 'CASH',
        transactionId,
        notes
      }
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// === FAKE PAYMENT SIMULATION ===
router.post('/fake/initiate', authenticate, async (req, res) => {
  try {
    const { paymentId, amount, tenantId } = req.body;
    // Simulate a Razorpay-like order response
    const fakeOrderId = `fake_order_${Date.now()}`;
    res.json({
      orderId: fakeOrderId,
      amount: parseFloat(amount) * 100, // paise
      currency: 'INR',
      paymentId,
      tenantId,
      mode: 'SIMULATION',
      message: 'This is a simulated payment. No real money is charged.'
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/fake/verify', authenticate, async (req, res) => {
  try {
    const { paymentId, orderId, amount } = req.body;
    // Auto-verify — simulate success
    const fakeTransactionId = `fake_txn_${Date.now()}`;
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paidDate: new Date(),
        status: 'PAID',
        dueAmount: 0,
        method: 'FAKE_PAYMENT',
        transactionId: fakeTransactionId
      }
    });
    res.json({ success: true, transactionId: fakeTransactionId, payment: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Generate monthly payments for all active tenants
router.post('/generate-monthly', authenticate, authorize('SUPER_ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { month, year } = req.body;
    const tenants = await prisma.tenant.findMany({
      where: { status: { in: ['ACTIVE', 'NOTICE_GIVEN'] } }
    });

    let created = 0;
    for (const tenant of tenants) {
      const exists = await prisma.payment.findFirst({
        where: { tenantId: tenant.id, month: parseInt(month), year: parseInt(year) }
      });
      if (!exists) {
        await prisma.payment.create({
          data: {
            tenantId: tenant.id,
            amount: tenant.rentAmount,
            month: parseInt(month),
            year: parseInt(year),
            dueDate: new Date(parseInt(year), parseInt(month) - 1, 5),
            status: 'UNPAID'
          }
        });
        created++;
      }
    }
    res.json({ message: `Generated ${created} payment records` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
