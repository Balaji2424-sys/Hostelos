const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, category, tenantId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (tenantId) where.tenantId = tenantId;
    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        tenant: { include: { bed: { include: { room: { include: { floor: { include: { block: true } } } } } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(complaints);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const complaint = await prisma.complaint.create({ data: req.body });
    res.json(complaint);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'OWNER', 'STAFF'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const data = { status, notes };
    if (status === 'RESOLVED') data.resolvedAt = new Date();
    const complaint = await prisma.complaint.update({ where: { id: req.params.id }, data });
    res.json(complaint);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/summary', authenticate, async (req, res) => {
  try {
    const [open, inProgress, resolved] = await Promise.all([
      prisma.complaint.count({ where: { status: 'OPEN' } }),
      prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.complaint.count({ where: { status: 'RESOLVED' } })
    ]);
    res.json({ open, inProgress, resolved, total: open + inProgress + resolved });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
