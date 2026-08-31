// prisma/seed.ts
// Populates the database with a small starter galaxy.
// Run with: npx prisma db seed

import { PrismaClient } from '../src/generated/prisma/client.js';

import { DEFAULT_CONFIG } from './util/types.js';
import type { Galaxy, StarSystem, SystemEdge } from './util/types.js';
import { generateGalaxy } from './galaxy/galaxyGenerator.js';
import { DEFAULT_SHIP_CONFIG } from './util/types.js';
import { generateShips } from './ships/shipGenerator.js';

const prisma = new PrismaClient();
const random = true;

async function main() {

    const existingCount = await prisma.starSystem.count();
    if (existingCount > 0) {
        console.log("Database already has data — skipping seed.");
        return;
    }

    if (random) {
        await randomGeneration();
    } else {
        await staticGeneration();
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

async function randomGeneration() {

    const galaxy: Galaxy = generateGalaxy(DEFAULT_CONFIG);
    //const galaxy: Galaxy = generateGalaxy(DEFAULT_CONFIG, 12345); //seedable

    const idMap = new Map<string, string>();

    //for each system, add it to the prisma db and map its working id to its prisma id
    for (const system of galaxy.systems) {
        const created = await prisma.starSystem.create({
            data: {
                name: `System ${system.id}`,
                x: system.x,
                y: system.y,
                radius: system.radius,
                brightness: 1,
                color: system.color,
            }
        });

        idMap.set(system.id, created.id);
    }

    //using the id map, add the system edges to the db
    for (const edge of galaxy.edges) {
        await prisma.starLane.create({
            data: {
                fromId: idMap.get(edge.a)!,
                toId: idMap.get(edge.b)!,
                distance: edge.distance,
            }
        });

    }

    //generate ships against the generator-space systems, then translate
    //each ship's home system through the same idMap before inserting —
    //same two-pass id-translation pattern used for systems -> edges above
    const ships = generateShips(galaxy.systems, DEFAULT_SHIP_CONFIG);

    for (const ship of ships) {
        await prisma.ship.create({
            data: {
                name: ship.name,
                credits: ship.credits,
                cargoCapacity: ship.cargoCapacity,
                status: "DOCKED",
                currentSystemId: idMap.get(ship.currentSystemId)!,
            }
        });
    }

    //end db fill
    console.log(`Seeded ${galaxy.systems.length} systems and ${galaxy.edges.length} connections and ${ships.length} ships.`);
}

async function staticGeneration() {

    // ── Star systems ─────────────────────────────────────────
    const sol = await prisma.starSystem.create({
        data: { name: "Sol", x: 0, y: 0, z: 0, radius: 6, brightness: 1, color: "#F9C87A", tags: ["core-world", "capital"] },
    });
    const altair = await prisma.starSystem.create({
        data: { name: "Altair", x: 36, y: -8, z: 1, radius: 4, brightness: 1, color: "#80A8F4", tags: ["mining"] },
    });
    const kepler = await prisma.starSystem.create({
        data: { name: "Kepler-9", x: -24, y: 18, z: -2, radius: 3, brightness: 1, color: "#FFFFFF", tags: ["outlaw", "black-market"] },
    });

    // Connect them with lanes (bidirectional — add both rows so travel works either way)
    await prisma.starLane.createMany({
        data: [
            { fromId: sol.id, toId: altair.id, distance: 14.5 },
            { fromId: altair.id, toId: sol.id, distance: 14.5 },
            { fromId: sol.id, toId: kepler.id, distance: 18.2 },
            { fromId: kepler.id, toId: sol.id, distance: 18.2 },
        ],
    });

    // ── Resources ────────────────────────────────────────────
    const iron = await prisma.resource.create({
        data: { name: "Iron Ore", category: "raw", basePrice: 12, volatility: 0.1 },
    });
    const fuel = await prisma.resource.create({
        data: { name: "Hydrogen Fuel", category: "industrial", basePrice: 30, volatility: 0.2 },
    });
    const spice = await prisma.resource.create({
        data: { name: "Nebula Spice", category: "luxury", basePrice: 250, volatility: 0.4 },
    });
    const contraband = await prisma.resource.create({
        data: {
            name: "Unmarked Weapons",
            category: "contraband",
            basePrice: 500,
            volatility: 0.5,
            attributes: { legal: false },
        },
    });

    // ── Per-system market prices ─────────────────────────────
    // Iron is cheap where it's mined (Altair), expensive elsewhere.
    await prisma.systemResource.createMany({
        data: [
            { systemId: sol.id, resourceId: iron.id, currentPrice: 15, supply: 300 },
            { systemId: sol.id, resourceId: fuel.id, currentPrice: 28, supply: 800 },
            { systemId: sol.id, resourceId: spice.id, currentPrice: 260, supply: 40 },

            { systemId: altair.id, resourceId: iron.id, currentPrice: 8, supply: 900 },
            { systemId: altair.id, resourceId: fuel.id, currentPrice: 35, supply: 200 },

            { systemId: kepler.id, resourceId: spice.id, currentPrice: 210, supply: 120 },
            { systemId: kepler.id, resourceId: contraband.id, currentPrice: 480, supply: 15 },
        ],
    });

    // ── A starter ship ───────────────────────────────────────
    await prisma.ship.create({
        data: {
            name: "Wayfarer",
            credits: 1000,
            cargoCapacity: 100,
            status: "DOCKED",
            currentSystemId: sol.id,
        },
    });

    console.log("Seed complete.");
}

