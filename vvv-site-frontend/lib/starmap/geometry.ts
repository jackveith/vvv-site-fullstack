
import { BackgroundStar, Camera } from "./types";

export function generateBackgroundStars(cssWidth: number, cssHeight: number): BackgroundStar[] {
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const density = 0.00025; // stars per square css-pixel
    const count = Math.round(cssWidth * cssHeight * density);

    const backgroundStars = Array.from({ length: count }, (): BackgroundStar => ({
        x: rand(0, cssWidth),
        y: rand(0, cssHeight),
        radius: rand(0.3, 1.1),
        brightness: rand(0.15, 0.6)
    }));

    return backgroundStars;
}

export function screenToWorld(camera: Camera, screenX: number, screenY: number) {
    return {
        x: camera.x + screenX / camera.zoom,
        y: camera.y + screenY / camera.zoom
    };
}


/**
 * Cheap deterministic string hash (FNV-1a) mapped into [0, 1). Used to give
 * a docked ship a stable-looking orbit angle around its system that doesn't
 * reshuffle every re-render, without needing a seeded RNG on the frontend.
 */
export function hashToUnit(id: string): number {
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) {
        h ^= id.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 10000) / 10000;
}

