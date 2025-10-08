"use client"

import { useEffect, useRef } from 'react';
import { ContactCard } from '@/components/ui/contact-card'
import { Send, CodeXml, Handshake } from 'lucide-react'
import { useTheme } from 'next-themes'

import Delaunator from 'delaunator';

const POINT_COUNT = 120;
const MOVE_RADIUS = 18;
const MAX_EDGE_LEN = 160;

const canvasWidthProportion = 0.15;
let canvasTargetWidth = 0;
let canvasTargetHeight = 0;

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
        this.vx = 0.0001 + Math.random() * 0.0005;
        this.vy = 0.0001 + Math.random() * 0.0005;
    }

    update(t: number) {
        const nx = Math.sin(t * this.vx + this.ax);
        const ny = Math.sin(t * this.vy + this.ay);

        this.x = this.baseX + nx * this.radius;
        this.y = this.baseY + ny * this.radius;
    }
}

const handleResize = () => {

    //retrieve current layout component heights for canvasTargetHeight calc
    const headerH: number = document.querySelector('header')?.offsetHeight ?? 76;
    const footerH: number = document.querySelector('footer')?.offsetHeight ?? 60;

    canvasTargetHeight = Math.ceil(window.innerHeight - headerH - footerH);
    canvasTargetWidth = Math.ceil(canvasWidthProportion * window.innerWidth);
}

const initPoints = (w: number, h: number, points: Point[]) => {

    //define how large the area in which the points will be generated in will be proportional to the canvas display W/H
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

const lerpHSL = (color1: [number, number, number], color2: [number, number, number], fold: number): string => {
    const [h1, s1, l1] = color1;
    const [h2, s2, l2] = color2;

    let dh = h2 - h1;
    if (dh > 180) dh -= 360;
    if (dh < -180) dh += 360;

    const h = (h1 + dh * fold + 360) % 360;
    const s = s1 + (s2 - s1) * fold;
    const l = l1 + (l2 - l1) * fold;

    return `hsl(${h}, ${s}%, ${l}%)`;

}

const lerpHSLSlatePurple = (fold: number): string => {
    return lerpHSL([220, 15, 10], [268, 43, 56], fold);
}
const lerpHSLCreamPurple = (fold: number): string => {
    return lerpHSL([45, 17, 95], [268, 43, 56], fold);
}

const mapToTriangleWave = (t: number): number => {
    return t <= .5 ? t * 2 : (1 - t) * 2;
}

export default function Home() {

    const { resolvedTheme } = useTheme();

    const leftCanvasRef = useRef<HTMLCanvasElement>(null);
    const rightCanvasRef = useRef<HTMLCanvasElement>(null);


    useEffect(() => {

        if (!resolvedTheme) return;

        const leftPoints: Point[] = [];
        const rightPoints: Point[] = [];
        let frameId: number;

        window.addEventListener('resize', handleResize);
        handleResize();

        const draw = (canvas: HTMLCanvasElement | null, t: number, points: Point[]) => {

            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            //context exists

            //init points
            if (points.length === 0) {
                points = initPoints(canvasTargetWidth, canvasTargetHeight, points);
            }

            //if w/h changed, resize and reinit points
            if (canvas.height != canvasTargetHeight || canvas.width != canvasTargetWidth) {
                canvas.width = canvasTargetWidth;
                canvas.height = canvasTargetHeight;

                points = initPoints(canvasTargetWidth, canvasTargetHeight, points);
            }


            ctx.clearRect(0, 0, canvasTargetWidth, canvasTargetHeight);

            //update pts
            for (const p of points) {
                p.update(t);
            }

            const delaunay = Delaunator.from(points.map(p => [p.x, p.y]));
            const triangles = delaunay.triangles;


            ctx.lineWidth = 0.8;
            //color fill and stroke based on theme
            const themedFillStyle = resolvedTheme === 'dark' ? lerpHSLSlatePurple : lerpHSLCreamPurple;
            const themedStrokeStyle = resolvedTheme === 'dark' ? `rgba(18, 18, 18, 0.05)` : `rgba(255, 255, 255, 0.05)`;

            for (let i = 0; i < triangles.length; i += 3) {

                //find points of this triangle
                const ia = triangles[i], ib = triangles[i + 1], ic = triangles[i + 2];
                const a = points[ia], b = points[ib], c = points[ic];

                //compute centroid (avg x, y)
                const cx = (a.x + b.x + c.x) / 3;
                const cy = (a.y + b.y + c.y) / 3;

                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.lineTo(c.x, c.y);
                ctx.closePath();

                const normalizedY = cy / canvasTargetHeight;
                const triangleFoldedY = mapToTriangleWave(normalizedY);
                ctx.fillStyle = themedFillStyle(triangleFoldedY);
                ctx.fill();

                ctx.strokeStyle = themedStrokeStyle;
                ctx.stroke();

            }
        };

        const loop = (time: number) => {

            draw(leftCanvasRef.current, time, leftPoints);
            draw(rightCanvasRef.current, time, rightPoints);

            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(frameId);

    }, [resolvedTheme]);

    return (

        <div className="font-sans grid grid-rows-[20px_1fr_20px] grid-cols-[auto_1fr_auto] h-full">
            <canvas ref={leftCanvasRef} className="row-span-3 col-start-1 w-[15vw] h-full flex-1" />
            <canvas ref={rightCanvasRef} className="row-span-3 col-start-3 w-[15vw] h-full flex-1" />
            <div className="flex flex-col gap-[32px] col-start-2 h-full items-center justify-items-center">
                <ContactCard icon={Send} label='Email' href='mailto:jackveith28@gmail.com' linktext='a' />
                <ContactCard icon={CodeXml} label='Github' href='https://github.com/jackveith' linktext='b' />
                <ContactCard icon={Handshake} label='LinkedIn' href='https://www.linkedin.com/in/jveith/' linktext='c' />
            </div>
        </div>
    )
};
