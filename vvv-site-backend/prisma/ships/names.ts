
// Turns a ShipClass into a plausible-sounding name via a handful of
// interchangeable templates, weighted per-class in ships/types.ts. Same
// "systematic but varied" idea as the stellar-class table in galaxy/types.ts,
// just applied to naming flavor instead of physics.

import { type Rng, randInt, weightedRandom } from '../util/rng.js';
import { at } from '../util/assert.js';
import { ShipClass, shipClassProfiles, type NameTemplate } from '../util/types.js';

const NOUNS = [
    "Horizon", "Meridian", "Aurora", "Solstice", "Nebula", "Zenith", "Vanguard",
    "Wanderer", "Voyager", "Comet", "Eclipse", "Odyssey", "Pathfinder", "Beacon",
    "Drift", "Tideway", "Ember", "Frontier", "Passage", "Current", "Compass",
    "Lantern", "Reach", "Solace", "Cascade", "Longshot", "Driftwood", "Waystone",
];

const ADJECTIVES = [
    "Silent", "Restless", "Distant", "Golden", "Iron", "Northern", "Last",
    "Lucky", "Quiet", "Bold", "Stray", "Faded", "Steady", "Wandering",
    "Crimson", "Hollow", "Loyal", "Weathered", "Fleeting", "Patient",
];

// First names for the classic "named-after-a-person" registry convention
// (e.g. "SS Elena"). Deliberately generic/invented — not a reference to any
// real or fictional person.
const PERSON_NAMES = [
    "Elena", "Marcus", "Junko", "Idris", "Nadia", "Otto", "Priya", "Solomon",
    "Ingrid", "Kwame", "Yusuf", "Freya", "Dali", "Anya", "Desmond", "Rosalind",
];

const ROMAN_NUMERALS = ["II", "III", "IV", "V", "VI", "VII"];

// Avoid I/O in serials — they read as 1/0 when stenciled on a hull.
const SERIAL_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ".split('');

const randomFrom = <T>(rng: Rng, items: readonly T[]): T =>
    at(items, randInt(rng, 0, items.length - 1));

function randomSerial(rng: Rng): string {
    const letters = `${randomFrom(rng, SERIAL_LETTERS)}${randomFrom(rng, SERIAL_LETTERS)}`;
    const digits = randInt(rng, 1000, 9999);
    return `${letters}-${digits}`;
}

function buildName(rng: Rng, template: NameTemplate, prefix: string): string {
    switch (template) {
        case 'registry':
            return `${prefix} ${randomFrom(rng, NOUNS)}`;
        case 'adjNoun':
            return `${prefix} ${randomFrom(rng, ADJECTIVES)} ${randomFrom(rng, NOUNS)}`;
        case 'personal':
            return `${prefix} ${randomFrom(rng, PERSON_NAMES)}`;
        case 'numbered':
            return `${randomFrom(rng, NOUNS)} ${randomFrom(rng, ROMAN_NUMERALS)}`;
        case 'serial':
            return randomSerial(rng);
        default: {
            // Exhaustiveness guard — TS will flag this if NameTemplate ever
            // grows a case that buildName doesn't handle.
            const _exhaustive: never = template;
            throw new Error(`Unhandled name template: ${_exhaustive}`);
        }
    }
}

export function generateShipName(rng: Rng, shipClass: ShipClass): string {
    const profile = shipClassProfiles[shipClass];
    const template = weightedRandom<NameTemplate>(rng, profile.templateWeights);
    const prefix = randomFrom(rng, profile.registryPrefixes);
    return buildName(rng, template, prefix);
}
