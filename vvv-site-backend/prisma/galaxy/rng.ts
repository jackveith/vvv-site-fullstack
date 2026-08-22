
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

export const randRange = (rng: Rng, min: number, max: number) => min + rng() * (max - min);
export const randInt = (rng: Rng, min: number, max: number) => Math.floor(randRange(rng, min, max + 1));
export const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

/*randomly pull an outcome from a weighted distribution */
export function weightedRandom<T>(rng: Rng, weights: Record<string, number>): T {
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
