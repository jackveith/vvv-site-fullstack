// app/components/StarMap.tsx
'use client';

import { useEffect, useRef } from 'react';

type StarSystem = {
    id: string;
    name: string;
    x: number;
    y: number;
    z: number;
};

export default function StarMap({ systems }: { systems: StarSystem[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);


    useEffect(() => {
        const canvas = canvasRef.current;
        const parent = canvas?.parentElement;
        if (!canvas || !parent) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        //camera - canvas is translated by the "location" of the camera.
        //camera.x/y is the top left world space point of the canvas.
        const camera = { x: -window.innerWidth / 2, y: -window.innerHeight / 2 };
        //camera panning variables and listeners
        let dragging = false;
        let lastX = 0, lastY = 0;

        canvas.addEventListener('mousedown', (e) => {
            dragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            canvas.style.cursor = 'grabbing';
        });
        window.addEventListener('mouseup', () => {
            dragging = false;
            canvas.style.cursor = 'grab';
        });
        window.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            camera.x -= (e.clientX - lastX);
            camera.y -= (e.clientY - lastY);
            lastX = e.clientX;
            lastY = e.clientY;
            draw();
        });
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

            draw();
        }

        //MAIN DRAW - called every frame
        function draw() {
            const dpr = window.devicePixelRatio || 1;
            const { width, height } = parent!.getBoundingClientRect();

            // Backing pixel buffer scaled for rendering on high-DPI screens
            canvas!.width = Math.round(width * dpr);
            canvas!.height = Math.round(height * dpr);
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

            // Background
            ctx!.clearRect(0, 0, width, height);
            ctx!.fillStyle = '#141217';
            ctx!.fillRect(0, 0, width, height);

            if (systems.length === 0) return;

            //new star drawing code - just draw the stars in their actual world coordinates
            ctx!.clearRect(0, 0, width, height);
            ctx!.fillStyle = '#05070d';
            ctx!.fillRect(0, 0, width, height);

            ctx!.save();
            ctx!.translate(-camera.x, -camera.y);

            for (const star of systems) {
                ctx!.beginPath();
                ctx!.arc(star.x, star.y, 4, 0, Math.PI * 2);
                ctx!.fillStyle = `rgba(255,255,255,1)`;
                ctx!.fill();

                //labelling systems
                // if (star.label) {
                //     ctx!.fillStyle = 'rgba(207,214,230,0.85)';
                //     ctx!.font = '12px system-ui, sans-serif';
                //     ctx!.fillText(star.label, star.x + star.radius + 6, star.y + 4);
                // }
            }
            ctx!.restore();

        }

        resizeCanvas();

        // Redraw whenever the container's actual rendered size changes
        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(parent);

        return () => resizeObserver.disconnect();
    }, [systems]);

    return <canvas ref={canvasRef} className="block flex-1 w-full h-full min-h-0" />;
}
