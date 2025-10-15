"use client"

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

import Delaunator from 'delaunator';


const MOVE_RADIUS = 18;

class Point {

    baseX: number;
    baseY: number;
    x: number;
    y: number;
    radius: number;
    ax: number;
    ay: number;
    vx: number;
    vy: number;

    constructor(x: number, y: number, isEdge?: boolean) {
        this.baseX = x;
        this.baseY = y;
        //curr pos
        this.x = x;
        this.y = y;

        //nonoscillating edge points
        this.radius = isEdge ? 0 : MOVE_RADIUS * (0.5 + 1.0 * Math.random());

        //movement
        this.ax = Math.random() * 2 * Math.PI;
        this.ay = Math.random() * 2 * Math.PI;
        this.vx = 0.0001 + Math.random() * 0.0003;
        this.vy = 0.0001 + Math.random() * 0.0003;
    }

    update(t: number) {
        const nx = Math.sin(t * this.vx + this.ax);
        const ny = Math.sin(t * this.vy + this.ay);

        this.x = this.baseX + nx * this.radius;
        this.y = this.baseY + ny * this.radius;
    }
}

interface DelaunayConfigOptions {

    pointAreaProportion?: number;
    dimension?: number;
    radius?: number;
    tries?: number;
}

class DelaunayConfig {

    pointAreaProportion?: number;
    dimension?: number;
    radius?: number;
    tries?: number;

    constructor(opts: DelaunayConfigOptions) {
        const defaults = {
            pointAreaProportion: 0.2,
            dimension: 2,
            radius: 50,
            tries: 30
        };

        Object.assign(this, { ...defaults, opts });
    }
}

class DelaunayCanvas {
    w: number;
    h: number;
    canvas: HTMLCanvasElement;
    points: Point[];

    pointAreaProportion!: number;
    dimension!: number;
    radius!: number;
    tries!: number;

    constructor(w: number, h: number, canvas: HTMLCanvasElement | null, pointsRef: Point[], conf: DelaunayConfig = {}) {
        this.w = w;
        this.h = h;
        if (!canvas) { throw new Error("Bad Delaunay canvas reference.") }
        this.canvas = canvas;
        this.points = pointsRef;

        const defaults = {
            pointAreaProportion: 0.2,
            dimension: 2,
            radius: 50,
            tries: 30
        };

        Object.assign(this, { ...defaults, ...conf });


        //initPoints call?

    }


}


const initPoints = (w: number, h: number, points: Point[]) => {

    //canvas and pointArea model: pointArea is a larger rectangular area
    //around the canvas with the same centroid that is bigger by some proportion
    const pointAreaBufferProportion = 0.2;

    const canvasW = w, canvasH = h;
    const wPad = w * (pointAreaBufferProportion / 2), hPad = h * (pointAreaBufferProportion / 2);
    w = w * (1 + pointAreaBufferProportion);
    h = h * (1 + pointAreaBufferProportion);

    points.length = 0;

    //Bridson's Poisson Disk Sampling
    //https://sighack.com/post/poisson-disk-sampling-bridsons-algorithm

    //BPDS helper functions
    const distance2d = (x1: number, y1: number, x2: number, y2: number) => {
        return (Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2)));
    }
    const insertPoint = (grid: [number, number][][], cellSize: number, point: [number, number]) => {
        const xi = Math.floor(point[0] / cellSize);
        const yi = Math.floor(point[1] / cellSize);
        grid[xi][yi] = point;
    }
    const isValidPoint = (grid: [number, number][][], cellSize: number, gridW: number, gridH: number, point: [number, number], r: number) => {
        const px = point[0], py = point[1];

        if (px < 0 || px >= w || py < 0 || py >= h) return false;

        //point's grid coords
        const xi = Math.floor(px / cellSize), yi = Math.floor(py / cellSize);
        //indices for surrounding cells
        const i0 = Math.max(xi - 1, 0), j0 = Math.max(yi - 1, 0);
        const i1 = Math.min(xi + 1, gridW - 1), j1 = Math.min(yi + 1, gridH - 1);

        for (let i = i0; i <= i1; i++) {
            for (let j = j0; j <= j1; j++) {
                if (grid[i][j]) {
                    //check if point is sufficiently far from adj. points
                    const gpx = grid[i][j][0], gpy = grid[i][j][1];
                    if (distance2d(gpx, gpy, px, py) < r) return false;
                }
            }
        }
        return true;
    }
    //end BPDS helper functions

    const dim = 2;
    const r = 54;
    const tries = 30;
    const cellSize = Math.floor(r / Math.sqrt(dim));
    const ncellsW = Math.ceil(w / cellSize) + 1;
    const ncellsH = Math.ceil(h / cellSize) + 1;
    const grid: [number, number][][] = Array.from({ length: ncellsW }, () => Array(ncellsH).fill(null));
    const primitivePoints: [number, number][] = [];
    const activePoints: [number, number][] = [];

    //starting point, distributed randomly
    const p0: [number, number] = [Math.random() * w, Math.random() * h];
    insertPoint(grid, cellSize, p0);
    primitivePoints.push(p0);
    activePoints.push(p0);

    //try to generate a new point until no activePoints left
    while (activePoints.length > 0) {
        const randomIndex = Math.floor(Math.random() * activePoints.length);
        const [rpx, rpy] = activePoints[randomIndex];

        let found: boolean = false;
        //compute coords of new point at random angle/dist
        for (let t = 0; t < tries; t++) {
            const theta: number = Math.random() * 360;
            const radians: number = (theta * Math.PI) / 180;
            const newRadius: number = Math.random() * r + r;
            const newX = rpx + newRadius * Math.cos(radians);
            const newY = rpy + newRadius * Math.sin(radians);

            //if this new point not Valid -> try next point
            if (!isValidPoint(grid, cellSize, ncellsW, ncellsH, [newX, newY], r)) continue;

            //if valid push to all arrays
            insertPoint(grid, cellSize, [newX, newY]);
            primitivePoints.push([newX, newY]);
            activePoints.push([newX, newY]);

            found = true;
            break;
        }

        //remove this active point if no valid adj. points found
        if (!found) { activePoints.splice(randomIndex, 1) }
    }

    //push all primitivePoints as Point objects
    for (const [px, py] of primitivePoints) {
        //oversized point grid is aligned with canvas topleft corner,
        //so adjust all points up and left
        points.push(new Point(px - wPad, py - hPad));
    }
    //end Poisson Disk sampling

    //static edge points
    const edgePointsW = 25;
    const edgeStepW = w / edgePointsW;

    for (let bx = (0 - wPad); bx <= w; bx += edgeStepW) {
        points.push(new Point(bx, -hPad, true));
        points.push(new Point(bx, h - hPad, true));
    }

    const edgePointsH = 49;
    const edgeStepH = h / edgePointsH;

    for (let by = (0 - hPad); by <= h; by += edgeStepH) {
        points.push(new Point(-wPad, by, true));
        points.push(new Point(w - wPad, by, true));
    }

    return points;
}
