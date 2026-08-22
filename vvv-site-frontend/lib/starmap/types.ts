
export type StarSystem = {
    id: string;
    name: string;
    x: number;
    y: number;
    z: number;
    radius: number;
    brightness: number;
    color: string;
};

export type StarLane = {
    id: string;
    fromId: string;
    toId: string;
    distance: number;
}

export type BackgroundStar = {
    x: number;
    y: number;
    radius: number;
    brightness: number;
}

//CAMERA - canvas is translated by the "location" of the camera.
//camera.x/y is the top left world space point of the canvas.
export type Camera = {
    x: number;
    y: number;
    zoom: number;
}
