const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const prisma = new PrismaClient();

// Get all EB bills
router.get('/', authenticate, async (req, res) => {
  try {
    const { roomId, month, year } = req.query;
    const where = {};
    if (roomId) where.roomId = roomId;
    if (month) where.billingMonth = parseInt(month);
    if (year) where.billingYear = parseInt(year);
    const bills = await prisma.ebBill.findMany({
      where,
      include: {
        room: { include: { floor: { include: { block: true } } } },
        splits: { include: { tenant: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bills);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create EB bill and auto-split among active tenants in room
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'STAFF'), async (req, res) => {
  try {
    const { roomId, previousReading, currentReading, costPerUnit, billingMonth, billingYear } = req.body;
    const units = parseFloat(currentReading) - parseFloat(previousReading);
    const totalBill = units * parseFloat(costPerUnit || 7.0);

    // Get active tenants in this room
    const activeBeds = await prisma.bed.findMany({
      where: { roomId, isOccupied: true },
      include: {
        tenants: { where: { status: { in: ['ACTIVE', 'NOTICE_GIVEN'] } } }
      }
    });

    const activeTenants = activeBeds.flatMap(b => b.tenants);
    const splitAmount = activeTenants.length > 0 ? totalBill / activeTenants.length : totalBill;

    const bill = await prisma.ebBill.create({
      data: {
        roomId,
        previousReading: parseFloat(previousReading),
        currentReading: parseFloat(currentReading),
        unitsConsumed: units,
        costPerUnit: parseFloat(costPerUnit || 7.0),
        totalBill,
        billingMonth: parseInt(billingMonth),
        billingYear: parseInt(billingYear),
        splits: {
          create: activeTenants.map(t => ({ tenantId: t.id, amount: splitAmount }))
        }
      },
      include: { splits: { include: { tenant: true } }, room: true }
    });
    res.json(bill);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Monthly EB trend
router.get('/trend', authenticate, async (req, res) => {
  try {
    const results = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const agg = await prisma.ebBill.aggregate({
        where: { billingMonth: m, billingYear: y },
        _sum: { totalBill: true, unitsConsumed: true }
      });
      results.push({
        month: m, year: y,
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        totalBill: agg._sum.totalBill || 0,
        units: agg._sum.unitsConsumed || 0
      });
    }
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Mark EB split as paid
router.put('/splits/:id/pay', authenticate, async (req, res) => {
  try {
    const split = await prisma.ebSplit.update({ where: { id: req.params.id }, data: { isPaid: true } });
    res.json(split);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
