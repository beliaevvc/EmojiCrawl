/**
 * DeckStatItem — маленький HUD-виджет “иконка + число”.
 *
 * Контекст (Блок 3): вынесено из `GameScreen`, чтобы не плодить разметку в панелях.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - отображает число карт определённого типа (монстры/монеты/зелья/…),
 * - визуально “гасит” нулевые значения.
 *
 * Инварианты:
 * - UI-примитив, без логики игры.
 */

export function DeckStatItem({ icon, count, color }: { icon: string; count: number; color: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center w-8 h-10 bg-stone-900/90 border border-stone-700 rounded-md backdrop-blur-sm shadow-sm ${
        count === 0 ? 'opacity-30 grayscale' : ''
      }`}
    >
      <div className="text-sm">{icon}</div>
      <div className={`text-[10px] font-bold ${color}`}>{count}</div>
    </div>
  );
}


