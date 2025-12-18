import { useEffect, useState } from 'react';

type MaskedFlashlightOverlayProps = {
  enabled: boolean;
  radiusPx?: number;
  /** Percentage (0-100) where the transparent region ends and fade begins */
  softEdgePercent?: number;
  zIndexClassName?: string;
};

export const MaskedFlashlightOverlay = ({
  enabled,
  radiusPx = 150,
  softEdgePercent = 10,
  zIndexClassName = 'z-[9998]'
}: MaskedFlashlightOverlayProps) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    if (enabled) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled]);

  if (!enabled) return null;

  const mask = `radial-gradient(circle ${radiusPx}px at ${mousePos.x}px ${mousePos.y}px, transparent ${softEdgePercent}%, black 100%)`;

  return (
    <div
      className={`fixed inset-0 pointer-events-none bg-black transition-opacity duration-500 ${zIndexClassName}`}
      style={{
        maskImage: mask,
        WebkitMaskImage: mask
      }}
    >
      <div className="absolute inset-0 bg-black"></div>
    </div>
  );
};


