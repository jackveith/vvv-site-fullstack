
// STARSYSTEM
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

// Ship archetypes + generation config. Mirrors the shape of galaxy/types.ts:
// a weighted enum (like StellarClass) drives both flavor (which name
// templates feel "in character") and mechanics (cargo/credit ranges).

export enum ShipClass {
    SHUTTLE = "SHUTTLE",
    CLIPPER = "CLIPPER",
    HAULER = "HAULER",
    FREIGHTER = "FREIGHTER",
    TANKER = "TANKER",
    CORVETTE = "CORVETTE",
    EXPLORER = "EXPLORER",
    YACHT = "YACHT",
}

// Relative frequency in the galaxy — small/utility ships should vastly
// outnumber capital-scale freighters and pleasure yachts.
export const shipClassWeights: Record<ShipClass, number> = {
    [ShipClass.SHUTTLE]: 24,
    [ShipClass.CLIPPER]: 20,
    [ShipClass.HAULER]: 22,
    [ShipClass.FREIGHTER]: 14,
    [ShipClass.TANKER]: 8,
    [ShipClass.CORVETTE]: 7,
    [ShipClass.EXPLORER]: 4,
    [ShipClass.YACHT]: 1,
};

// Which naming template feels "in character" for a class — a corvette
// reads more like a registry code, a yacht reads more like it was named
// after someone. See ships/names.ts for what each template produces.
export type NameTemplate = 'registry' | 'adjNoun' | 'personal' | 'numbered' | 'serial';

export interface ShipClassProfile {
    cargoCapacityRange: [number, number];
    creditsRange: [number, number];
    /** registry letters painted on the hull, e.g. the "MV" in "MV Horizon" */
    registryPrefixes: string[];
    templateWeights: Record<NameTemplate, number>;
}

export const shipClassProfiles: Record<ShipClass, ShipClassProfile> = {
    [ShipClass.SHUTTLE]: {
        cargoCapacityRange: [10, 40],
        creditsRange: [200, 1500],
        registryPrefixes: ["SH", "LC"],
        templateWeights: { registry: 3, adjNoun: 2, personal: 1, numbered: 2, serial: 3 },
    },
    [ShipClass.CLIPPER]: {
        cargoCapacityRange: [30, 90],
        creditsRange: [800, 4000],
        registryPrefixes: ["MV", "CV"],
        templateWeights: { registry: 4, adjNoun: 3, personal: 1, numbered: 2, serial: 1 },
    },
    [ShipClass.HAULER]: {
        cargoCapacityRange: [80, 220],
        creditsRange: [1000, 6000],
        registryPrefixes: ["MV", "UES"],
        templateWeights: { registry: 4, adjNoun: 3, personal: 1, numbered: 2, serial: 1 },
    },
    [ShipClass.FREIGHTER]: {
        cargoCapacityRange: [200, 600],
        creditsRange: [3000, 15000],
        registryPrefixes: ["UES", "MV", "SS"],
        templateWeights: { registry: 4, adjNoun: 4, personal: 1, numbered: 2, serial: 1 },
    },
    [ShipClass.TANKER]: {
        cargoCapacityRange: [300, 800],
        creditsRange: [4000, 18000],
        registryPrefixes: ["UES", "MT"],
        templateWeights: { registry: 3, adjNoun: 4, personal: 0, numbered: 2, serial: 2 },
    },
    [ShipClass.CORVETTE]: {
        cargoCapacityRange: [20, 60],
        creditsRange: [2000, 9000],
        registryPrefixes: ["ISV", "CS"],
        templateWeights: { registry: 2, adjNoun: 1, personal: 0, numbered: 2, serial: 5 },
    },
    [ShipClass.EXPLORER]: {
        cargoCapacityRange: [40, 100],
        creditsRange: [1500, 7000],
        registryPrefixes: ["ISV", "RV"],
        templateWeights: { registry: 3, adjNoun: 4, personal: 1, numbered: 3, serial: 1 },
    },
    [ShipClass.YACHT]: {
        cargoCapacityRange: [5, 25],
        creditsRange: [10000, 50000],
        registryPrefixes: ["SS", "MY"],
        templateWeights: { registry: 1, adjNoun: 2, personal: 5, numbered: 1, serial: 0 },
    },
};

export interface ShipGenerationConfig {
    /** inclusive min/max total ships spawned across the whole galaxy */
    shipCountRange: [number, number];
}

export const DEFAULT_SHIP_CONFIG: ShipGenerationConfig = {
    shipCountRange: [18, 32],
};





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
