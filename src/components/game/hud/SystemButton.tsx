/**
 * SystemButton — базовая кнопка нижней системной панели.
 *
 * Контекст (Блок 3): вынесено из `GameScreen` как UI-примитив для переиспользования.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - рисует кнопку в едином стиле (фон/бордер/hover/active),
 * - поддерживает состояния `danger` (красный акцент) и `active`.
 *
 * Инварианты:
 * - чистый UI-примитив: не знает ничего про game state.
 */

import React from 'react';

export function SystemButton({
  icon,
  label,
  onClick,
  danger = false,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative group flex items-center gap-3 px-5 py-3 
        backdrop-blur-md border 
        rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 
        transition-all duration-200 overflow-hidden
        ${active ? 'bg-indigo-900/60 border-indigo-500' : 'bg-stone-900/80 border-stone-700'}
        ${danger ? 'hover:border-rose-500/50' : 'hover:border-indigo-500/50'}
      `}
    >
      <div
        className={`
          absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
          bg-gradient-to-r ${danger ? 'from-rose-900/20 to-transparent' : 'from-indigo-900/20 to-transparent'}
        `}
      ></div>

      <div
        className={`
          ${active ? 'text-indigo-200' : 'text-stone-400'}
          ${danger ? 'group-hover:text-rose-400' : 'group-hover:text-indigo-300'} 
          transition-colors
        `}
      >
        {icon}
      </div>
      <span
        className={`
          text-[10px] md:text-xs font-bold tracking-widest uppercase
          ${active ? 'text-indigo-100' : 'text-stone-500'}
          ${danger ? 'group-hover:text-rose-200' : 'group-hover:text-stone-200'} 
          transition-colors
        `}
      >
        {label}
      </span>
    </button>
  );
}


