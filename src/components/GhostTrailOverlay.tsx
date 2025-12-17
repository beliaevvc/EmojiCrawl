import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const GhostTrailOverlay = () => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [particles, setParticles] = useState<{id: number, x: number, y: number, char: string, size: number, angle: number}[]>([]);
    
    const lastPos = useRef({ x: 0, y: 0 });
    const lastTime = useRef(0);
    const keySequenceRef = useRef('');

    // Secret Code Listener (Global)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keySequenceRef.current = (keySequenceRef.current + e.key).slice(-10).toUpperCase();
            
            if (keySequenceRef.current.includes('MOUSE')) {
                setIsEnabled(true);
                keySequenceRef.current = '';
            }
            if (keySequenceRef.current.includes('CAT')) {
                setIsEnabled(false);
                setParticles([]); // Clear trail immediately
                keySequenceRef.current = '';
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Particle Spawner Logic
    useEffect(() => {
        if (!isEnabled) return;

        const handleMouseMove = (e: MouseEvent) => {
            const now = Date.now();
            const timeDelta = now - lastTime.current;

            // Limit spawn rate (~60fps cap is fine, but we want density)
            if (timeDelta > 16) { 
                lastPos.current = { x: e.clientX, y: e.clientY };
                lastTime.current = now;
                
                const chars = ['💀', '🔥', '✨', '👻', '💫', '⚡', '👁️'];
                const char = chars[Math.floor(Math.random() * chars.length)];
                
                setParticles(prev => [
                    ...prev, 
                    {
                        id: now + Math.random(),
                        x: e.clientX,
                        y: e.clientY,
                        char,
                        size: 15 + Math.random() * 15, // Fixed small size random range
                        angle: Math.random() * 360
                    }
                ].slice(-50)); // Keep max 50 particles
            }
        };
        
        // Cleanup interval
        const cleanupInterval = setInterval(() => {
            setParticles(prev => prev.filter(p => Date.now() - p.id < 1000));
        }, 100);

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(cleanupInterval);
        };
    }, [isEnabled]);

    return (
        <AnimatePresence>
            {isEnabled && particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 1, scale: 0.5 }}
                    animate={{ opacity: 0, scale: 1.5, y: -20 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="fixed pointer-events-none z-[9999] select-none"
                    style={{
                        left: p.x,
                        top: p.y,
                        fontSize: p.size,
                        transform: `rotate(${p.angle}deg) translate(-50%, -50%)`, // Center at cursor
                        marginLeft: '-0.5em', // Adjust visual centering
                        marginTop: '-0.5em'
                    }}
                >
                    {p.char}
                </motion.div>
            ))}
        </AnimatePresence>
    );
};

