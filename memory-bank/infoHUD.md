# InfoHUD (режим “Info”) и дополнительный интерфейс боя

## Назначение
InfoHUD — это **дополнительный слой информации** в бою, который включается кнопкой **Info** (лупа) в нижней панели.

Важно:
- InfoHUD **не заменяет** основной геймплейный UI (поле, слоты, аватар).
- InfoHUD добавляет **аналитику и справочные окна**, которые можно включать/выключать и таскать по экрану.

## Источник правды (Source of Truth)
- Код (UI):
  - `src/components/game/hud/GameBottomBar.tsx` — кнопка **Info** + дополнительные инструменты в Info‑режиме (настройки, сброс окон, God Mode).
  - `src/components/game/hud/GameTopBar.tsx` — счётчик колоды + (в Info) breakdown по типам карт.
  - `src/components/game/hud/HudWindows.tsx` — условный рендер плавающих окон в зависимости от `showInfo` и `HUDVisibility`.
  - `src/components/HUDSettingsModal.tsx` — модалка “Интерфейс” (настройка `HUDVisibility`).
  - `src/components/game/hud/useHudVisibility.ts` — persisted‑видимость окон.
  - `src/components/game/hud/useHudWindowPositions.ts` — persisted‑позиции окон.
- Код (persist / storage):
  - `src/features/game/application/ports/UIStateRepository.ts` — тип `HUDVisibility` и контракт хранения UI‑состояния.
  - `src/infrastructure/localStorage/ui/LocalStorageUIStateRepository.ts` — фактическое хранение (LocalStorage).
  - `src/utils/uiStorage.ts` — **bridge** (совместимый API, без прямого `localStorage.*` в UI).

## Где в коде (Entry points)
- Ветка боя (компоновка HUD‑слоя):
  - `src/components/game/screens/GameHudLayer.tsx`
  - `src/components/game/screens/useGameScreenController.ts`
- Плавающие окна:
  - `src/components/game/windows/CardsViewer.tsx`
  - `src/components/game/windows/OverheadStatsWindow.tsx`
  - `src/components/game/windows/GameLogWindow.tsx`
  - `src/components/MonsterLabelsWindow.tsx`

## Содержание

### 1) Что включает InfoHUD (функционально)
InfoHUD состоит из трёх частей, активных **только когда `showInfo === true`**:

1) **Верхняя панель (TopBar Addons)**
   - Breakdown по типам карт в колоде (Deck Stats).

2) **Нижняя панель (BottomBar Tools)**
   - Кнопка “Настройки интерфейса” (открывает `HUDSettingsModal`).
   - Кнопка “Сбросить окна” (очистка positions).
   - Панель “читов” — появляется как отдельный блок по кнопке‑глазу:
     - `God Mode` (переключатель)
     - **+💎 герою (run coins)** — ввод числа через модальное окно
     - **Торговец на следующий раунд** — форс‑планирование визита

3) **Плавающие окна (Floating Windows)**
   - `CardsViewer`:
     - “Колода”
     - “Сброс” (+ опционально статистика сброса)
   - `OverheadStatsWindow` (overheal/overkill/overdef)
   - `GameLogWindow` (лог событий)
   - `MonsterLabelsWindow` (легенда меток)

### 2) Модель состояния InfoHUD (важно различать)
Есть три уровня состояния:

- **`showInfo` (локально, на время сессии/экрана)**
  - включает/выключает весь InfoHUD одним флагом
  - хранится как UI‑state (React state), не обязателен к персисту

- **`HUDVisibility` (persisted)**
  - какие окна/под‑разделы включены (“deck stats”, “log window”, “discard stats”…)
  - хранится через `UIStateRepository` (infra LocalStorage) и доступен UI через bridge `src/utils/uiStorage.ts`

- **`windowPositions` (persisted)**
  - позиции плавающих окон (x/y)
  - хранится через тот же `UIStateRepository`

### 3) Персистентность (как устроено хранение сейчас)
Исторически UI писал напрямую в `localStorage`, но после Блока 5 это вынесено:
- UI вызывает `saveUIVisibility/saveUIPositions` из `src/utils/uiStorage.ts`
- `uiStorage.ts` — bridge, делегирует в application use‑cases и infra‑репозиторий
- фактическое I/O находится в `src/infrastructure/localStorage/ui/LocalStorageUIStateRepository.ts`

### 4) Как добавить новый элемент в InfoHUD (пошагово)

#### A) Если это новый floating window
1) Создать компонент окна:
   - обычно в `src/components/game/windows/*` (или отдельным компонентом рядом).
2) Добавить ключ видимости:
   - расширить `HUDVisibility` в `src/features/game/application/ports/UIStateRepository.ts`.
   - обновить дефолты в `src/infrastructure/localStorage/ui/LocalStorageUIStateRepository.ts` (чтобы новый ключ имел начальное значение).
3) Добавить переключатель в `HUDSettingsModal`:
   - `src/components/HUDSettingsModal.tsx` → массив `SETTINGS`.
4) Подключить окно в `HudWindows`:
   - `src/components/game/hud/HudWindows.tsx` → условный рендер:
     - `showInfo && hudVisibility.<key>`
   - если окно draggable — прокинуть `position` + `onPositionChange` и использовать key (например `log/stats/deck/...`).

#### B) Если это “addon” верхней/нижней панели
1) Для TopBar: `src/components/game/hud/GameTopBar.tsx` (+ прокидывание props из `useGameScreenController`).
2) Для BottomBar: `src/components/game/hud/GameBottomBar.tsx`.

## Правила обновления
- Обновлять этот документ, если меняются:
  - список окон InfoHUD,
  - места подключения (TopBar/BottomBar/HudWindows),
  - модель персистентности (`UIStateRepository`, ключи и дефолты).
- Не обновлять при косметических правках стилей: это в `uiDesign.md`.

## Связанные документы
- `memory-bank/uiDesign.md`
- `memory-bank/systemPatterns.md`
- `memory-bank/techContext.md`

## Последнее обновление
- 2025-12-19 — Приведено к текущей реализации InfoHUD (TopBar/BottomBar/HudWindows, persisted visibility/positions через `UIStateRepository` и bridge `uiStorage`) и новому формату документации (Блок 90).
- 2025-12-19 — Расширена панель скрытых dev‑кнопок (читы): +💎 и торговец на следующий раунд.
