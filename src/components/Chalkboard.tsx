import { useRef, useEffect, useState } from 'react';

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

    // Attach global listeners to capture events everywhere
    useEffect(() => {
        const handlePointerDown = (e: PointerEvent) => {
            // Left click only
            if (e.button !== 0) return;
            
            setIsDrawing(true);
            const point = { x: e.clientX, y: e.clientY };
            setStrokes(prev => [...prev, { points: [point], timestamp: Date.now(), opacity: 1 }]);
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (!isDrawing) return;
            
            const point = { x: e.clientX, y: e.clientY };
            setStrokes(prev => {
                const last = prev[prev.length - 1];
                if (!last) return prev;
                
                const lastPoint = last.points[last.points.length - 1];
                const dist = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
                if (dist < 5) return prev;

                return [
                    ...prev.slice(0, -1),
                    { ...last, points: [...last.points, point] }
                ];
            });
        };

        const handlePointerUp = () => {
            setIsDrawing(false);
        };

        // We listen on window to catch everything
        // But this might block scrolling if we prevent default? 
        // We won't prevent default, so buttons still work.
        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        return () => {
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [isDrawing]);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <canvas 
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
            />
        </div>
    );
};
