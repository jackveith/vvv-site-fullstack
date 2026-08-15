// src/routes/systems.ts
import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// GET /api/systems — list every star system (lightweight, no market data)
router.get('/', async (req, res) => {
    try {
        const systems = await prisma.starSystem.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(systems);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch star systems' });
    }
});

// GET /api/systems/:id — one system with its current market + docked ships
router.get('/:id', async (req, res) => {
    try {
        const system = await prisma.starSystem.findUnique({
            where: { id: req.params.id },
            include: {
                market: { include: { resource: true } },
                dockedShips: true,
            },
        });

        if (!system) {
            return res.status(404).json({ error: 'Star system not found' });
        }

        res.json(system);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch star system' });
    }
});

export default router;
