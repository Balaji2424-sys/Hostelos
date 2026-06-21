const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const prisma = new PrismaClient();

// Get all tenants
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search, bedId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (bedId) where.bedId = bedId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { aadhaarNumber: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        bed: { include: { room: { include: { floor: { include: { block: true } } } } } },
        payments: { orderBy: { createdAt: 'desc' }, take: 3 }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tenants);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single tenant
router.get('/:id', authenticate, async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        bed: { include: { room: { include: { floor: { include: { block: true } } } } } },
        payments: { orderBy: { createdAt: 'desc' } },
        complaints: { orderBy: { createdAt: 'desc' } },
        ebSplits: { include: { ebBill: true } }
      }
    });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create tenant and assign to bed
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'STAFF'), async (req, res) => {
  try {
    const { bedId, joiningDate, rentAmount, securityDeposit, ...rest } = req.body;

    // Check bed availability
    const bed = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!bed) return res.status(404).json({ error: 'Bed not found' });
    if (bed.isOccupied) return res.status(400).json({ error: 'Bed is already occupied' });

    const tenant = await prisma.$transaction(async (tx) => {
      // Create tenant
      const newTenant = await tx.tenant.create({
        data: {
          ...rest,
          bedId,
          joiningDate: new Date(joiningDate),
          rentAmount: parseFloat(rentAmount),
          securityDeposit: parseFloat(securityDeposit || 0),
          status: 'ACTIVE'
        }
      });
      // Mark bed as occupied
      await tx.bed.update({ where: { id: bedId }, data: { isOccupied: true } });

      // Auto-create current month payment
      const now = new Date();
      await tx.payment.create({
        data: {
          tenantId: newTenant.id,
          amount: parseFloat(rentAmount),
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          dueDate: new Date(now.getFullYear(), now.getMonth(), 5),
          status: 'UNPAID'
        }
      });

      return newTenant;
    });

    const full = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: { bed: { include: { room: true } } }
    });
    res.json(full);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update tenant
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'STAFF'), async (req, res) => {
  try {
    const { vacateDate, noticeDate, status, ...rest } = req.body;
    const data = { ...rest };
    if (vacateDate) data.vacateDate = new Date(vacateDate);
    if (noticeDate) data.noticeDate = new Date(noticeDate);
    if (status) data.status = status;

    const tenant = await prisma.tenant.update({ where: { id: req.params.id }, data });
    res.json(tenant);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Mark tenant as vacated — free the bed
router.post('/:id/vacate', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'STAFF'), async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.update({
        where: { id: req.params.id },
        data: { status: 'VACATED', vacateDate: new Date() }
      });
      await tx.bed.update({ where: { id: tenant.bedId }, data: { isOccupied: false } });
    });
    res.json({ message: 'Tenant vacated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Upcoming vacates
router.get('/upcoming/vacates', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const tenants = await prisma.tenant.findMany({
      where: {
        vacateDate: { gte: now, lte: in30 },
        status: { in: ['ACTIVE', 'NOTICE_GIVEN', 'VACATING'] }
      },
      include: { bed: { include: { room: { include: { floor: { include: { block: true } } } } } } },
      orderBy: { vacateDate: 'asc' }
    });
    res.json(tenants);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
