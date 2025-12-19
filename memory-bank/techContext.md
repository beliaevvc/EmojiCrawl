# Технический контекст (Tech Context)

## Назначение
Этот документ отвечает на практические вопросы:
- чем проект собран (стек и версии),
- как запустить/собрать,
- где лежат точки входа и важные конфиги (алиасы, env‑флаги),
- где “живёт” I/O (Supabase/LocalStorage) после рефакторинга.

## Источник правды (Source of Truth)
- `package.json` — зависимости и скрипты.
- `vite.config.ts` — алиасы модулей (Vite).
- `tsconfig.json` — алиасы/компилятор.
- `scripts/generate-version.js` — генерация версии для UI.
- `src/app/appConfig.ts` — env‑флаги для плагинов.

## Где в коде (Entry points)
- Точки входа приложения:
  - `index.html`
  - `src/main.tsx`
  - `src/App.tsx`
  - `src/app/AppShell.tsx`, `src/app/AppRouter.tsx`
- Supabase:
  - клиент: `src/lib/supabase.ts`
  - инфраструктура: `src/infrastructure/supabase/*`
  - миграции: `supabase/migrations/*`
- LocalStorage:
  - инфраструктура: `src/infrastructure/localStorage/*`
  - bridge‑файлы совместимости: `src/utils/{uiStorage,storage,statsStorage}.ts`

## Стек технологий (по факту репозитория)

### Core
- **TypeScript**: ^5.2.2
- **React**: ^18.2.0
- **Vite**: ^5.1.4
- **Node.js**: используется для dev/build скриптов

### UI & UX
- **Tailwind CSS**: ^3.4.1
- **Framer Motion**: ^11.0.0
- **Lucide React**: ^0.344.0
- **DnD**: `react-dnd` + `react-dnd-touch-backend` + `react-dnd-html5-backend`

### State & Data
- **Zustand**: ^5.0.9 — для “глобальных” подсистем (auth/wallet/notes/devquest/settings).
- **Game state**: `useReducer` в `GameSessionProvider` (а не Zustand).
- **Supabase**: `@supabase/supabase-js` ^2.87.3

## Команды проекта
- Dev:

```bash
npm run dev
```

- Build:

```bash
npm run build
```

- Lint:

```bash
npm run lint
```

Примечание: `dev` и `build` сначала запускают `node scripts/generate-version.js`, затем Vite/TS.

## Алиасы импортов
Алиасы задаются и в Vite, и в TypeScript:
- `@/*` → `src/*`
- `@features/*` → `src/features/*`
- `@shared/*` → `src/shared/*`
- `@infrastructure/*` → `src/infrastructure/*`
- `@content/*` → `src/content/*`

## Env‑флаги (Vite)
Внешние UI‑плагины можно отключать через `.env`:
- `VITE_DEVQUEST_ENABLED=false`
- `VITE_OVERLAYS_ENABLED=false`
- `VITE_DEVCONSOLE_ENABLED=false`

Источник правды: `src/app/appConfig.ts`.

## Deployment
- **CI/CD**: Vercel (деплой из main)
- **URL**: `skazmor.app`

## Ограничения / требования к среде
- Мобильные браузеры (Safari iOS / Chrome Android) важны: drag‑and‑drop должен работать на touch.
- Архитектура должна позволять расширение (новые “экраны/комнаты/режимы”) без переписывания домена.

## Примечания по “артефактам”
Если в репозитории встречается историческая папка/прототип (например, `skazmor-app/`), она считается **неиспользуемой точкой входа** в текущей сборке, пока явно не договоримся иначе.

## Правила обновления
- Обновлять при изменениях:
  - зависимостей/скриптов/алиасов,
  - схемы env‑флагов,
  - расположения “внешнего I/O” (Supabase/LocalStorage).

## Связанные документы
- `memory-bank/systemPatterns.md`
- `memory-bank/productContext.md`
- `memory-bank/wallet.md`

## Последнее обновление
- 2025-12-19 — Приведено к фактическим зависимостям/скриптам/алиасам и текущим точкам входа (Блок 90).
