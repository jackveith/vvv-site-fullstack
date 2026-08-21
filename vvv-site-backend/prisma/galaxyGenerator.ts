import Delaunator from "delaunator";

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


class UnionFind {
    private parent: number[];
    private rank: number[];

    constructor(size: number) {
        this.parent = Array.from({ length: size }, (_, i) => i);
        this.rank = new Array(size).fill(0);
    }

    find(x: number): number {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x]);
        }
        return this.parent[x];
    }

    union(x: number, y: number): boolean {
        const rootX = this.find(x);
        const rootY = this.find(y);
        if (rootX === rootY) return false;

        if (this.rank[rootX] < this.rank[rootY]) {
            this.parent[rootX] = rootY;
        } else if (this.rank[rootX] > this.rank[rootY]) {
            this.parent[rootY] = rootX;
        } else {
            this.parent[rootY] = rootX;
            this.rank[rootX]++;
        }
        return true;
    }
}

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

//TODO: separate distance ranges for skeleton and leaf system?
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
    skeletonCountRange: [13, 19],
    leafCountRange: [1, 3],
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
            color: stellarClassColors[newClass],
            //color: "#00FF00",
            parentId: parent.id,
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

function edgeKey(a: string, b: string): string {
    return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function computeDelaunayEdges(points: StarSystem[]) {

    const coords = new Float64Array(points.length * 2);
    points.forEach((p, i) => {
        coords[i * 2] = p.x;
        coords[i * 2 + 1] = p.y;
    });

    const delaunay = new Delaunator(coords);
    const edgeMap = new Map<string, SystemEdge>();

    const addEdge = (i: number, j: number) => {
        const a = points[i];
        const b = points[j];
        const key = edgeKey(a.id, b.id);
        if (edgeMap.has(key)) return;
        edgeMap.set(key, { a: a.id, b: b.id, distance: Math.hypot(a.x - b.x, a.y - b.y) });
    };

    //after Delaunator creates triangles, add all edges (3 per tri)
    //to the candidate edge array for finding the MST
    for (let t = 0; t < delaunay.triangles.length; t += 3) {
        const p0 = delaunay.triangles[t];
        const p1 = delaunay.triangles[t + 1];
        const p2 = delaunay.triangles[t + 2];
        addEdge(p0, p1);
        addEdge(p1, p2);
        addEdge(p2, p0);
    }

    return Array.from(edgeMap.values());
}

export function kruskalMST(edges: SystemEdge[], points: StarSystem[]): SystemEdge[] {
    const idToIndex = new Map(points.map((p, i) => [p.id, i]));
    const sorted = [...edges].sort((a, b) => a.distance - b.distance);
    const uf = new UnionFind(points.length);
    const mstEdges: SystemEdge[] = [];

    for (const edge of sorted) {
        const i = idToIndex.get(edge.a)!;
        const j = idToIndex.get(edge.b)!;
        if (uf.union(i, j)) {
            mstEdges.push(edge);
        }
    }

    return mstEdges;
}

export interface SystemEdgeOptions {
    redundancy?: number;
}

export function generateSystemEdges(
    systems: StarSystem[],
    options: SystemEdgeOptions = {}
): SystemEdge[] {

    const { redundancy = .25 } = options;

    //1. compute candidate edges and MST
    const delaunayEdges = computeDelaunayEdges(systems);
    const mstEdges = kruskalMST(delaunayEdges, systems);

    //2. find all the "leftover" delaunayEdges (i.e. all the edges not in the MST)
    //and sort them by their length. then add extra edges to the MST to
    //form the final graph, based on redundancy value
    const mstKeys = new Set(mstEdges.map((e) => edgeKey(e.a, e.b)));
    const leftover = delaunayEdges
        .filter((e) => !mstKeys.has(edgeKey(e.a, e.b)))
        .sort((a, b) => a.distance - b.distance);
    const extraCount = Math.round(leftover.length * redundancy);
    const extraEdges = leftover.slice(0, extraCount);

    return [...mstEdges, ...extraEdges];
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

