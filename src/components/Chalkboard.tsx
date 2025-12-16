import React, { useRef, useEffect, useState } from 'react';

interface Point {
    x: number;
    y: number;
}

interface Stroke {
    points: Point[];
    timestamp: number;
    opacity: number;
}

export const Chalkboard = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fade out effect
    useEffect(() => {
        let animationFrame: number;

        const animate = () => {
            const now = Date.now();
            let needsUpdate = false;

            setStrokes(prevStrokes => {
                const updatedStrokes = prevStrokes.map(stroke => {
                    const age = now - stroke.timestamp;
                    if (age > 10000) { // Start fading after 10 seconds
                        const fadeProgress = (age - 10000) / 1000; // Fade over 1 second
                        const newOpacity = Math.max(0, 1 - fadeProgress);
                        if (newOpacity !== stroke.opacity) {
                            needsUpdate = true;
                            return { ...stroke, opacity: newOpacity };
                        }
                    }
                    return stroke;
                }).filter(stroke => stroke.opacity > 0);

                if (prevStrokes.length !== updatedStrokes.length) {
                    needsUpdate = true;
                }
                
                return needsUpdate ? updatedStrokes : prevStrokes;
            });

            animationFrame = requestAnimationFrame(animate);
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, []);

    // Drawing effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize canvas to match window
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Render loop
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            strokes.forEach(stroke => {
                if (stroke.points.length < 2) return;

                ctx.beginPath();
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = 3;
                
                // Chalk style
                ctx.strokeStyle = `rgba(255, 255, 255, ${stroke.opacity * 0.6})`;
                ctx.shadowBlur = 2;
                ctx.shadowColor = `rgba(255, 255, 255, ${stroke.opacity * 0.4})`;

                ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                for (let i = 1; i < stroke.points.length; i++) {
                    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
                }
                ctx.stroke();

                // Add some "dust" noise for chalk effect
                if (Math.random() > 0.5) {
                    ctx.save();
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = `rgba(255, 255, 255, ${stroke.opacity * 0.2})`;
                    ctx.stroke();
                    ctx.restore();
                }
            });
        };

        // We hook into the same animation loop effectively via strokes dependency in useEffect
        // But for smoother drawing, we should render immediately on stroke update?
        // Actually, requestAnimationFrame is better.
        // Let's set up a separate render loop
        let renderFrame: number;
        const loop = () => {
            render();
            renderFrame = requestAnimationFrame(loop);
        }
        loop();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(renderFrame);
        };
    }, [strokes]);

    const handlePointerDown = (e: React.PointerEvent) => {
        // Only draw if we are clicking on the container itself (empty space)
        // or the canvas.
        // We will rely on z-index. The canvas is at the bottom.
        // If an element is above it, it will capture the event.
        setIsDrawing(true);
        const point = { x: e.clientX, y: e.clientY };
        setStrokes(prev => [...prev, { points: [point], timestamp: Date.now(), opacity: 1 }]);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        
        const point = { x: e.clientX, y: e.clientY };
        setStrokes(prev => {
            const last = prev[prev.length - 1];
            if (!last) return prev;
            
            // Optimization: don't add point if too close
            const lastPoint = last.points[last.points.length - 1];
            const dist = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
            if (dist < 5) return prev; // Minimum distance

            return [
                ...prev.slice(0, -1),
                { ...last, points: [...last.points, point] }
            ];
        });
    };

    const handlePointerUp = () => {
        setIsDrawing(false);
    };

    return (
        <div 
            ref={containerRef}
            className="absolute inset-0 z-0 overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <canvas 
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
            />
        </div>
    );
};

