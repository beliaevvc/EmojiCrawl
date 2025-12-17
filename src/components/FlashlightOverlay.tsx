import { useState, useEffect, useRef } from 'react';

export const FlashlightOverlay = () => {
    const [flashlightMode, setFlashlightMode] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const keySequenceRef = useRef('');

    // Custom Event Listener
    useEffect(() => {
        const handleToggle = (e: CustomEvent<boolean>) => {
            setFlashlightMode(e.detail);
        };
        window.addEventListener('toggle-flashlight', handleToggle as EventListener);
        return () => window.removeEventListener('toggle-flashlight', handleToggle as EventListener);
    }, []);

    // Track mouse for flashlight
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        if (flashlightMode) {
            window.addEventListener('mousemove', handleMouseMove);
        }
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [flashlightMode]);

    // Secret Codes Listener (Lumos/Nox)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keySequenceRef.current = (keySequenceRef.current + e.key).slice(-10).toUpperCase();
            
            if (keySequenceRef.current.includes('LUMOS') || keySequenceRef.current.includes('SVET')) {
                setFlashlightMode(true);
                keySequenceRef.current = ''; // Reset
            }
            if (keySequenceRef.current.includes('NOX')) {
                setFlashlightMode(false);
                keySequenceRef.current = '';
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!flashlightMode) return null;

    return (
        <div 
           className="fixed inset-0 z-[9998] pointer-events-none bg-black transition-opacity duration-500"
           style={{
               // Method A: Black div with mask. 
               // Mask creates transparency. So `transparent` in mask = transparent div (shows content). `black` in mask = opaque div (black).
               // We want div to be visible (black) everywhere except mouse.
               // So mask should be transparent at mouse, black elsewhere.
               
               maskImage: `radial-gradient(circle 150px at ${mousePos.x}px ${mousePos.y}px, transparent 10%, black 100%)`,
               WebkitMaskImage: `radial-gradient(circle 150px at ${mousePos.x}px ${mousePos.y}px, transparent 10%, black 100%)`
           }}
       >
            {/* This div covers the screen with black. The mask cuts a hole in it. */}
            <div className="absolute inset-0 bg-black"></div>
       </div>
    );
};

