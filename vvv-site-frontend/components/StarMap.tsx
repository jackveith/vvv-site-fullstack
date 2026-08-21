// app/components/StarMap.tsx
'use client';

import { useEffect, useRef } from 'react';

type StarSystem = {
    id: string;
    name: string;
    x: number;
    y: number;
    z: number;
    radius: number;
    brightness: number;
    color: string;
};

type StarLane = {
    id: string;
    fromId: string;
    toId: string;
    distance: number;
}

type BackgroundStar = {
    x: number;
    y: number;
    radius: number;
    brightness: number;
}

export default function StarMap({ systems, starlanes }: { systems: StarSystem[]; starlanes: StarLane[]; }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const systemsRef = useRef(systems);
    const starlanesRef = useRef(starlanes);
    const drawRef = useRef<() => void>(() => { });

    useEffect(() => {
        systemsRef.current = systems;
        starlanesRef.current = starlanes;
        drawRef.current();
    }, [systems, starlanes]);

    useEffect(() => {

        //create the canvas/retrieve parent div node
        const canvas = canvasRef.current;
        const parent = canvas?.parentElement;
        if (!canvas || !parent) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let domWidth: number, domHeight: number;

        //globals
        //CAMERA - canvas is translated by the "location" of the camera.
        //camera.x/y is the top left world space point of the canvas.
        const camera = { x: -window.innerWidth / 2, y: -window.innerHeight / 2, zoom: 1 };
        const MIN_ZOOM = 0.15;
        const MAX_ZOOM = 8;
        let dragging = false;
        let lastX = 0, lastY = 0;

        //starmap related
        let backgroundStars: BackgroundStar[] = [];
        const systemById = new Map(systems.map((s) => [s.id, s]));

        function generateBackgroundStars(cssWidth: number, cssHeight: number) {
            const rand = (min: number, max: number) => min + Math.random() * (max - min);
            const density = 0.00025; // stars per square css-pixel
            const count = Math.round(cssWidth * cssHeight * density);

            backgroundStars = Array.from({ length: count }, (): BackgroundStar => ({
                x: rand(0, cssWidth),
                y: rand(0, cssHeight),
                radius: rand(0.3, 1.1),
                brightness: rand(0.15, 0.6)
            }));
        }

        function screenToWorld(screenX: number, screenY: number) {
            return {
                x: camera.x + screenX / camera.zoom,
                y: camera.y + screenY / camera.zoom
            };
        }


        //CAMERA PAN/ZOOM LISTENERS
        const handleMouseDown = ((e: MouseEvent) => {
            dragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            canvas.style.cursor = 'grabbing';
        });
        const handleMouseUp = (() => {
            dragging = false;
            canvas.style.cursor = 'grab';
        });
        const handleMouseMove = ((e: MouseEvent) => {
            if (!dragging) return;
            camera.x -= (e.clientX - lastX) / camera.zoom;
            camera.y -= (e.clientY - lastY) / camera.zoom;
            lastX = e.clientX;
            lastY = e.clientY;
            draw();
        });
        const handleWheel = ((e: WheelEvent) => {
            e.preventDefault();

            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;

            const before = screenToWorld(screenX, screenY);

            // Exponential feels smoother than linear across a wide zoom range.
            const zoomIntensity = 0.0015;
            const factor = Math.exp(-e.deltaY * zoomIntensity);
            camera.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.zoom * factor));

            // Re-solve camera.x/y so `before` still lands under the cursor.
            camera.x = before.x - screenX / camera.zoom;
            camera.y = before.y - screenY / camera.zoom;

            draw();
        });
        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        canvas.style.cursor = 'grab';


        //RESIZE HANDLING - called once at start and every time parent container is resized
        function resizeCanvas() {
            const dpr = window.devicePixelRatio || 1;
            const rect = parent!.getBoundingClientRect();

            canvas!.width = Math.round(rect.width * dpr);
            canvas!.height = Math.round(rect.height * dpr);
            canvas!.style.width = rect.width + 'px';
            canvas!.style.height = rect.height + 'px';

            // Reset (not compound) the transform each resize, then apply only
            // the DPR correction. No world-to-container scaling here.
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
            domWidth = rect.width;
            domHeight = rect.height;

            generateBackgroundStars(domWidth, domHeight);
            draw();
        }

        //MAIN DRAW - called every frame
        function draw() {
            const systems = systemsRef.current;
            const dpr = window.devicePixelRatio || 1;


            //new star drawing code - just draw the stars in their actual world coordinates
            ctx!.clearRect(0, 0, domWidth, domHeight);
            ctx!.fillStyle = '#05070d';
            ctx!.fillRect(0, 0, domWidth, domHeight);

            //draw backgroundStars before transforms
            for (const star of backgroundStars) {
                ctx!.beginPath();
                ctx!.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx!.fillStyle = `rgba(255,255,255, ${star.brightness})`;
                ctx!.fill();
            }

            //camera pan and zoom tranforms
            ctx!.save();
            ctx!.scale(camera.zoom, camera.zoom);
            ctx!.translate(-camera.x, -camera.y);

            if (systems.length === 0) return;
            for (const star of systems) {
                ctx!.beginPath();
                ctx!.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx!.fillStyle = star.color || `rgba(255,255,255,${star.brightness})`;
                ctx!.fill();

                //labelling systems
                // if (star.label) {
                //     ctx!.fillStyle = 'rgba(207,214,230,0.85)';
                //     ctx!.font = '12px system-ui, sans-serif';
                //     ctx!.fillText(star.label, star.x + star.radius + 6, star.y + 4);
                // }
            }

            for (const lane of starlanes) {
                const from = systemById.get(lane.fromId);
                const to = systemById.get(lane.toId);
                if (!from || !to) continue;

                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const dist = Math.hypot(dx, dy);
                if (dist === 0) continue;

                const ux = dx / dist;
                const uy = dy / dist;

                // pull each end in by that star's radius so the line starts/ends
                // at the edge of the circle, not the center
                const startX = from.x + ux * from.radius * 1.5;
                const startY = from.y + uy * from.radius * 1.5;
                const endX = to.x - ux * to.radius * 1.5;
                const endY = to.y - uy * to.radius * 1.5;

                ctx!.strokeStyle = `rgba(240,240,240, .8)`;
                ctx!.beginPath();
                ctx!.moveTo(startX, startY);
                ctx!.lineTo(endX, endY);
                ctx!.stroke();
            }


            ctx!.restore();
        }
        drawRef.current = draw;

        resizeCanvas();

        // Redraw whenever the container's actual rendered size changes
        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(parent);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('wheel', handleWheel);
            resizeObserver.disconnect();
        }
    }, []);

    return <canvas ref={canvasRef} className="block flex-1 w-full h-full min-h-0" />;
}
