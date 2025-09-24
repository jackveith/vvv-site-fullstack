"use client"

import { useEffect, useRef } from 'react';
import Image from "next/image";

import Delaunator from 'delaunator';

const POINT_COUNT = 30;
const MOVE_RADIUS = 18;
const MAX_EDGE_LEN = 160;

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
        this.radius = isEdge ? MOVE_RADIUS * (0.5 + 1.0 * Math.random()) : 0;

        //movement
        this.ax = Math.random() * 2 * Math.PI;
        this.ay = Math.random() * 2 * Math.PI;
        this.vx = 0.0005 + Math.random() * 0.002;
        this.vy = 0.0005 + Math.random() * 0.002;
    }

    update(t: number) {
        const nx = Math.sin(t * this.vx + this.ax);
        const ny = Math.sin(t * this.vy + this.ay);

        this.x = this.baseX + nx * this.radius;
        this.y = this.baseY + ny * this.radius;
    }
}

const initPoints = (w: number, h: number, points: Point[]) => {

    points.length = 0;
    console.log("init");

    for (let i = 0; i < POINT_COUNT; i++) {
        const bx = Math.random() * w;
        const by = Math.random() * h;
        points.push(new Point(bx, by));
    }

    const edgePointsW = 5;
    const edgeStepW = w / edgePointsW;

    for (let bx = 0; bx <= w; bx += edgeStepW) {
        points.push(new Point(bx, 0, true));
        points.push(new Point(bx, h, true));
    }

    const edgePointsH = 9;
    const edgeStepH = h / edgePointsH;

    for (let by = 0; by <= w; by += edgeStepH) {
        points.push(new Point(0, by, true));
        points.push(new Point(w, by, true));
    }

    return points;
}

export default function Home() {

    const leftCanvasRef = useRef<HTMLCanvasElement>(null);
    const rightCanvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {

        let leftPoints: Point[] = [];
        let rightPoints: Point[] = [];
        let frameId: number;


        const draw = (canvas: HTMLCanvasElement | null, t: number, points: Point[]) => {

            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            //context exists


            //init points
            if (points.length === 0) {
                points = initPoints(canvas.clientWidth, canvas.clientHeight, points);
            }

            //if w/h changed, resize and reinit points
            const displayWidth = canvas.clientWidth;
            const displayHeight = canvas.clientHeight;
            if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
                canvas.width = displayWidth;
                canvas.height = displayHeight;

                points = initPoints(displayWidth, displayHeight, points);
            }

            ctx.clearRect(0, 0, displayWidth, displayHeight);

            //update pts
            for (const p of points) {
                p.update(t);
            }

            const delaunay = Delaunator.from(points.map(p => [p.x, p.y]));
            const triangles = delaunay.triangles;


            ctx.lineWidth = 0.8;

            for (let i = 0; i < triangles.length; i += 3) {

                //find points of this triangle
                const ia = triangles[i], ib = triangles[i + 1], ic = triangles[i + 2];
                const a = points[ia], b = points[ib], c = points[ic];

                //compute centroid (avg x, y)
                const cx = (a.x + b.x + c.x) / 3;
                const cy = (a.y + b.y + c.y) / 3;

                const hue = Math.round((cx / displayWidth) * 360);
                const sat = 55 + Math.round((cy / displayHeight) * 20);
                const light = 45;
                const alpha = 0.9;

                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.lineTo(c.x, c.y);
                ctx.closePath();

                ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%, ${alpha})`;
                ctx.fill();

                ctx.strokeStyle = `rgba(255,255,255,${0.04 + 0.02 * Math.random()})`;
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

    }, []);

    return (

        <div className="font-sans grid grid-rows-[20px_1fr_20px] grid-cols-[auto_1fr_auto] min-h-screen" >
            <canvas ref={leftCanvasRef} className="row-span-3 col-start-1 w-[15vw] h-full" />
            <canvas ref={rightCanvasRef} className="row-span-3 col-start-3 w-[15vw] h-full" />
            <main className="flex flex-col gap-[32px] col-start-2 h-full items-center sm:items-start">
            </main>
        </div>
    )
};
