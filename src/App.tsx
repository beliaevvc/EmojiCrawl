/**
 * App — тонкий composition root (Блок 6).
 *
 * Слой: App / Framework (composition root).
 *
 * ## Что это
 * Главная точка сборки React‑приложения. Этот файл должен быть максимально маленьким.
 *
 * ## Зачем
 * В рамках Clean Architecture мы не хотим, чтобы `App.tsx` превратился в новый “бог‑файл”
 * с логикой фич, слушателями событий, оверлеями и т.п.
 *
 * Поэтому в Блоке 6 мы разделяем ответственность:
 * - `AppShell` — “оболочка” приложения (глобальные провайдеры, плагины, базовый layout),
 * - `AppRouter` — верхнеуровневая навигация (menu/game/stats/deckbuilder).
 *
 * ## Что делает
 * Только композирует `AppShell` + `AppRouter`.
 *
 * ## Инварианты / правила
 * - **Не** добавлять сюда бизнес‑логику фич (game/auth/wallet/notes/devquest).
 * - **Не** заводить здесь глобальные подписки/таймеры — для этого есть плагины в `src/app/plugins/*`.
 * - Любые новые глобальные интеграции сначала пробуем оформить как “плагин” или слой `AppShell`,
 *   чтобы `App` оставался тонким.
 *
 * ## Пограничная роль
 * `App.tsx` — внешний слой, он может зависеть от UI/Framework кода, но внутренние слои
 * (domain/application) не должны зависеть от него.
 */
import { AppShell } from '@/app/AppShell';
import { AppRouter } from '@/app/AppRouter';

export default function App() {
  return (
    <AppShell>
      <AppRouter />
    </AppShell>
  );
}
