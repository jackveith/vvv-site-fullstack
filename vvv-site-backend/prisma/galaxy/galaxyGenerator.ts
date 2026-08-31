import { type Rng, createRng, randRange, randInt, dist, weightedRandom } from '../util/rng.js';
import { StellarClass, stellarClassColors, stellarClassWeights, DEFAULT_CONFIG } from '../util/types.js';
import type { StarSystem, SystemEdge, Galaxy, GenerationConfig } from '../util/types.js';
import { generateSystemEdges } from './starlanes.js';


let idCounter = 0;
/** Swap this for uuid/nanoid in production if you need globally-unique ids across sessions. */
const genId = () => `sys_${(idCounter++).toString(36)}`;

function generateStellarClass(rng: Rng): StellarClass {
    return weightedRandom<StellarClass>(rng, stellarClassWeights);
}

// ---------- Collision ----------

function collidesWithAny(
    x: number,
    y: number,
    radius: number,
    systems: StarSystem[],
    padding: number
): boolean {
    for (const s of systems) {
        if (dist(x, y, s.x, s.y) < radius + s.radius + padding) return true;
    }
    return false;
}

/**
 * Finds a valid (x, y) for a new system branching off `parent`, respecting
 * the configured distance band and avoiding collisions with every system
 * in `existing`. Widens the distance band a few times before giving up, so
 * dense/cramped maps still terminate instead of retrying forever.
 */
function findPlacement(
    parent: StarSystem,
    existing: StarSystem[],
    config: GenerationConfig,
    rng: Rng
): { x: number; y: number; radius: number } | null {
    const radius = randRange(rng, config.systemRadiusRange[0], config.systemRadiusRange[1]);
    let [minD, maxD] = config.edgeDistanceRange;

    for (let round = 0; round <= config.maxRelaxationRounds; round++) {
        for (let attempt = 0; attempt < config.maxPlacementAttempts; attempt++) {
            const distance = randRange(rng, minD, maxD);
            const angle = rng() * Math.PI * 2;
            const x = parent.x + Math.cos(angle) * distance;
            const y = parent.y + Math.sin(angle) * distance;

            if (!collidesWithAny(x, y, radius, existing, config.padding)) {
                return { x, y, radius };
            }
        }
        // Couldn't find a spot in this distance band — widen max range
        maxD *= config.relaxationFactor;
    }

    return null; // boxed in; caller decides how to handle it
}



// ---------- Pass 1: Skeleton ----------

export function generateSkeleton(config: GenerationConfig, rng: Rng): Galaxy {
    const count = randInt(rng, config.skeletonCountRange[0], config.skeletonCountRange[1]);
    const systems: StarSystem[] = [];
    const edges: SystemEdge[] = [];

    let firstClass = generateStellarClass(rng);
    const first: StarSystem = {
        id: genId(),
        x: 0,
        y: 0,
        radius: randRange(rng, config.systemRadiusRange[0], config.systemRadiusRange[1]),
        depth: 'skeleton',
        stellarClass: firstClass,
        color: stellarClassColors[firstClass],
        //color: "#00FF00",
        parentId: null,
    };
    systems.push(first);

    // Guard against the (rare) case where the chosen parent keeps being boxed
    // in — without this, a high chainBias could spin forever on a full node.
    let guard = 0;
    const guardLimit = count * 50;

    while (systems.length < count && guard < guardLimit) {
        guard++;

        const parent =
            rng() < config.skeletonChainBias
                ? systems[systems.length - 1]
                : systems[randInt(rng, 0, systems.length - 1)];

        const placement = findPlacement(parent!, systems, config, rng);
        if (!placement) continue; // try a different parent next iteration

        const newClass = generateStellarClass(rng);

        const node: StarSystem = {
            id: genId(),
            x: placement.x,
            y: placement.y,
            radius: placement.radius,
            depth: 'skeleton',
            stellarClass: newClass,
            color: stellarClassColors[newClass],
            //color: "#00FF00",
            parentId: parent!.id,
        };
        systems.push(node);
    }

    return { systems, edges };
}



// ---------- Pass 2: Leaves ----------

export function generateLeaves(galaxy: Galaxy, config: GenerationConfig, rng: Rng): void {
    // Snapshot the skeleton nodes before we start pushing leaves into
    // galaxy.systems, so leaves attach only to skeleton systems, never to
    // other leaves.
    const skeletonNodes = galaxy.systems.filter((s) => s.depth === 'skeleton');

    for (const parent of skeletonNodes) {
        const leafCount = randInt(rng, config.leafCountRange[0], config.leafCountRange[1]);
        let placed = 0;
        let guard = 0;
        const guardLimit = leafCount * 50;

        while (placed < leafCount && guard < guardLimit) {
            guard++;

            // galaxy.systems keeps growing as leaves get placed, so later leaves
            // — from this parent AND from parents already processed — are all
            // checked against each other, not just against the skeleton.
            const placement = findPlacement(parent, galaxy.systems, config, rng);
            if (!placement) break; // this neighborhood is full; stop early

            const newClass = generateStellarClass(rng);

            const leaf: StarSystem = {
                id: genId(),
                x: placement.x,
                y: placement.y,
                radius: placement.radius,
                depth: 'leaf',
                stellarClass: newClass,
                color: stellarClassColors[newClass],
                parentId: parent.id,
            };
            galaxy.systems.push(leaf);
            placed++;
        }
    }
}


// ---------- Orchestrator ----------

export function generateGalaxy(
    config: GenerationConfig = DEFAULT_CONFIG,
    seed?: number
): Galaxy {
    const rng = createRng(seed);
    const galaxy = generateSkeleton(config, rng);
    generateLeaves(galaxy, config, rng);
    galaxy.edges = generateSystemEdges(galaxy.systems);

    return galaxy;
}

