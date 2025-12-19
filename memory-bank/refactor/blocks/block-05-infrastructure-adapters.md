# Блок 5 — Infrastructure через адаптеры (Supabase / LocalStorage / I/O)

## Цель блока
Сделать инфраструктуру (I/O) заменяемой и не “размазанной” по UI и Zustand:
- убрать прямые вызовы **Supabase** и **LocalStorage** из компонентов/сторов,
- спрятать I/O за интерфейсами (ports) внутренних слоёв,
- оставить UI/сторы тонкими: они вызывают application use‑cases, а не делают запросы.

## Scope
### Делаем
- Вводим **репозитории/адаптеры**:
  - Supabase: auth, wallet, notes (если используем)
  - LocalStorage: templates, run history, ui state (позиции/видимость HUD)
- Определяем **порты (interfaces)** во внутренних слоях (application/или domain, где уместно).
- Проводим миграцию **по одной подсистеме** (вертикальными срезами), сохраняя текущее поведение.

### Не делаем
- Не меняем UX/дизайн экранов.
- Не добавляем новые фичи (типа “новый экран кошелька”).
- Не переписываем сразу все сторы — мигрируем по очереди.

## Текущее состояние (в общих чертах)
### Supabase сейчас используется в:
- `src/lib/supabase.ts` — клиент
- `src/stores/useWalletStore.ts` — прямые `.from('wallets')...`
- `src/stores/useNotesStore.ts` — прямые `.from('notes')...`
- `src/stores/useAuthStore.ts` + `src/components/AuthModal.tsx` — auth

### LocalStorage сейчас используется в:
- `src/utils/storage.ts` — templates
- `src/utils/statsStorage.ts` — run history
- `src/utils/uiStorage.ts` — позиции/видимость HUD

## Целевые границы (Clean Architecture)
- **Infrastructure**: реальные реализации (Supabase/LocalStorage).
- **Application**: use‑cases, которые зависят от портов (`WalletRepository`, `TemplatesRepository`, …).
- **UI / stores**: только вызывает use‑cases и держит UI‑состояние.

## Предлагаемая структура (цель, можно начать проще)
- `src/infrastructure/supabase/`
  - `SupabaseAuthRepository`
  - `SupabaseWalletRepository`
  - `SupabaseNotesRepository`
- `src/infrastructure/localStorage/`
  - `LocalStorageTemplatesRepository`
  - `LocalStorageRunHistoryRepository`
  - `LocalStorageUIStateRepository`
- `src/features/<feature>/application/ports/`
  - интерфейсы репозиториев (порты)

## План миграции (маленькими порциями)
### Шаг 5.1 — Выбрать “первую подсистему” для миграции
С учётом текущего состояния проекта (Supabase уже используется для **пользователей/кошелька/заметок**), стартуем с **Supabase** — это быстрее уменьшит риск “I/O размазано по UI/сторам”.

Кандидаты для старта:
1) Wallet (`useWalletStore.ts` + таблица `wallets`) → `WalletRepository`
2) Auth (`useAuthStore.ts`, `AuthModal.tsx`) → `AuthService/AuthRepository` (с аккуратной обработкой подписок)
3) Notes (`useNotesStore.ts`) → `NotesRepository`

После этого переносим LocalStorage‑подсистемы:
- UI state (`uiStorage.ts`) → `UIStateRepository`
- Templates (`storage.ts`) → `TemplatesRepository`
- Run history (`statsStorage.ts`) → `RunHistoryRepository`

### Шаг 5.2 — Ввести порт (interface) и 1 реализацию
Пример (концептуально):
- `UIStateRepository` с методами `load()`, `savePositions()`, `saveVisibility()`.
- Реализация `LocalStorageUIStateRepository`.

Важно: на этом шаге можно сделать **обёртку над существующим кодом**, не переписывая его.

### Шаг 5.3 — Перевести вызовы на репозиторий (через application слой)
Цель: UI/сторы не знают, *где* хранится состояние.
- UI вызывает `uiStateUseCase.loadHudState()` или `settingsService.loadHudState()`
- внутри use‑case дергается `UIStateRepository`.

### Шаг 5.4 — Повторить для Supabase (wallet → auth → notes)
**Рекомендация порядка:**
1) `wallet` (простая модель: crystals)
2) `auth` (сложнее из‑за подписок)
3) `notes` (если актуально)

**Особенность auth:**
- подписки `onAuthStateChange` лучше держать в инфраструктуре/сервисе, а application слой получать события через порт (observer).

### Шаг 5.5 — Упростить Zustand store’ы
После переноса I/O:
- stores становятся “тонкими”: состояние + вызовы use‑cases.
- Supabase запросы исчезают из stores.

## Важные решения / вопросы (можно “не знаю”)
1) Хотим ли мы, чтобы **wallet работал оффлайн** (локально) и синхронизировался при логине?
2) Notes: это реально нужна фича в ближайшее время, или можно временно оставить как есть?

## Зафиксировано по ответам (на сейчас)
- Auth остаётся **простым**, как сейчас: без ролей/прав/сложного RBAC. Цель Блока 5 — убрать прямые вызовы Supabase из UI/сторов и аккуратно оформить подписки, но не усложнять модель доступа.
- Notes (**A**): заметки тоже мигрируем в этом блоке вместе с wallet/auth (полный Supabase‑срез: **wallet → auth → notes**).

## Риски
- Подписки auth (onAuthStateChange) могут привести к утечкам/дубликатам.
  - Снижение: один владелец подписки (инфра‑сервис), явный `dispose()`.
- Дублирование источников правды (например, local + remote).
  - Снижение: выбрать стратегию (optimistic UI уже есть в wallet) и документировать.

## Критерии готовности (DoD)
- В `src/stores/*` и `src/components/*` нет прямых вызовов Supabase/LocalStorage для подсистем, которые мигрированы.
- I/O сосредоточен в `src/infrastructure/*`.
- Есть понятные русские комментарии о границах (что порт, что адаптер, что use‑case).

## Context7 (обязательный инструмент, когда нужно)
- При работе с Supabase auth/каналами и best‑practices — смотреть актуальные примеры через **Context7 MCP** (особенно для подписок и edge‑case’ов).


