import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// GET /api/ships — list every ship (bulk, for canvas rendering)
router.get('/', async (req, res) => {
    try {
        const ships = await prisma.ship.findMany({
            select: {
                id: true,
                name: true,
                status: true,
                currentSystemId: true,
                destinationSystemId: true,
                departedAt: true,
                arrivesAt: true,
            },
        });
        res.json(ships);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch ships' });
    }
});

// GET /api/ships/system/:systemId — ships currently docked at a system
router.get('/system/:systemId', async (req, res) => {
    try {
        const { systemId } = req.params;
        const ships = await prisma.ship.findMany({
            where: { currentSystemId: systemId },
            select: {
                id: true,
                name: true,
                status: true,
                currentSystemId: true,
                destinationSystemId: true,
                departedAt: true,
                arrivesAt: true,
            },
        });
        res.json(ships);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch ships for system' });
    }
});

// GET /api/ships/:id — one ship with cargo + recent trade history
router.get('/:id', async (req, res) => {
    try {
        const ship = await prisma.ship.findUnique({
            where: { id: req.params.id },
            include: {
                currentSystem: true,
                cargo: { include: { resource: true } },
                trades: { orderBy: { timestamp: 'desc' }, take: 20 },
            },
        });

        if (!ship) {
            return res.status(404).json({ error: 'Ship not found' });
        }

        res.json(ship);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch ship' });
    }
});

export default router;
