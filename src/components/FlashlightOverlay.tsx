import { useState, useEffect, useRef } from 'react';
import { isFlashlightLocked } from '../utils/flashlightLock';
import { MaskedFlashlightOverlay } from './MaskedFlashlightOverlay';

export const FlashlightOverlay = () => {
    const [flashlightMode, setFlashlightMode] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const keySequenceRef = useRef('');

    // Lock listener (used by curse "Тьма" to disable Lumos/Nox)
    useEffect(() => {
        setIsLocked(isFlashlightLocked());
        const handleLock = (e: CustomEvent<boolean>) => {
            const locked = Boolean(e.detail);
            setIsLocked(locked);
            if (locked) {
                // Force-disable any active flashlight while locked.
                setFlashlightMode(false);
                keySequenceRef.current = '';
            }
        };
        window.addEventListener('flashlight-lock-changed', handleLock as EventListener);
        return () => window.removeEventListener('flashlight-lock-changed', handleLock as EventListener);
    }, []);

    // Custom Event Listener
    useEffect(() => {
        const handleToggle = (e: CustomEvent<boolean>) => {
            if (isFlashlightLocked()) return;
            setFlashlightMode(e.detail);
        };
        window.addEventListener('toggle-flashlight', handleToggle as EventListener);
        return () => window.removeEventListener('toggle-flashlight', handleToggle as EventListener);
    }, []);

    // Secret Codes Listener (Lumos/Nox)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isFlashlightLocked()) return;
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

    if (!flashlightMode || isLocked) return null;

    return <MaskedFlashlightOverlay enabled={flashlightMode} radiusPx={150} softEdgePercent={10} zIndexClassName="z-[9998]" />;
};

