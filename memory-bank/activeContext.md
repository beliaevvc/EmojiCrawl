# Текущий Контекст (Active Context)

## Архитектурный рефакторинг — текущий статус (чекпойнт)
**Главный план:** `memory-bank/refactor/plan-v1.md`
**Roadmap внедрения:** `memory-bank/refactor/roadmap-v1.md`

## Активные Документы
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`
- `memory-bank/refactor/plan-v1.md`
- `memory-bank/refactor/roadmap-v1.md`
- `memory-bank/tasks.md`

**Зафиксированные решения:**
- Разрешены временные **ре‑экспорты** для плавной миграции.
- Доменное ядро изолировано от UI и не импортит `src/data/*`/`src/content/*` напрямую; “презентационные” метаданные прокидываются через `GameAction` при необходимости (компромисс Блока 4).

## Текущий Фокус
**Архитектурный рефакторинг (V1) завершён.** Все блоки по `roadmap-v1.md` выполнены: **0–6, 8, 90**.

Текущий фокус: **дальнейшая разработка фич и поддержка документации** (документация — “истина” по границам слоёв и источникам данных).

## Последние изменения (кратко)

- **Блок 1 (Game Domain Kernel) выполнен:**
  - Выделено ядро игры в `src/features/game/domain/`.
  - Модели перенесены в `src/features/game/domain/model/types.ts`.
  - Редьюсер перенесен в `src/features/game/domain/reducer/gameReducer.ts`.
  - Логика колоды перенесена в `src/features/game/domain/deck/deckFactory.ts`.
  - Настроены **ре-экспорты** в старых файлах (`src/types/game.ts`, `src/utils/gameReducer.ts`, `src/utils/gameLogic.ts`) для обратной совместимости.
  - UI продолжает работать без изменений кода.
- **Блок 0 (Guardrails) выполнен ранее.**
- **Блок 2 (Application Layer) — старт вертикального среза:**
  - Добавлен `src/features/game/application/gameSession.ts` (переходный фасад: команды → `GameAction`).
  - `GameScreen` частично переведён на вызовы `gameSession.*` вместо прямых `dispatch({ type: ... })`:
    - `startGame`, `takeCardToHand`, `useSpellOnTarget`, `sellItem`, `resetHand`, `activateCurse`.
  - Прямые `dispatch({type: ...})` пока остались только для “служебных” действий (`CLEAR_PEEK`, `CLEAR_SCOUT`, `TOGGLE_GOD_MODE`).
  - Подготовлен **контейнер жизненного цикла** (React‑адаптер) для будущей “долгой” сессии между внутриигровыми экранами:
    - `src/features/game/application/react/GameSessionProvider.tsx` (`GameSessionProvider`, `useGameSession`).
    - Пока **не подключён** в UI (чтобы не рисковать), подключение будет в Блоке 2A вместе с `inGameView`.
 - **Блок 2A (inGameView) — прототип `combat` ↔ `pause`:**
   - Добавлен `src/features/game/ui/GameFlow.tsx` с `inGameView` и `history` + `goBack()` (Esc открывает/закрывает паузу).
   - `App.tsx` теперь рендерит `GameFlow` вместо прямого `GameScreen`, при этом `App` всё ещё знает только `menu/game/stats/deckbuilder`.
   - В `GameScreen` добавлена кнопка **“Пауза”** (через проп `onOpenPause`), открывающая внутриигровую паузу без размонтирования `GameScreen`.

### Техдолг (после V1)
- `exitCombat(...)` (use-case/команда application слоя) пока **не внедряли** — сейчас внутриигровая навигация ограничена `pause`, и нет экранов, которые “уходят из боя в середине”.
- Когда появятся новые `inGameView` (например, `story/shop/rewards/room_select`) — стоит добавить `exitCombat` и вызывать его централизованно при переходах, чтобы логика “закрытия боя” не расползлась по UI.

 - **Блок 3 (UI‑декомпозиция) — прогресс:**
   - DnD обвязки вынесены в `src/components/game/dnd/*`.
   - HUD окна вынесены в `src/components/game/windows/*` (`OverheadStatsWindow`, `GameLogWindow`, `CardsViewer`).
   - Модалки/оверлеи собраны в единый `src/components/game/modals/GameModals.tsx`.
   - HUD панели вынесены в `src/components/game/hud/*` (`GameTopBar`, `GameBottomBar`, `SystemButton`).
   - Вынесены визуальные эффекты (floating texts + реакция героя на HP/💎/блок/благословение) в `src/components/game/effects/*`:
     - `useFloatingTextController.ts`
     - `useHeroVisualFx.ts`
     - `useSequentialHp.ts` (очередь анимации HP по `hpUpdates`)
   - Вынесены плавающие HUD‑окна в `src/components/game/hud/HudWindows.tsx` (deck/discard viewer + stats/log/labels).
   - Вынесен центральный аватар героя в `src/components/game/board/PlayerAvatar.tsx`.
   - Вынесена центральная доска боя (enemy slots + руки + рюкзак + аватар) в `src/components/game/board/GameBoard.tsx`.
   - Вынесены боковые контролы:
     - `src/components/game/board/LeftControls.tsx` (CurseSlot + “Сброс (-5HP)”)
     - `src/components/game/board/SellControl.tsx` (SellZone + кнопка продажи)
   - Вынесен layout‑контейнер боя в `src/components/game/board/CombatLayout.tsx` (3 колонки: left/center/right).
   - Вынесены визуальные эффекты enemy slots в `src/components/game/effects/useEnemySlotFloatingTexts.ts` (урон/хил/swap/mirror/воскрес/убежал/💀).
   - Вынесена логика stealth‑блокировки в `src/components/game/effects/useStealthBlockFx.ts` (включая floating text “👻 СКРЫТ”).
   - Вынесен обработчик продажи (drop в SellZone) в `src/components/game/board/useSellDropHandler.ts` (валидаторы + floating‑фидбек + команда продажи).
   - Вынесены DnD/интеракшены боя в `src/components/game/board/useCombatDnDActions.ts` (drop в руки/рюкзак, spell/weapon на монстра, взаимодействие с монстрами с учётом stealth).
   - Вынесены UI-таймеры peek/scout и эффект “МОЛЧАНИЕ: Магия заблокирована” в `src/components/game/effects/`:
     - `useTimedPeekScoutClear.ts`
     - `useSilenceBlockedFx.ts`
   - Вынесены вычисляемые данные HUD в `src/components/game/hud/useHudComputedData.ts` (deck/discard stats, active buffs, active labels, safe cleanDeck).
   - Вынесен watcher `lastEffect` (corrosion/corpseeater) в `src/components/game/effects/useLastEffectFloatingTexts.ts`.
   - Вынесено состояние позиций HUD окон в `src/components/game/hud/useHudWindowPositions.ts` (load/save/reset layout).
   - Вынесена видимость HUD окон в `src/components/game/hud/useHudVisibility.ts` (load/save).
   - Вынесено локальное UI-состояние экрана в `src/components/game/ui/useGameUiState.ts` (модалки/подтверждения/выбранная карта/curse picker).
  - Вынесено правило выбора карты для зума/описания в `src/components/game/ui/useCardSelection.ts` (поведение 1:1 со старым `handleCardClick`).
  - Вынесен UI-флоу активации проклятия (picker → confirm → activate → cleanup) в `src/components/game/ui/useCurseActivationFlow.ts` (поведение 1:1).
  - Вынесен эффект блокировки пасхалки Lumos/Nox при проклятии “Тьма” в `src/components/game/effects/useDarknessFlashlightLock.ts` (поведение 1:1).
  - Вынесен флоу старта/рестарта забега (start on mount + restart handlers) в `src/components/game/ui/useStartGameFlow.ts` (поведение 1:1).
  - Вынесено правило доступности “Сброс (-5HP)” и обработчик сброса в `src/components/game/board/useHandResetControl.ts` (поведение 1:1).
  - Добавлен общий хелпер `useLatestRef` в `src/shared/react/useLatestRef.ts` и применён в `GameScreen` для stateRef (DnD callbacks, поведение 1:1).
   - Вынесены эффекты завершения забега в `src/components/game/effects/useRunCompletionEffects.ts` (saveRun + начисление кристаллов).
   - Вынесены вычисляемые флаги поля в `src/components/game/board/useBoardComputedFlags.ts` (isSellBlocked/hasWeb/getCardModifier).
   - `GameScreen.tsx` ~377 строк.
  - Техническая стабилизация после выноса кода (без изменения поведения):
    - `npm run lint` снова проходит (исправлены `no-case-declarations`/`prefer-const` в `src/features/game/domain/reducer/gameReducer.ts` только через `{}`/`const`).
    - Почищены зависимости `useEffect` (warnings `react-hooks/exhaustive-deps`) в `App/MainMenu/Chalkboard`.
    - Вынесена константа `DEFAULT_MONSTER_GROUPS` в отдельный файл `src/components/MonstersEditor.defaults.ts` (фикс `react-refresh/only-export-components`).
    - В `GameSessionProvider` разрешён экспорт Provider+hook (точечный disable правила fast refresh).
  - Структурное улучшение Блока 3 (экран‑компоновка как screen):
    - `GameScreen` перенесён в `src/components/game/screens/GameScreen.tsx`.
    - `src/components/GameScreen.tsx` оставлен как proxy‑реэкспорт для обратной совместимости.
    - `GameFlow` импортит `GameScreen` из нового пути (`@/components/game/screens/GameScreen`).
  - Дальнейшая “чистка” `GameScreen` (Блок 3, без изменения поведения):
    - Вынесена glue‑логика экрана в `src/components/game/screens/useGameScreenController.ts` (state/refs/handlers/computed).
    - `GameScreen.tsx` стал в основном компоновкой JSX.
    - Вынесены оверлеи сцены (фон + “Тьма” + баннер проклятия + floating texts) в `src/components/game/screens/GameSceneOverlays.tsx`.
    - Вынесен HUD-слой (TopBar + HudWindows + BottomBar) в `src/components/game/screens/GameHudLayer.tsx`.
    - Вынесена боевая компоновка (CombatLayout + LeftControls + GameBoard + SellControl) в `src/components/game/screens/GameCombatLayer.tsx`.
    - Сбор props для слоёв вынесен в `useGameScreenController` (view-model): `sceneOverlaysProps / hudLayerProps / combatLayerProps / modalsPropsBase`.
  - Декомпозиция “внутриигрового экрана навигации”:
    - Логика `GameFlow` (inGameView/history/Esc) вынесена в `src/features/game/ui/useGameFlowController.ts`, `GameFlow.tsx` стал компоновкой.
  - Документация кода (Блок 3, шапки файлов):
    - Привели шапки DnD-компонентов (`dnd/*`) и HUD-окон (`windows/*`) к более подробному виду (без изменения поведения).
    - Уплотнили шапки UI-хуков `ui/*` (start game, curse flow, card selection, ui state) — чтобы читалось как “самодокументируемый модуль”.
    - Дополнили русские inline‑комментарии в `src/components/game/board/useSellDropHandler.ts` (валидаторы продажи + причины ограничений).
    - Дополнили русские inline‑комментарии в effects-хуках:
      - `src/components/game/effects/useEnemySlotFloatingTexts.ts` (кейсы: урон/хил/flee/недамажные удаления/“воскрес”/💀),
      - `src/components/game/effects/useStealthBlockFx.ts` (правило “СКРЫТ” и почему это UI‑блокировка).
    - Дополнили русские inline‑комментарии в glue/DnD-слое:
      - `src/components/game/board/useCombatDnDActions.ts` (почему определяем сторону оружия из state),
      - `src/components/game/screens/useGameScreenController.ts` (пояснения про `stateRef`, refs слотов, “Тьма” как UI-only).
    - Дополнили русские inline‑комментарии в `src/components/game/effects/useLastEffectFloatingTexts.ts` (как выбираем DOM-ref цели для “corrosion”).
    - Дополнили русские inline‑комментарии в DnD/контроллере:
      - `src/components/game/dnd/EnemySlotDropZone.tsx` (правила canDrop + Fog/hidden),
      - `src/components/game/screens/useGameScreenController.ts` (заголовки секций return, чтобы view-model читался проще).
    - Перевели оставшиеся англоязычные inline‑комментарии в UI-модулях:
      - `src/components/game/windows/CardsViewer.tsx` (пояснение порядка отображения стопки),
      - `src/components/game/effects/useDarknessFlashlightLock.ts` (unlock при размонтировании/смене проклятия).
    - Привели к русскому “секционные” комментарии:
      - `src/components/game/modals/GameModals.tsx` (описания блоков пропсов/модалок),
      - `src/components/game/effects/useHeroVisualFx.ts` (HP/💎/доспехи/благословение) и подпись “🛡️ БЛОК”.
    - Дополнили русские inline‑комментарии в:
      - `src/components/game/board/GameBoard.tsx` (почему `onInteract` прокидывается только для щита),
      - `src/components/game/effects/useRunCompletionEffects.ts` (когда и почему начисляем кристаллы).
    - Привели к русскому “служебные” комментарии в:
      - `src/features/game/ui/useGameFlowController.ts` (подписи к props/actions + Esc-навигация),
      - верхней части `src/features/game/domain/reducer/gameReducer.ts` (шапки разделов и пары inline‑комментов).
    - Продолжили перевод англоязычных комментариев в `gameReducer.ts`:
      - kill/spawn/passive/mirror/attack/miss,
      - “Туман”: deal/reveal/initial activation,
      - проверки hidden/silence.
    - Привели к русскому комментарии и “шапки” в остальных файлах доменного ядра:
      - `src/features/game/domain/deck/deckFactory.ts`,
      - `src/features/game/domain/model/types.ts`,
      - `src/features/game/domain/model/index.ts`,
      - `src/features/game/domain/logic/index.ts`,
      - 2 inline‑коммента в `gameReducer.ts` (hasActed / “Mark action”).

 - **Блок 3 — хотфикс HUD layout (без изменения поведения):**
   - `GameHudLayer` сделан абсолютным overlay-слоем.
   - `GameTopBar` закреплён сверху, `GameBottomBar` закреплён снизу (меню вернулось вниз, как в макете).
 - Технический фикс TypeScript (без изменения поведения игры):
   - В `tsconfig.json` добавлены `allowSyntheticDefaultImports` и `esModuleInterop`, чтобы убрать ошибки дефолт‑импортов React.
   - `src/main.tsx` переведён на корректный импорт `createRoot` из `react-dom/client`.

 - **Блок 4 (Content Layer) — старт (Шаги 4.1–4.2):**
   - Добавлен контейнер `GameContent` и сборщик `createGameContent('base')` в `src/content/gameContent.ts`.
   - Добавлен публичный вход `src/content/index.ts`.
   - `base` pack собирается из модулей `src/content/*` (curses/spells/monsterAbilities). `src/data/*` оставлены как deprecated‑мосты (реэкспорт) для обратной совместимости.
 - **Блок 4 (Content Layer) — Шаг 4.3 (curses) выполнен (без изменения поведения):**
   - Проклятия перенесены в `src/content/curses/baseCurses.ts` (новый источник истины).
   - UI (CursePicker/CurseSlot/баннер/Deckbuilder/confirm-текст) переведён на `baseGameContent` из `src/features/game/application/gameContent.ts`.
   - В domain убран прямой импорт `@/data/curses`: `ACTIVATE_CURSE` теперь может нести `curseMeta` (name/icon/color) из application слоя для логов.
   - `src/data/curses.ts` оставлен как deprecated‑мост (новому коду импортить нельзя).

 - **Блок 4 (Content Layer) — Шаг 4.4 (spells) выполнен (без изменения поведения):**
   - Заклинания перенесены в `src/content/spells/baseSpells.ts` (новый источник истины) + `src/content/spells/*`.
   - UI больше не импортит `data/spells` напрямую (SpellPicker/SpellsEditor/PlayerAvatar/Deckbuilder).
   - В domain убран прямой импорт `@/data/spells`:
     - `START_GAME` теперь несёт `content` (минимальный snapshot: `baseSpellIds` + `spellsById`),
     - `createDeck(content)` использует meta для создания spell-карт.
   - `src/data/spells.ts` оставлен как deprecated‑мост (новому коду импортить нельзя).

 - **Блок 4 (Content Layer) — Шаг 4.5 (monsterAbilities) выполнен (без изменения поведения):**
   - Способности монстров перенесены в `src/content/monsterAbilities/baseMonsterAbilities.ts` (новый источник истины) + `src/content/monsterAbilities/*`.
   - UI больше не импортит `data/monsterAbilities` напрямую (CardComponent/AbilityPicker/MonstersEditor/MonsterGroupEditor/GameModals).
   - В domain убран прямой импорт `@/data/monsterAbilities`:
     - `START_GAME.content` расширен `monsterAbilitiesById`,
     - генерация кастомных монстров берёт `name/description/icon` из `action.content`, без прямых импортов контента.
   - `src/data/monsterAbilities.ts` оставлен как deprecated‑мост (новому коду импортить нельзя).

 - **Блок 4 — документация кода (требование “объёмные русские комментарии”):**
   - Привели к единому стилю и дополнили “шапки” (что это / зачем) в файлах Блока 4:
     - content слой: `src/content/*` (definitions/modules/container) + публичный вход,
     - application/domain glue: `gameSession.ts`, `model/types.ts`, `deckFactory.ts`, `gameReducer.ts`,
     - UI‑потребители контента: пикеры/редакторы/карточки/модалки/декбилдер (`baseGameContent` вместо `src/data/*`).
   - Без изменения поведения: сборка `npm run build` проходит.

 - **Блок 5 (Infrastructure adapters) — Шаг 5.1 (wallet) выполнен (без изменения поведения):**
   - Supabase I/O вынесен из `src/stores/useWalletStore.ts` в инфраструктурный репозиторий `src/infrastructure/supabase/wallet/SupabaseWalletRepository.ts`.
   - В application слое добавлены порт `WalletRepository` и use-cases `createWalletUseCases(...)` в `src/features/wallet/application/*`.
   - Store остался “тонким”: локальный optimistic update + вызов use-case для синхронизации (при отсутствии юзера — остаёмся на локальном стейте).

- **Блок 5 (Infrastructure adapters) — Шаг 5.2 (auth) выполнен (без изменения поведения):**
  - Supabase auth I/O вынесен из `src/stores/useAuthStore.ts` и `src/components/AuthModal.tsx` в инфраструктурный адаптер `src/infrastructure/supabase/auth/SupabaseAuthRepository.ts`.
  - В application слое добавлены порт `AuthRepository` и use-cases `createAuthUseCases(...)` в `src/features/auth/application/*`.
  - `useAuthStore` теперь владеет подпиской `onAuthStateChange` и корректно очищает её (защита от утечек/дубликатов подписок).
  - Для UI достаточно `AuthUser` (id/email) вместо тяжёлых типов Supabase — это уменьшает связанность.

- **Блок 5 (Infrastructure adapters) — Шаг 5.3 (notes) выполнен (без изменения поведения):**
  - Supabase notes I/O вынесен из `src/stores/useNotesStore.ts` в инфраструктурный адаптер `src/infrastructure/supabase/notes/SupabaseNotesRepository.ts`.
  - В application слое добавлены порт `NotesRepository` и use-cases `createNotesUseCases(...)` в `src/features/notes/application/*`.
  - Realtime подписка на заметки теперь управляется точечно (dispose конкретного `channel`), **без** `removeAllChannels()` (защита от случайного отключения других realtime‑каналов).

- **Блок 5 (Infrastructure adapters) — LocalStorage: uiStorage (HUD) выполнено (без изменения поведения):**
  - Вынесен localStorage I/O из `src/utils/uiStorage.ts` в инфраструктурный адаптер `src/infrastructure/localStorage/ui/LocalStorageUIStateRepository.ts`.
  - Добавлен порт `UIStateRepository` и use-cases `createUIStateUseCases(...)` в `src/features/game/application/*`.
  - `src/utils/uiStorage.ts` оставлен как временный совместимый bridge (старые импорты живут, но прямого localStorage там больше нет).

- **Блок 5 (Infrastructure adapters) — LocalStorage: templates + run history выполнено (без изменения поведения):**
  - `src/utils/storage.ts` (templates) стал bridge; I/O вынесен в `src/infrastructure/localStorage/templates/LocalStorageTemplatesRepository.ts` + порт/use-cases в `src/features/templates/application/*`.
  - `src/utils/statsStorage.ts` (run history) стал bridge; I/O вынесен в `src/infrastructure/localStorage/runHistory/LocalStorageRunHistoryRepository.ts` + порт/use-cases в `src/features/runHistory/application/*`.
  - Формирование записи забега (dedupe по `startTime`, `gameNumber`, `id/date/result/overheads`) теперь в application use-case, как “правило приложения”, а не в UI.

- **Блок 6 (Composition Root / Plugins) выполнен (без изменения поведения):**
  - `App.tsx` сделан тонким composition root: вынесены `AppShell` и `AppRouter` в `src/app/*`.
  - Плагины вынесены в `src/app/plugins/*` и могут отключаться env‑флагами через `src/app/appConfig.ts`.
  - “Граница” game‑ветки зафиксирована: `GameFlowRoot` владеет `GameSessionProvider`, а `GameScreen` использует `useGameSession()` как источник `state/dispatch`.
  - В новых файлах Блока 6 добавлены подробные русские комментарии (что/зачем/что делает/инварианты).

- **Блок 8 (RNG/Clock ports) выполнен (без изменения поведения):**
  - Добавлены порты `Rng` и `Clock` (domain) и дефолтные runtime‑реализации в application (`Math.random/Date.now`).
  - Домен (`gameReducer` + `deckFactory`) больше не вызывает `Math.random/Date.now` напрямую: всё идёт через `rng/clock`.
  - Инъекция сделана на границе game‑ветки: `GameFlowRoot` → `GameSessionProvider` создаёт reducer через `createGameReducer({ rng, clock })`.

## Текущее состояние (важно для продолжения)
- При старте Блока 6 всплыли ошибки сборки/дев‑сервера, связанные с резолвом импортов.
- Провели безопасную стабилизацию: унифицировали импорты на алиас `@/features/*` (вместо `@features/*`), чтобы `tsc` и Vite видели один и тот же путь.
- `npm run build` снова проходит (есть только предупреждения от bundler по `@supabase/supabase-js`, но билд завершается успешно).
- Доведён DoD Блока 6 по “отключаемости”: плагины (`DevQuestPlugin`, `OverlaysPlugin`) и `DevConsole` подключаются через конфиг `src/app/appConfig.ts` и могут быть выключены env‑флагами без правок фич.
- Доведена “граница” game‑ветки (Блок 6): `GameFlowRoot` теперь владеет жизненным циклом `GameSessionProvider`, а `GameScreen` читает `state/dispatch` из контекста (без изменения поведения).
- Доведено требование по документации кода (Блок 6): добавлены/расширены подробные русские “шапки” (что это/зачем/что делает/инварианты) в новых файлах `src/app/*`, `src/app/plugins/*` и связанных точках входа (без изменения поведения).

## Следующие Шаги (после V1)
- Дальше работаем **не блоками рефакторинга**, а задачами продукта/баланса/UX.
- При изменениях:
  - **игровая логика/правила** → обновлять `memory-bank/gameMechanics.md`,
  - **контент (спеллы/проклятия/абилки/пакеты)** → обновлять `memory-bank/gameContent.md`,
  - **HUD/UI паттерны/дизайн‑система** → обновлять `memory-bank/uiDesign.md` и при необходимости `memory-bank/infoHUD.md`.




## Правила Поддержки Документации (Documentation Maintenance Rules)
**КРИТИЧЕСКОЕ ПРАВИЛО:** Любые изменения в коде должны сопровождаться обновлением соответствующей документации в `memory-bank/`.

Ниже — актуальная “матрица” (высокоуровневая): какие зоны кода считаем источником истины и где это описано.

| Компонент / Система  | Файлы кода                                                           | Файл документации              |
| -------------------  | ----------                                                           | -----------------              |
| **Кошелёк**          | `src/features/wallet/application/*`, `src/infrastructure/supabase/wallet/*`, `src/stores/useWalletStore.ts` | `memory-bank/wallet.md` |
| **Auth**             | `src/features/auth/application/*`, `src/infrastructure/supabase/auth/*`, `src/stores/useAuthStore.ts` | `memory-bank/techContext.md` |
| **Notes**            | `src/features/notes/application/*`, `src/infrastructure/supabase/notes/*`, `src/stores/useNotesStore.ts` | `memory-bank/techContext.md` |
| **HUD / Интерфейс**  | `src/components/game/screens/GameScreen.tsx`, `src/components/game/hud/*`, `src/features/game/application/uiStateUseCases.ts`, `src/infrastructure/localStorage/ui/*`, `src/utils/uiStorage.ts` (bridge) | `memory-bank/infoHUD.md` |
| **Игровая механика** | `src/features/game/domain/reducer/gameReducer.ts`, `src/features/game/domain/deck/deckFactory.ts` | `memory-bank/gameMechanics.md` |
| **Контент**          | `src/content/` (источник истины), `src/data/*` (deprecated‑мосты)     | `memory-bank/gameContent.md` |
| **UI дизайн**        | `src/index.css`, Tailwind классы                                      | `memory-bank/uiDesign.md` |

---

## Последнее обновление
- 2025-12-19 — Зафиксировано завершение V1 (0–6, 8, 90): обновлены статусы и “матрица” код ↔ доки.
