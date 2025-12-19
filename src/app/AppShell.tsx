/**
 * AppShell — “оболочка” приложения (composition root, Блок 6).
 *
 * Слой: App / Framework (UI composition root).
 *
 * ## Что это
 * Компонент‑контейнер, который оборачивает весь UI приложения.
 * Здесь живут “глобальные” вещи, которые должны работать поверх всех экранов.
 *
 * ## Зачем
 * Раньше в `App.tsx` одновременно жили:
 * - глобальные провайдеры (DnD),
 * - глобальные оверлеи (ghost/slime/flashlight),
 * - devquest‑логика (слушатели keydown/click/mousemove),
 * - dev console и модалки.
 *
 * В Блоке 6 мы выносим это из `App.tsx`, чтобы:
 * - не раздувать `App.tsx`,
 * - подключать/отключать “плагины” модульно,
 * - иметь единое место, где формируется внешний слой UI (layout + providers).
 *
 * ## Что делает
 * - Подключает `DndProvider` (HTML5/Touch backend, авто‑выбор по устройству).
 * - Подключает `ErrorBoundary` (защита от падений UI).
 * - Подключает плагины (`OverlaysPlugin`, `DevQuestPlugin`) и `DevConsole`.
 * - Рендерит базовый layout контейнера, в котором дальше живут экраны (`children`).
 *
 * ## Инварианты / правила
 * - Не хранить здесь доменную механику игры (она в `features/game/domain`).
 * - Не размещать здесь логику навигации (она в `AppRouter`).
 * - Плагины должны быть безопасны: их можно отключить без поломки game‑флоу
 *   (см. `appConfig` и env‑флаги).
 *
 * ## Почему тут “можно”
 * Это внешний слой (Framework): здесь допустимы зависимости от React‑плагинов,
 * глобальных событий окна и прочих UI‑интеграций.
 *
 * Важно: поведение должно оставаться 1:1 с прежним `App.tsx` (до выноса),
 * кроме осознанно добавленного механизма “рубильников” для плагинов.
 */
import { ReactNode } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import DevConsole from '@/components/DevConsole';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { OverlaysPlugin } from '@/app/plugins/OverlaysPlugin';
import { DevQuestPlugin } from '@/app/plugins/DevQuestPlugin';
import { appConfig } from '@/app/appConfig';

// Безопасно определяем “тач-устройство” (важно: этот код выполняется в браузере).
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Для тач-устройств используем TouchBackend, иначе — HTML5Backend.
const Backend = isTouchDevice() ? TouchBackend : HTML5Backend;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <DndProvider backend={Backend}>
      <ErrorBoundary>
        {/* Глобальные инструменты / плагины */}
        {appConfig.plugins.devConsole && <DevConsole />}
        {appConfig.plugins.overlays && <OverlaysPlugin />}
        {appConfig.plugins.devQuest && <DevQuestPlugin />}

        {/* Базовая сцена приложения */}
        <div className="bg-stone-950 min-h-screen text-stone-100 font-sans selection:bg-rose-500/30 relative">
          {children}
        </div>
      </ErrorBoundary>
    </DndProvider>
  );
}


