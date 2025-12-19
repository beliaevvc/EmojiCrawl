/**
 * App config (composition root).
 *
 * Слой: App / Framework (composition root).
 *
 * ## Что это
 * Единый конфиг “внешнего слоя” приложения — то, что относится к подключению
 * инфраструктурных UI‑модулей (plugins), а не к доменной логике.
 *
 * ## Зачем
 * В Блоке 6 мы хотим:
 * - подключать “плагины” (devquest/оверлеи/инструменты) модульно,
 * - иметь возможность быстро выключить их для отладки/плейтеста,
 * - при этом не трогать код фич (game/auth/wallet/notes) и не плодить `if (...)` по проекту.
 *
 * ## Что делает
 * - Читает значения из `import.meta.env` (Vite env).
 * - Приводит строки вида `"true"/"false"/"1"/"0"` к boolean.
 * - Даёт структурированный объект `appConfig`, который используется в `AppShell`.
 *
 * ## Инварианты / правила
 * - По умолчанию всё включено → поведение 1:1 с историческим `App.tsx`.
 * - Этот файл не должен импортировать фичи/компоненты — только читать env и отдавать флаги.
 * - Логика приведения флага должна быть предсказуемой и безопасной (fallback на default).
 *
 * ## Управление через .env
 * Можно отключать через env:
 * - `VITE_DEVQUEST_ENABLED=false`
 * - `VITE_OVERLAYS_ENABLED=false`
 * - `VITE_DEVCONSOLE_ENABLED=false`
 *
 * Важно:
 * - значения env в Vite приходят строками,
 * - по умолчанию всё включено (поведение 1:1).
 */

function envFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  const v = value.trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return defaultValue;
}

export const appConfig = {
  plugins: {
    // Можно отключать через .env:
    // - VITE_DEVQUEST_ENABLED=false
    // - VITE_OVERLAYS_ENABLED=false
    // - VITE_DEVCONSOLE_ENABLED=false
    devQuest: envFlag(import.meta.env.VITE_DEVQUEST_ENABLED, true),
    overlays: envFlag(import.meta.env.VITE_OVERLAYS_ENABLED, true),
    devConsole: envFlag(import.meta.env.VITE_DEVCONSOLE_ENABLED, true),
  },
} as const;


