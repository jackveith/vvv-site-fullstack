
// src/routes/systems.ts
import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// GET /api/starlanes — list every star lane (bulk, for canvas rendering)
router.get('/', async (req, res) => {
    try {
        const starLanes = await prisma.starLane.findMany({
            select: { id: true, fromId: true, toId: true, distance: true },
        });
        res.json(starLanes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch star lanes' });
    }
});

// GET /api/starlanes/:systemId — lanes touching a single system
router.get('/:systemId', async (req, res) => {
    try {
        const { systemId } = req.params;
        const starLanes = await prisma.starLane.findMany({
            where: { OR: [{ fromId: systemId }, { toId: systemId }] },
            select: { id: true, fromId: true, toId: true, distance: true },
        });
        res.json(starLanes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch star lanes for system' });
    }
});

export default router;
