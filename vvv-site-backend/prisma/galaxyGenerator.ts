
export type SystemDepth = 'skeleton' | 'leaf';

export enum StellarClass {
    O = "O",
    B = "B",
    A = "A",
    F = "F",
    G = "G",
    K = "K",
    M = "M",
};
const stellarClassColors: Record<StellarClass, string> = {
    [StellarClass.O]: "#9BB0FF",
    [StellarClass.B]: "#B0C7FF",
    [StellarClass.A]: "#DDE5FF",
    [StellarClass.F]: "#FFF4D6",
    [StellarClass.G]: "#FFE08A",
    [StellarClass.K]: "#FFB45C",
    [StellarClass.M]: "#FF6B4A",
};

const stellarClassWeights: Record<StellarClass, number> = {
    [StellarClass.O]: 4,
    [StellarClass.B]: 13,
    [StellarClass.A]: 27,
    [StellarClass.F]: 51,
    [StellarClass.G]: 96,
    [StellarClass.K]: 179,
    [StellarClass.M]: 562,
};

export interface StarSystem {
    id: string;
    x: number;
    y: number;
    radius: number;
    depth: SystemDepth;
    stellarClass: StellarClass;
    color: string;
    /** id of the system this one branched off of during generation (null for the root) */
    parentId: string | null;
}

export interface SystemEdge {
    a: string;
    b: string;
    distance: number;
}

export interface Galaxy {
    systems: StarSystem[];
    edges: SystemEdge[];
}

export interface GenerationConfig {
    /** inclusive min/max number of systems in the skeleton pass */
    skeletonCountRange: [number, number];
    /** inclusive min/max number of leaves attached to EACH skeleton system */
    leafCountRange: [number, number];
    /** min/max distance (edge length) between a system and the one it branched from */
    edgeDistanceRange: [number, number];
    /** min/max randomized radius for a system, used for rendering + collision */
    systemRadiusRange: [number, number];
    /** extra buffer enforced between system edges, beyond their radii */
    padding: number;
    /** attempts at the current distance band before widening the search */
    maxPlacementAttempts: number;
    /** multiplier applied to the max distance each time we widen the search */
    relaxationFactor: number;
    /** how many times we're willing to widen the search before giving up on this node */
    maxRelaxationRounds: number;
    /** 0-1: probability a new skeleton node attaches to the most-recently-added
     *  node (chain-like growth) vs. a random existing node (bushier growth) */
    skeletonChainBias: number;
}

export const DEFAULT_CONFIG: GenerationConfig = {
    skeletonCountRange: [9, 13],
    leafCountRange: [2, 8],
    edgeDistanceRange: [300, 780],
    systemRadiusRange: [4, 10],
    padding: 24,
    maxPlacementAttempts: 24,
    relaxationFactor: 1.35,
    maxRelaxationRounds: 4,
    skeletonChainBias: 0.55,
};

// ---------- Seeded RNG (mulberry32) ----------
// Deterministic when given a seed (handy for reproducing a bug or writing
// tests), but defaults to Date.now() so every real generation is different.

export type Rng = () => number;

export function createRng(seed: number = Date.now()): Rng {
    let a = seed >>> 0;
    return function rng(): number {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const randRange = (rng: Rng, min: number, max: number) => min + rng() * (max - min);
const randInt = (rng: Rng, min: number, max: number) => Math.floor(randRange(rng, min, max + 1));
const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

let idCounter = 0;
/** Swap this for uuid/nanoid in production if you need globally-unique ids across sessions. */
const genId = () => `sys_${(idCounter++).toString(36)}`;

/*randomly pull an outcome from a weighted distribution */
function weightedRandom<T>(rng: Rng, weights: Record<string, number>): T {
    const entries = Object.entries(weights);

    const totalWeight = entries.reduce(
        (sum, [, weight]) => sum + weight,
        0
    );
    let roll = randInt(rng, 0, totalWeight - 1);

    for (const [item, weight] of entries) {
        roll -= weight;
        if (roll < 0) { return item as T; }
    }
    throw new Error("Invalid weight distribution");
}

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
        //color: stellarClassColors[firstClass],
        color: "#00FF00",
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

        const placement = findPlacement(parent, systems, config, rng);
        if (!placement) continue; // try a different parent next iteration

        const newClass = generateStellarClass(rng);

        const node: StarSystem = {
            id: genId(),
            x: placement.x,
            y: placement.y,
            radius: placement.radius,
            depth: 'skeleton',
            stellarClass: newClass,
            //color: stellarClassColors[newClass],
            color: "#00FF00",
            parentId: parent.id,
        };
        systems.push(node);
        edges.push({ a: parent.id, b: node.id, distance: dist(parent.x, parent.y, node.x, node.y) });
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
            galaxy.edges.push({ a: parent.id, b: leaf.id, distance: dist(parent.x, parent.y, leaf.x, leaf.y) });
            placed++;
        }
    }
}

export function addSkeletonLoops(
    galaxy: Galaxy,
    config: GenerationConfig,
    rng: Rng,
    chance: number = 0.15
): void {
    const skeletonNodes = galaxy.systems.filter((s) => s.depth === 'skeleton');
    const existingEdgeKey = new Set(galaxy.edges.map((e) => [e.a, e.b].sort().join('|')));

    for (let i = 0; i < skeletonNodes.length; i++) {
        for (let j = i + 1; j < skeletonNodes.length; j++) {
            const a = skeletonNodes[i];
            const b = skeletonNodes[j];
            const key = [a.id, b.id].sort().join('|');
            if (existingEdgeKey.has(key)) continue;

            const d = dist(a.x, a.y, b.x, b.y);
            const [minD, maxD] = config.edgeDistanceRange;
            if (d >= minD && d <= maxD && rng() < chance) {
                galaxy.edges.push({ a: a.id, b: b.id, distance: dist(a.x, a.y, b.x, b.y) });
                existingEdgeKey.add(key);
            }
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
    return galaxy;
}

