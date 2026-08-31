import { type Rng, createRng, randInt, randRange, weightedRandom } from '../util/rng.js';
import { at } from '../util/assert.js';
import type { StarSystem } from '../util/types.js';
import { ShipClass, shipClassWeights, shipClassProfiles, DEFAULT_SHIP_CONFIG } from '../util/types.js';
import type { ShipGenerationConfig } from '../util/types.js';
import { generateShipName } from './names.js';

export interface GeneratedShip {
    id: string;
    name: string;
    shipClass: ShipClass;
    credits: number;
    cargoCapacity: number;
    /** generator-space StarSystem id — translate via idMap before insert, same as StarLane edges */
    currentSystemId: string;
}

let idCounter = 0;
/** Swap this for uuid/nanoid in production if you need globally-unique ids across sessions. */
const genId = () => `ship_${(idCounter++).toString(36)}`;

/**
 * Scatters a population of ships across an already-generated galaxy, each
 * docked at a random system. Pure function in, plain data out — no Prisma
 * calls here, mirroring galaxyGenerator.ts, so it's trivial to reuse or
 * unit test outside the seed script.
 */
export function generateShips(
    systems: StarSystem[],
    config: ShipGenerationConfig = DEFAULT_SHIP_CONFIG,
    seed?: number
): GeneratedShip[] {
    if (systems.length === 0) return [];

    const rng: Rng = createRng(seed);
    const count = randInt(rng, config.shipCountRange[0], config.shipCountRange[1]);
    const ships: GeneratedShip[] = [];

    for (let i = 0; i < count; i++) {
        const shipClass = weightedRandom<ShipClass>(rng, shipClassWeights);
        const profile = shipClassProfiles[shipClass];
        const homeSystem = at(systems, randInt(rng, 0, systems.length - 1));

        ships.push({
            id: genId(),
            name: generateShipName(rng, shipClass),
            shipClass,
            credits: Math.round(randRange(rng, profile.creditsRange[0], profile.creditsRange[1])),
            cargoCapacity: Math.round(randRange(rng, profile.cargoCapacityRange[0], profile.cargoCapacityRange[1])),
            currentSystemId: homeSystem.id,
        });
    }

    return ships;
}
