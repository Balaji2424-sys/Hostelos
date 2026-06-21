const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();

// Monthly rent collection report
router.get('/rent-collection', authenticate, async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const payments = await prisma.payment.findMany({
      where: { month: m, year: y },
      include: {
        tenant: { include: { bed: { include: { room: { include: { floor: { include: { block: true } } } } } } } }
      },
      orderBy: { status: 'asc' }
    });
    const summary = {
      month: m, year: y,
      total: payments.length,
      paid: payments.filter(p => p.status === 'PAID').length,
      unpaid: payments.filter(p => p.status === 'UNPAID').length,
      overdue: payments.filter(p => p.status === 'OVERDUE').length,
      paidAmount: payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0),
      pendingAmount: payments.filter(p => p.status !== 'PAID').reduce((s, p) => s + (p.dueAmount || p.amount), 0),
      payments
    };
    res.json(summary);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Occupancy report
router.get('/occupancy', authenticate, async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        floor: { include: { block: true } },
        beds: { include: { tenants: { where: { status: { in: ['ACTIVE', 'NOTICE_GIVEN'] } } } } }
      }
    });
    const report = rooms.map(r => ({
      roomNumber: r.roomNumber,
      block: r.floor.block.name,
      floor: r.floor.number,
      totalBeds: r.totalBeds,
      occupied: r.beds.filter(b => b.isOccupied).length,
      vacant: r.beds.filter(b => !b.isOccupied).length,
      occupancyRate: r.totalBeds > 0 ? Math.round((r.beds.filter(b => b.isOccupied).length / r.totalBeds) * 100) : 0
    }));
    res.json(report);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Unpaid tenants report
router.get('/unpaid-tenants', authenticate, async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const payments = await prisma.payment.findMany({
      where: { month: m, year: y, status: { in: ['UNPAID', 'OVERDUE', 'PARTIALLY_PAID'] } },
      include: { tenant: { include: { bed: { include: { room: true } } } } }
    });
    res.json(payments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Annual summary
router.get('/annual', authenticate, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const monthly = [];
    for (let m = 1; m <= 12; m++) {
      const [paid, total, eb] = await Promise.all([
        prisma.payment.aggregate({ where: { month: m, year, status: 'PAID' }, _sum: { amount: true } }),
        prisma.payment.aggregate({ where: { month: m, year }, _sum: { amount: true } }),
        prisma.ebBill.aggregate({ where: { billingMonth: m, billingYear: year }, _sum: { totalBill: true } })
      ]);
      monthly.push({
        month: m,
        label: new Date(year, m - 1).toLocaleString('default', { month: 'short' }),
        collected: paid._sum.amount || 0,
        expected: total._sum.amount || 0,
        ebBill: eb._sum.totalBill || 0,
        collectionRate: (total._sum.amount || 0) > 0 ? Math.round(((paid._sum.amount || 0) / (total._sum.amount || 1)) * 100) : 0
      });
    }
    res.json({ year, monthly });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
