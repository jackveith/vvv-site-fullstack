


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
export const stellarClassColors: Record<StellarClass, string> = {
    [StellarClass.O]: "#9BB0FF",
    [StellarClass.B]: "#B0C7FF",
    [StellarClass.A]: "#DDE5FF",
    [StellarClass.F]: "#FFF4D6",
    [StellarClass.G]: "#FFE08A",
    [StellarClass.K]: "#FFB45C",
    [StellarClass.M]: "#FF6B4A",
};

export const stellarClassWeights: Record<StellarClass, number> = {
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
