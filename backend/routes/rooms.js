const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const prisma = new PrismaClient();

// Get all rooms with full occupancy data
router.get('/', authenticate, async (req, res) => {
  try {
    const { floorId, blockId, roomType, vacant } = req.query;
    const where = {};
    if (floorId) where.floorId = floorId;
    if (roomType) where.roomType = roomType;

    const rooms = await prisma.room.findMany({
      where,
      include: {
        floor: { include: { block: { include: { hostel: true } } } },
        beds: {
          include: {
            tenants: {
              where: { status: { in: ['ACTIVE', 'NOTICE_GIVEN', 'VACATING'] } },
              include: {
                payments: {
                  orderBy: { createdAt: 'desc' },
                  take: 1
                }
              }
            }
          }
        }
      },
      orderBy: { roomNumber: 'asc' }
    });

    // Compute vacancy stats per room
    const enriched = rooms.map(room => {
      const occupiedBeds = room.beds.filter(b => b.isOccupied).length;
      const vacantBeds = room.totalBeds - occupiedBeds;
      return { ...room, occupiedBeds, vacantBeds };
    });

    const filtered = vacant === 'true' ? enriched.filter(r => r.vacantBeds > 0) : enriched;
    res.json(filtered);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single room
router.get('/:id', authenticate, async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: {
        floor: { include: { block: true } },
        beds: {
          include: {
            tenants: {
              where: { status: { in: ['ACTIVE', 'NOTICE_GIVEN', 'VACATING'] } },
              include: { payments: { orderBy: { createdAt: 'desc' }, take: 3 } }
            }
          }
        },
        ebBills: { orderBy: { createdAt: 'desc' }, take: 6 }
      }
    });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create room with auto-generated beds
router.post('/', authenticate, authorize('SUPER_ADMIN', 'OWNER'), async (req, res) => {
  try {
    const { roomNumber, floorId, roomType, totalBeds, monthlyRent, meterNumber, notes } = req.body;
    const room = await prisma.room.create({
      data: {
        roomNumber, floorId, roomType, totalBeds, monthlyRent, meterNumber, notes,
        beds: {
          create: Array.from({ length: totalBeds }, (_, i) => ({ bedNumber: i + 1, isOccupied: false }))
        }
      },
      include: { beds: true }
    });
    res.json(room);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update room
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'OWNER'), async (req, res) => {
  try {
    const room = await prisma.room.update({ where: { id: req.params.id }, data: req.body });
    res.json(room);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get vacant beds across all rooms
router.get('/vacant/beds', authenticate, async (req, res) => {
  try {
    const beds = await prisma.bed.findMany({
      where: { isOccupied: false },
      include: { room: { include: { floor: { include: { block: true } } } } }
    });
    res.json(beds);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
