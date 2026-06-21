const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const prisma = new PrismaClient();

// Get all hostels
router.get('/', authenticate, async (req, res) => {
  try {
    const hostels = await prisma.hostel.findMany({
      include: { blocks: { include: { floors: { include: { rooms: { include: { beds: true } } } } } } }
    });
    res.json(hostels);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create hostel
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OWNER'), async (req, res) => {
  try {
    const hostel = await prisma.hostel.create({ data: req.body });
    res.json(hostel);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update hostel
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'OWNER'), async (req, res) => {
  try {
    const hostel = await prisma.hostel.update({ where: { id: req.params.id }, data: req.body });
    res.json(hostel);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create block
router.post('/:hostelId/blocks', authenticate, authorize('SUPER_ADMIN', 'OWNER'), async (req, res) => {
  try {
    const block = await prisma.block.create({ data: { ...req.body, hostelId: req.params.hostelId } });
    res.json(block);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create floor
router.post('/blocks/:blockId/floors', authenticate, authorize('SUPER_ADMIN', 'OWNER'), async (req, res) => {
  try {
    const floor = await prisma.floor.create({ data: { ...req.body, blockId: req.params.blockId } });
    res.json(floor);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
