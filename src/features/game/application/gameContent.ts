/**
 * Game Application Layer — единая точка получения GameContent для UI/use-cases.
 *
 * Слой: Application (composition/orchestration).
 *
 * ## Что это
 * Небольшой application‑модуль, который предоставляет UI и use-cases
 * **единый способ получить `GameContent`**.
 *
 * ## Зачем
 * Контент — это зависимость, которая:
 * - нужна UI (пикеры, энциклопедия, описания),
 * - нужна application слою (например, собрать snapshot метаданных для `START_GAME`),
 * - не должна быть жёстко прошита в домене.
 *
 * В Блоке 4 мы отвязали проект от прямых импортов `src/data/*` и ввели `src/content/*`.
 * В Блоке 6 (composition root) стало особенно важно, чтобы “откуда берётся контент”
 * не расползалось по UI: game‑ветка должна собираться как композиция зависимостей.
 *
 * ## Что делает
 * - Экспортирует `getGameContent(packId)` — фабрику контейнера контента.
 * - Экспортирует `baseGameContent` — текущий дефолтный набор (`base`).
 *
 * ## Инварианты / правила
 * - UI по умолчанию берёт контент через application (`baseGameContent`), а не напрямую из `src/content/*`.
 * - Выбор pack’а — это orchestration (application/app), а не UI-деталь.
 *
 * ## Про контент-паки
 * Сейчас pack фиксирован как `base`. Позже сюда добавится выбор pack
 * (настройки/декбилдер/dev‑флаг/провайдер), но UI-импорты менять не придётся.
 *
 * Почему это лежит в application, а не в UI:
 * - выбор “какой пак контента используем” — это часть orchestration/композиции,
 * - UI не должен знать, где лежит контент и как он собирается,
 * - так проще в будущем добавить другие pack’и без массовых правок UI.
 *
 * Текущая стадия (переходная):
 * - это простой helper + `baseGameContent`.
 * - позже мы, вероятно, заменим это на DI/контейнер (например провайдер или composition root),
 *   чтобы можно было выбирать pack в рантайме и тестировать разные наборы.
 */
import { createGameContent, type ContentPackId, type GameContent } from '@/content';

export function getGameContent(packId: ContentPackId = 'base'): GameContent {
  return createGameContent(packId);
}

export const baseGameContent: GameContent = getGameContent('base');


