
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
