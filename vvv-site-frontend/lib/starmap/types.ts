
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

export type ShipStatus = 'DOCKED' | 'IN_TRANSIT';

export type Ship = {
    id: string;
    name: string;
    status: ShipStatus;
    // docked ships resolve position via currentSystemId; in-transit ships
    // (once travel is implemented) will interpolate between systems using
    // destinationSystemId/departedAt/arrivesAt instead.
    currentSystemId: string | null;
    destinationSystemId: string | null;
    departedAt: string | null; // ISO date string over JSON
    arrivesAt: string | null;
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
