const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/stats', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const in7 = new Date(now.getTime() + 7 * 86400000);
    const in30 = new Date(now.getTime() + 30 * 86400000);

    const [
      totalBeds, occupiedBeds,
      totalTenants, activeTenants,
      paidThisMonth, unpaidThisMonth,
      overduePayments,
      openComplaints,
      upcomingVacates7,
      upcomingVacates30,
      ebThisMonth
    ] = await Promise.all([
      prisma.bed.count(),
      prisma.bed.count({ where: { isOccupied: true } }),
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: { in: ['ACTIVE', 'NOTICE_GIVEN'] } } }),
      prisma.payment.aggregate({ where: { status: 'PAID', month, year }, _sum: { amount: true }, _count: true }),
      prisma.payment.aggregate({ where: { status: { in: ['UNPAID', 'OVERDUE'] }, month, year }, _sum: { amount: true }, _count: true }),
      prisma.payment.count({ where: { status: 'OVERDUE' } }),
      prisma.complaint.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.tenant.count({ where: { vacateDate: { gte: now, lte: in7 }, status: { in: ['ACTIVE', 'NOTICE_GIVEN', 'VACATING'] } } }),
      prisma.tenant.count({ where: { vacateDate: { gte: now, lte: in30 }, status: { in: ['ACTIVE', 'NOTICE_GIVEN', 'VACATING'] } } }),
      prisma.ebBill.aggregate({ where: { billingMonth: month, billingYear: year }, _sum: { totalBill: true } })
    ]);

    const vacantBeds = totalBeds - occupiedBeds;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const expectedRevenue = activeTenants > 0
      ? (await prisma.tenant.aggregate({ where: { status: { in: ['ACTIVE', 'NOTICE_GIVEN'] } }, _sum: { rentAmount: true } }))._sum.rentAmount || 0
      : 0;

    res.json({
      occupancy: { totalBeds, occupiedBeds, vacantBeds, occupancyRate },
      tenants: { total: totalTenants, active: activeTenants },
      payments: {
        paidAmount: paidThisMonth._sum.amount || 0,
        paidCount: paidThisMonth._count,
        unpaidAmount: unpaidThisMonth._sum.amount || 0,
        unpaidCount: unpaidThisMonth._count,
        overdueCount: overduePayments,
        expectedRevenue,
        collectionRate: expectedRevenue > 0 ? Math.round(((paidThisMonth._sum.amount || 0) / expectedRevenue) * 100) : 0
      },
      complaints: { open: openComplaints },
      vacates: { next7Days: upcomingVacates7, next30Days: upcomingVacates30 },
      electricity: { thisMonth: ebThisMonth._sum.totalBill || 0 }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Room occupancy map data
router.get('/room-map', authenticate, async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      include: {
        floor: { include: { block: true } },
        beds: {
          include: {
            tenants: {
              where: { status: { in: ['ACTIVE', 'NOTICE_GIVEN', 'VACATING'] } },
              include: {
                payments: {
                  where: {
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear()
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 1
                }
              }
            }
          }
        }
      },
      orderBy: [{ floor: { block: { name: 'asc' } } }, { roomNumber: 'asc' }]
    });

    const map = rooms.map(room => ({
      id: room.id,
      roomNumber: room.roomNumber,
      block: room.floor.block.name,
      floor: room.floor.number,
      roomType: room.roomType,
      monthlyRent: room.monthlyRent,
      meterNumber: room.meterNumber,
      beds: room.beds.map(bed => {
        const tenant = bed.tenants[0] || null;
        const latestPayment = tenant?.payments[0] || null;
        let bedStatus = 'VACANT'; // blue
        if (tenant) {
          bedStatus = latestPayment?.status === 'PAID' ? 'PAID' : 'UNPAID'; // green or red
        }
        return {
          id: bed.id,
          bedNumber: bed.bedNumber,
          isOccupied: bed.isOccupied,
          status: bedStatus,
          tenant: tenant ? {
            id: tenant.id,
            name: tenant.name,
            phone: tenant.phone,
            joiningDate: tenant.joiningDate,
            vacateDate: tenant.vacateDate,
            rentAmount: tenant.rentAmount,
            advanceBalance: tenant.advanceBalance,
            paymentStatus: latestPayment?.status || 'NO_RECORD',
            dueAmount: latestPayment?.dueAmount || 0
          } : null
        };
      })
    }));

    res.json(map);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
