import { motion } from 'framer-motion';
import { useEffect } from 'react';

export interface FloatingTextItem {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

export const FloatingTextOverlay = ({ items, onComplete }: { items: FloatingTextItem[], onComplete: (id: string) => void }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
      {items.map((item) => (
        <FloatingNumber key={item.id} item={item} onComplete={onComplete} />
      ))}
    </div>
  );
};

const FloatingNumber = ({ item, onComplete }: { item: FloatingTextItem, onComplete: (id: string) => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(item.id);
    }, 800);
    return () => clearTimeout(timer);
  }, [item.id, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.5 }}
      animate={{ opacity: 1, y: -50, scale: 1.2 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ left: item.x, top: item.y }}
      className={`absolute font-black text-2xl md:text-4xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${item.color}`}
    >
      {item.text}
    </motion.div>
  );
};

