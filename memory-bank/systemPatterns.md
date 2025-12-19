# Архитектура и паттерны (System Patterns)

## Назначение
Этот документ фиксирует **архитектурные правила проекта**: границы слоёв, принципы зависимостей, паттерны подключений (plugins/ports/adapters) и процессные договорённости, чтобы рефакторинг и развитие фич происходили предсказуемо.

## Источник правды (Source of Truth)
- Код:
  - `src/features/README.md` — правила Bounded Contexts и структура `domain/application/ui`.
  - `src/app/*` — composition root (роутинг, плагины, границы веток).
  - `src/app/game/GameFlowRoot.tsx` — граница game‑ветки и жизненный цикл сессии.
  - `src/features/game/application/react/GameSessionProvider.tsx` — владелец `GameState` (React adapter).
  - `src/features/game/domain/*` — доменное ядро (модели/редьюсер/порты).
  - `src/infrastructure/*` — адаптеры внешних систем (Supabase/LocalStorage).
  - `src/content/*` — контент‑пак (curses/spells/monsterAbilities), источник истины по контенту.
- Документация:
  - `memory-bank/refactor/plan-v1.md` и `memory-bank/refactor/roadmap-v1.md` — как мы пришли к текущим правилам.

## Где в коде (Entry points)
- `src/app/AppShell.tsx`, `src/app/AppRouter.tsx`
- `src/app/appConfig.ts` (env‑флаги плагинов)
- `src/app/plugins/DevQuestPlugin.tsx`, `src/app/plugins/OverlaysPlugin.tsx`
- `src/app/game/GameFlowRoot.tsx`
- `src/features/game/ui/GameFlow.tsx`, `src/features/game/ui/useGameFlowController.ts`
- `src/features/game/domain/reducer/gameReducer.ts`
- `src/features/game/application/gameSession.ts`
- `src/features/game/application/gameContent.ts` (вход `baseGameContent`)

## Содержание

### 1) Слои и правило зависимостей
Мы используем Clean Architecture в варианте “фича как bounded context”.

- **Domain (`src/features/*/domain`)**
  - чистые правила/инварианты/типы
  - **запрещены** импорты React, Zustand, Supabase, LocalStorage, DOM
- **Application (`src/features/*/application`)**
  - use‑cases/фасады/оркестрация домена
  - может зависеть от domain
  - внешние эффекты (I/O) — только через порты/интерфейсы
- **UI (`src/features/*/ui` и `src/components/*`)**
  - React‑компоненты/экраны/контроллеры
  - зависит от application
- **App / Framework (`src/app`)**
  - composition root: провайдеры, роутинг/навигация, подключение плагинов
- **Infrastructure (`src/infrastructure`)**
  - реализации портов (Supabase/LocalStorage)
- **Content (`src/content`)**
  - статический контент (curses/spells/monster abilities), не импортится доменом напрямую

### 2) Game‑ветка: “граница” и владелец состояния
Главный паттерн: **владение `GameState` находится на границе game‑ветки**, а не внутри экрана.

- Граница: `src/app/game/GameFlowRoot.tsx`
  - подключает `GameSessionProvider`
  - инъектирует runtime зависимости (например, `rng/clock`)
- Владение state: `src/features/game/application/react/GameSessionProvider.tsx`
  - `useReducer(domainReducer)`
  - отдаёт UI `{ state, dispatch, commands }`
- Внутриигровые экраны: `src/features/game/ui/GameFlow.tsx`
  - переключает `inGameView` (combat/pause/…)
  - важный принцип: `GameScreen` может оставаться смонтированным, чтобы не терять state

### 3) Ports / adapters (в т.ч. RNG/Clock)
Домен не вызывает `Math.random` / `Date.now` напрямую.

- Порты: `src/features/game/domain/ports/{Rng,Clock}.ts`
- Runtime‑реализации (по умолчанию): `src/features/game/application/runtime/defaultRuntime.ts`
- Инъекция: `src/app/game/GameFlowRoot.tsx` → `GameSessionProvider`

### 4) Content Layer и “источник истины”
- Источник истины по контенту: `src/content/*`
- Временные мосты (deprecated): `src/data/*` — допускаются для обратной совместимости, но **новому коду импортить нельзя**.
- UI берёт контент через `baseGameContent`:
  - `src/features/game/application/gameContent.ts`

### 5) Infrastructure: где живёт I/O
Правило: внешнее I/O не должно быть “размазано” по UI/stores.

- Supabase:
  - клиент: `src/lib/supabase.ts`
  - репозитории: `src/infrastructure/supabase/*`
- LocalStorage (для мигрированных подсистем):
  - репозитории: `src/infrastructure/localStorage/*`
  - bridge‑файлы совместимости: `src/utils/{uiStorage,storage,statsStorage}.ts` (без прямого I/O в новой логике)
- Осознанное исключение: локальные заметки в UI могут использовать localStorage в режиме без авторизации (см. `NotesModal` и чекпойнт в `activeContext.md`).

### 6) Plugins: мета‑слой и глобальные оверлеи
Чтобы `App` не стал “новым монолитом”, глобальные UI‑эффекты вынесены в плагины.

- Конфиг: `src/app/appConfig.ts`
  - env‑флаги:
    - `VITE_DEVQUEST_ENABLED=false`
    - `VITE_OVERLAYS_ENABLED=false`
    - `VITE_DEVCONSOLE_ENABLED=false`
- Плагины:
  - `src/app/plugins/DevQuestPlugin.tsx`
  - `src/app/plugins/OverlaysPlugin.tsx`

### 7) State management (где Zustаnd, а где нет)
- **Game state**: `useReducer` внутри `GameSessionProvider` (не Zustand).
- **Глобальные UI/аккаунт подсистемы**: Zustand stores в `src/stores/*` (auth/wallet/notes/devquest/settings).

### 8) Drag-and-drop
- Библиотека: `react-dnd` + touch backend.
- Принцип: DnD “визуал” и доменная механика разнесены:
  - UI‑DnD хуки/обвязки: `src/components/game/dnd/*`, `src/components/game/board/useCombatDnDActions.ts`
  - правила/инварианты: domain reducer

### 9) Конвенции по коду
- Имена сущностей/функций — на английском.
- Поясняющие комментарии и архитектурные шапки — на русском.

## Правила обновления
- Обновлять этот документ, если меняются:
  - границы слоёв/папок (`src/app`, `src/features/*`, `src/infrastructure`, `src/content`)
  - владелец `GameState` / жизненный цикл сессии
  - схема подключения плагинов или env‑флаги
- Не обновлять ради “косметики”: только когда меняется **правило** или **точка входа**.

## Связанные документы
- `memory-bank/techContext.md`
- `memory-bank/gameMechanics.md`
- `memory-bank/gameContent.md`
- `memory-bank/uiDesign.md`
- `memory-bank/refactor/roadmap-v1.md`

## Последнее обновление
- 2025-12-19 — Обновлено под текущую Clean Architecture структуру (`src/app`, `src/features/*`, `src/infrastructure`, `src/content`) и паттерны plugins/ports/adapters (Блок 90).
