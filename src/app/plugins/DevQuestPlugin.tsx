/**
 * DevQuestPlugin — "мета-слой" devquest/пасхалок (Блок 6).
 *
 * Слой: App / Framework (UI plugins).
 *
 * ## Что это
 * Плагин, который инкапсулирует “мета‑слой” проекта: devquest, пасхалки, magic words,
 * и глобальные слушатели событий окна (keydown/click/mousemove).
 *
 * ## Зачем
 * Исторически эта логика жила прямо в `App.tsx`. Это плохо масштабируется:
 * - `App` разрастается,
 * - трудно отключить devquest для плейтеста,
 * - глобальные подписки начинают конфликтовать между фичами.
 *
 * В Блоке 6 мы делаем один явный модуль‑владелец подписок и подключаем его из `AppShell`.
 *
 * ## Что делает
 * - Слушает активность пользователя и при idle (если включён screensaver) завершает аномалию `IDLE_STATE`.
 * - Держит “буфер” нажатых клавиш (magic words):
 *   - `lumos` → включает фонарик (если не заблокирован проклятием “Тьма”),
 *   - `nox` → выключает фонарик,
 *   - `sbros` → сбрасывает прогресс devquest,
 *   - `mouse` / `cat` → включает/выключает slime эффект.
 * - Считает быстрые клики для `ENTROPY_OVERLOAD` и Alt+Click для `MATRIX_BREAK`.
 * - Показывает UI‑кнопки (Settings + Dev Console toggle) — только если есть `user` (auth).
 *
 * ## Инварианты / правила
 * - Плагин должен корректно очищать все listeners/таймеры в cleanup.
 * - Плагин должен быть безопасен к отключению (см. `appConfig` → `VITE_DEVQUEST_ENABLED=false`).
 * - Не хранить здесь механику игры: только мета‑логика/инструменты.
 *
 * Важно: поведение должно быть 1:1 с прежней реализацией в `App.tsx`.
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Settings, Terminal } from 'lucide-react';
import { SettingsModal } from '@/components/SettingsModal';
import { useAuthStore } from '@/stores/useAuthStore';
import { useDevQuestStore } from '@/stores/useDevQuestStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { isFlashlightLocked } from '@/utils/flashlightLock';

export function DevQuestPlugin() {
  const { completeAnomaly, toggleConsole, resetQuest, isConsoleOpen } = useDevQuestStore();
  const { user } = useAuthStore();
  const { isScreensaverEnabled } = useSettingsStore();

  const [showSettings, setShowSettings] = useState(false);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const keyBufferRef = useRef('');

  // Логика devquest (поведение 1:1 с прежним App.tsx)
  useEffect(() => {
    const handleActivity = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      if (!isScreensaverEnabled) return;

      idleTimerRef.current = setTimeout(() => {
        completeAnomaly('IDLE_STATE');
      }, 60000); // 60 seconds
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      handleActivity();

      // “Магические слова” (буфер последних нажатий)
      keyBufferRef.current = (keyBufferRef.current + e.key).slice(-10).toLowerCase();

      if (keyBufferRef.current.endsWith('lumos')) {
        if (!isFlashlightLocked()) {
          completeAnomaly('MAGIC_WORD_1');
          // Включаем эффект “фонарика” (если не заблокирован проклятием “Тьма”).
          window.dispatchEvent(new CustomEvent('toggle-flashlight', { detail: true }));
        }
      }
      if (keyBufferRef.current.endsWith('nox')) {
        if (!isFlashlightLocked()) {
          window.dispatchEvent(new CustomEvent('toggle-flashlight', { detail: false }));
        }
      }

      // SBROS — полный сброс devquest
      if (keyBufferRef.current.endsWith('sbros')) {
        resetQuest();
        if (isConsoleOpen) {
          // Если консоль открыта — закрываем, чтобы при следующем открытии UI был в “чистом” состоянии.
          toggleConsole();
        }
        // При желании сюда можно добавить звук/визуальный “пинг”, но пока оставляем как есть.
        console.log('System Reset Initiated');
      }

      // BIO input (slime “mouse/cat”)
      if (keyBufferRef.current.endsWith('mouse')) {
        completeAnomaly('BIO_INPUT');
        // Включаем slime‑эффект.
        window.dispatchEvent(new CustomEvent('toggle-slime', { detail: true }));
      }
      if (keyBufferRef.current.endsWith('cat')) {
        window.dispatchEvent(new CustomEvent('toggle-slime', { detail: false }));
      }
    };

    const handleClick = (e: MouseEvent) => {
      handleActivity();

      // Matrix Break
      if (e.altKey) {
        completeAnomaly('MATRIX_BREAK');
        // При желании можно добавить визуальный “глитч”, но пока оставляем как есть.
      }

      // Entropy Overload (быстрые клики)
      clickCountRef.current++;
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1000); // Сбрасываем счётчик, если 1 сек. не было кликов.

      if (clickCountRef.current >= 15) {
        completeAnomaly('ENTROPY_OVERLOAD');
        clickCountRef.current = 0;
      }
    };

    const handleMouseMove = () => handleActivity();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove);

    // Initial idle timer start
    handleActivity();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, [completeAnomaly, isScreensaverEnabled, isConsoleOpen, resetQuest, toggleConsole]);

  return (
    <>
      {/* Console Toggle & Settings (как раньше: только для auth user) */}
      {user && (
        <div className="fixed bottom-2 right-2 flex gap-2 z-50">
          <button
            className="p-2 text-stone-700 hover:text-stone-400 transition-all opacity-50 hover:opacity-100"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <Settings size={16} />
          </button>
          <button
            className="p-2 text-stone-700 hover:text-green-500 transition-all opacity-50 hover:opacity-100"
            onClick={toggleConsole}
            title="Dev Console"
          >
            <Terminal size={16} />
          </button>
        </div>
      )}

      <AnimatePresence>{showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}</AnimatePresence>
    </>
  );
}


