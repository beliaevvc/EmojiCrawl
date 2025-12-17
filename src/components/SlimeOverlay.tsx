import { useState, useEffect, useRef } from 'react';

export const SlimeOverlay = () => {
    const [isActive, setIsActive] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const colsRef = useRef<number[]>([]);
    const keySequenceRef = useRef('');

    // Secret Code Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keySequenceRef.current = (keySequenceRef.current + e.key).slice(-10).toUpperCase();
            
            if (keySequenceRef.current.includes('SLIME')) {
                setIsActive(true);
                keySequenceRef.current = '';
            }
            if (keySequenceRef.current.includes('CLEAN')) {
                setIsActive(false);
                keySequenceRef.current = '';
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Slime Simulation
    useEffect(() => {
        if (!isActive) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Init columns
        const colWidth = 10; // Resolution of drips
        const initCols = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const numCols = Math.ceil(canvas.width / colWidth);
            // Preserve existing slime if resizing, else init 0
            if (colsRef.current.length === 0) {
                colsRef.current = new Array(numCols).fill(0);
            } else if (colsRef.current.length !== numCols) {
                // Resize array safely
                const newCols = new Array(numCols).fill(0);
                for (let i = 0; i < Math.min(colsRef.current.length, numCols); i++) {
                    newCols[i] = colsRef.current[i];
                }
                colsRef.current = newCols;
            }
        };

        initCols();
        window.addEventListener('resize', initCols);

        // Mouse interaction
        const handleMouseMove = (e: MouseEvent) => {
            const mx = e.clientX;
            const my = e.clientY;
            const radius = 40; // Size of the "wiper"

            // Determine affected columns
            const startCol = Math.floor((mx - radius) / colWidth);
            const endCol = Math.floor((mx + radius) / colWidth);

            for (let i = startCol; i <= endCol; i++) {
                if (i >= 0 && i < colsRef.current.length) {
                    // Check horizontal distance exact to be circular eraser
                    const colX = i * colWidth + colWidth / 2;
                    const dist = Math.abs(colX - mx);
                    
                    if (dist < radius) {
                        // Calculate how high we can wipe (circular shape)
                        // y^2 = r^2 - x^2
                        const yOffset = Math.sqrt(radius * radius - dist * dist);
                        const wipeHeight = my - yOffset; // Top of the circle at this x
                        
                        // "Clean" the slime: reduce height to the wiper level
                        // But we only wipe UP (remove slime below). So if slime is at 500, and wiper is at 300, slime becomes 300.
                        // Actually, wiper cleans everything inside it.
                        // Simple logic: Limit slime height to the TOP of the wiper circle.
                        if (colsRef.current[i] > wipeHeight) {
                             colsRef.current[i] = Math.max(0, wipeHeight);
                        }
                    }
                }
            }
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Animation Loop
        const animate = () => {
            if (!canvas || !ctx) return;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Update Slime Logic
            // 1. Random Growth
            const numGrowth = Math.floor(colsRef.current.length / 5); // Grow 20% of cols per frame
            for (let k = 0; k < numGrowth; k++) {
                const idx = Math.floor(Math.random() * colsRef.current.length);
                // Grow faster if short, slower if long? Or just linear dripping
                colsRef.current[idx] += Math.random() * 2 + 0.5;
            }
            
            // 2. Smoothing (Diffusion) - makes it look like liquid, not bars
            // Simple blur pass: col[i] = average(col[i-1], col[i], col[i+1])
            const smoothed = [...colsRef.current];
            for (let i = 1; i < colsRef.current.length - 1; i++) {
                smoothed[i] = (colsRef.current[i-1] + colsRef.current[i] * 2 + colsRef.current[i+1]) / 4;
            }
            colsRef.current = smoothed;

            // Draw Slime
            ctx.fillStyle = '#84cc16'; // Lime-500
            ctx.shadowColor = '#4d7c0f'; // Lime-700
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(0, 0);

            for (let i = 0; i < colsRef.current.length; i++) {
                const x = i * colWidth;
                const y = colsRef.current[i];
                // Draw curve to next point
                // ctx.lineTo(x, y); 
                // Better: quadratic curve for smoothness
                const nextX = (i + 1) * colWidth;
                const nextY = colsRef.current[i + 1] || y;
                const midX = (x + nextX) / 2;
                const midY = (y + nextY) / 2;
                
                ctx.quadraticCurveTo(x, y, midX, midY);
            }
            
            ctx.lineTo(canvas.width, 0);
            ctx.closePath();
            ctx.fill();

            // Add some "highlights" or drops?
            // Optional: Draw explicit drops at local maxima
            
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', initCols);
            window.removeEventListener('mousemove', handleMouseMove);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isActive]);

    if (!isActive) return null;

    return (
        <canvas 
            ref={canvasRef}
            className="fixed inset-0 z-[8000] pointer-events-none opacity-90 mix-blend-normal"
        />
    );
};

