# Прогресс разработки (Progress)

## 2025-12-20 — InfoHUD: скрытые dev‑функции (читы) + модалка “Добавить 💎”

**Сделано:**
- В InfoHUD добавлены скрытые кнопки рядом с `God Mode` (появляются: Info → глаз):
  - **Добавить 💎 герою** (рановая валюта `player.coins`) — теперь через модальное окно в стиле игры.
  - **Запланировать торговца на следующий раунд** — форс‑планирование визита.
- Добавлена модалка: `src/components/game/modals/CheatAddCoinsModal.tsx`.
- Подключение выполнено по нашей структуре UI:
  - UI‑флаг: `src/components/game/ui/useGameUiState.ts` (`showCheatAddCoins`),
  - хаб модалок: `src/components/game/modals/GameModals.tsx`,
  - открытие из `src/components/game/hud/GameBottomBar.tsx` через `src/components/game/screens/useGameScreenController.ts`.
- Доменная механика (source of truth) расширена:
  - новые `GameAction`: `CHEAT_ADD_COINS`, `CHEAT_SCHEDULE_MERCHANT_NEXT_ROUND`,
  - флаг `merchant.forceOpenNextRound` для читового открытия торговца.

**Документация:**
- Обновлены: `memory-bank/infoHUD.md`, `memory-bank/gameMechanics.md`.

## 2025-12-20 — Архивация “не актуальных” документов (Memory Bank)

**Сделано:**
- Создана папка `memory-bank/archive/` и добавлены архивы завершённых задач (по рефлексиям):
  - `memory-bank/archive/archive-traveling-merchant-v1.md`
  - `memory-bank/archive/archive-traveling-merchant-visual-v1.md`
  - `memory-bank/archive/archive-traveling-merchant-opaque-tokens-v1.md`
  - `memory-bank/archive/archive-traveling-merchant-new-game-while-active-v1.md`
  - `memory-bank/archive/archive-versioning-0-1.md`
  - `memory-bank/archive/archive-memory-bank-grouping-rollback-v1.md`
- Сохранён полный исторический снэпшот `tasks.md`:
  - `memory-bank/archive/archive-tasks-md-snapshot-2025-12-20.md`
- `memory-bank/tasks.md` очищен и возвращён к формату “текущая задача + индекс архивов”.

---

## 2025-12-19 — Архитектурный рефакторинг: Блок 1 (Game Domain Kernel)

**Сделано:**
- Выделено чистое ядро игры (Domain Layer) в `src/features/game/domain/`.
- Перенесены типы и модели в `src/features/game/domain/model/types.ts`.
- Перенесена логика редьюсера в `src/features/game/domain/reducer/gameReducer.ts`.
- Перенесена логика создания колоды в `src/features/game/domain/deck/deckFactory.ts`.
- Реализована обратная совместимость через ре-экспорты в `src/types/game.ts`, `src/utils/gameReducer.ts`, `src/utils/gameLogic.ts`.
- Проверена сборка: UI-компоненты успешно компилируются с новой структурой.
- Небольшая доводка: `domain/model/index.ts` теперь экспортирует `types`, а импорты `data/*` внутри domain переведены на алиасы `@/data/*` (без изменения поведения).
 - Документирование домена (без изменения логики):
   - Привели к русскому комментарии/шапки в `deckFactory.ts`, `model/types.ts`, `model/index.ts`, `logic/index.ts`,
   - Добили оставшиеся inline‑комментарии в `gameReducer.ts` (про `hasActed` / “Mark action”).

---

## 2025-12-19 — Архитектурный рефакторинг: Блок 2 (Application Layer) — начало

**Сделано (вертикальный срез, без изменения механики):**
- Добавлен application‑фасад `src/features/game/application/gameSession.ts`: “команды” игры мапятся на доменные `GameAction`.
- `src/components/GameScreen.tsx` частично переведён на новый вызов:
  - `gameSession.startGame(...)`
  - `gameSession.takeCardToHand(...)`
- Расширено покрытие команд в `gameSession` и мигрированы дополнительные места в `GameScreen`:
  - `useSpellOnTarget`, `sellItem`, `resetHand`, `activateCurse`.
- Подготовлен контейнер жизненного цикла для сессии (React‑адаптер в application слое):
  - `src/features/game/application/react/GameSessionProvider.tsx` (`GameSessionProvider`, `useGameSession`).
- Проверена сборка (`npm run build`) после изменений.

**Следующее:**
- Расширить покрытие команд (ещё 1–2 ключевых действия) и подготовить место, где “сессия” сможет жить между внутриигровыми экранами (в связке с Блоком 2A).

---

## 2025-12-19 — Архитектурный рефакторинг: Под‑блок 2A (inGameView / внутриигровая навигация) — прототип

**Сделано:**
- Добавлен внутренний “роутер” для game‑ветки: `src/features/game/ui/GameFlow.tsx`
  - `inGameView: 'combat' | 'pause'`
  - стек `history` + `goBack()` (Esc открывает/закрывает паузу)
  - `GameScreen` остаётся смонтированным → состояние забега не сбрасывается при `pause`.
- `src/App.tsx` теперь рендерит `GameFlow` вместо прямого `GameScreen` (App не знает деталей внутриигровых экранов).
- В `src/components/GameScreen.tsx` добавлена кнопка **“Пауза”** (проп `onOpenPause`).
- Проверена сборка (`npm run build`).

**Следующее:**
- По roadmap: **Блок 3** (UI‑декомпозиция `GameScreen`).

---

## 2025-12-19 — Архитектурный рефакторинг: Блок 3 (UI‑декомпозиция `GameScreen`) — прогресс

**Сделано (без изменения поведения):**
- Вынесены DnD обвязки из `GameScreen` в `src/components/game/dnd/`:
  - `InteractionZone`, `EnemySlotDropZone`, `SellZone`.
  - Дополнили русские inline‑комментарии в `EnemySlotDropZone` (условия canDrop + блок Fog/hidden).
- Вынесены HUD окна из `GameScreen` в `src/components/game/windows/`:
  - `OverheadStatsWindow`, `GameLogWindow`, `CardsViewer`.
  - Дополнили русские inline‑комментарии в `CardsViewer` (порядок отображения стопки).
- Вынесен UI‑примитив `DeckStatItem` в `src/components/game/hud/DeckStatItem.tsx`.
- Сведены модалки/оверлеи в единый компонент:
  - `src/components/game/modals/GameModals.tsx` (rules, curse picker+confirm, restart/exit confirm, HUD settings, card zoom, peek/scout, endgame overlay).
  - Привели к русскому “секционные” комментарии в `GameModals` (описание блоков пропсов/модалок, без изменения поведения).
- Вынесены верхняя/нижняя HUD панели из `GameScreen`:
  - `src/components/game/hud/GameTopBar.tsx`, `src/components/game/hud/GameBottomBar.tsx`
  - базовая кнопка нижней панели `src/components/game/hud/SystemButton.tsx`
- Вынесены визуальные эффекты из `GameScreen` в отдельные хуки:
  - `src/components/game/effects/useFloatingTextController.ts` (состояние + add/remove для floating texts)
  - `src/components/game/effects/useHeroVisualFx.ts` (HP/💎/armor/blessing: floating texts + shake/pulse/flash)
  - Привели к русскому/понятному виду inline‑комментарии в `useHeroVisualFx` и текст “🛡️ БЛОК” (без изменения поведения).
  - `src/components/game/effects/useSequentialHp.ts` (очередь анимации HP по `hpUpdates` → `visualHp`)
  - `GameScreen.tsx` дополнительно сокращён (до ~893 строк).
- Вынесены плавающие HUD‑окна в единый компонент:
  - `src/components/game/hud/HudWindows.tsx` (deck/discard viewer + stats/log/labels)
  - `GameScreen.tsx` дополнительно сокращён (до ~849 строк).
- Вынесен центральный аватар героя:
  - `src/components/game/board/PlayerAvatar.tsx`
  - `GameScreen.tsx` дополнительно сокращён (до ~824 строк).
- Вынесена центральная доска боя:
  - `src/components/game/board/GameBoard.tsx` (enemy slots + руки + рюкзак + PlayerAvatar)
  - Дополнили русские inline‑комментарии: почему `onInteract` у слотов рук задаём только для щита (чтобы не создавать ложную интерактивность).
  - `GameScreen.tsx` дополнительно сокращён (до ~744 строк).
- Вынесены боковые контролы основного экрана:
  - `src/components/game/board/LeftControls.tsx` (CurseSlot + “Сброс (-5HP)”)
  - `src/components/game/board/SellControl.tsx` (SellZone + кнопка продажи; сохраняет `sellButtonRef`)
  - `GameScreen.tsx` дополнительно сокращён (до ~710 строк).
- Вынесен layout‑контейнер боя:
  - `src/components/game/board/CombatLayout.tsx` (слоты left/center/right)
  - `GameScreen.tsx` дополнительно сокращён (до ~709 строк).
- Вынесены визуальные эффекты enemy slots:
  - `src/components/game/effects/useEnemySlotFloatingTexts.ts` (урон/хил/swap/mirror/воскрес/убежал/💀)
  - Дополнили русские inline‑комментарии: “воскрес” по новым id при `КЛАДБИЩЕ`, различение death/flee/недамажных удалений по логам, пояснения по diff.
  - `GameScreen.tsx` дополнительно сокращён (до ~617 строк).
- Вынесена логика stealth‑блокировки:
  - `src/components/game/effects/useStealthBlockFx.ts` (проверки + floating text “👻 СКРЫТ”)
  - Дополнили русские inline‑комментарии: правило stealth‑блокировки (пока есть другие non‑stealth монстры) и почему это UI‑уровень.
  - `GameScreen.tsx` дополнительно сокращён (до ~595 строк).
- Вынесен обработчик продажи (drop в SellZone):
  - `src/components/game/board/useSellDropHandler.ts` (валидаторы + floating‑фидбек + команда продажи)
  - Дополнили русские inline‑комментарии (почему запрещаем продажу из рук/заблокированного рюкзака/черепа; почему берём состояние через `stateRef`).
  - `GameScreen.tsx` дополнительно сокращён (до ~551 строк).
- Вынесены DnD/интеракшены боя:
  - `src/components/game/board/useCombatDnDActions.ts` (drop в руки/рюкзак, spell/weapon на монстра, взаимодействия с учётом stealth)
  - Дополнили русские inline‑комментарии: почему определяем `weapon_left/weapon_right` по текущему state (поведение 1:1).
  - `GameScreen.tsx` дополнительно сокращён (до ~498 строк).
- Вынесены UI-эффекты таймеров и silence:
  - `src/components/game/effects/useTimedPeekScoutClear.ts` (CLEAR_PEEK/CLEAR_SCOUT по таймерам)
  - `src/components/game/effects/useSilenceBlockedFx.ts` (floating text по логу “МОЛЧАНИЕ: Магия заблокирована”)
  - `GameScreen.tsx` дополнительно сокращён (до ~472 строк).
- Вынесены вычисляемые данные HUD:
  - `src/components/game/hud/useHudComputedData.ts` (deck/discard stats, active buffs, active labels, safe cleanDeck)
  - `GameScreen.tsx` дополнительно сокращён (до ~428 строк).
- Вынесен watcher `lastEffect`:
  - `src/components/game/effects/useLastEffectFloatingTexts.ts` (corrosion/corpseeater → floating texts)
  - Дополнили русские inline‑комментарии: как выбираем DOM‑ref цели для “corrosion” (рука/рюкзак) для корректного позиционирования FX.
  - `GameScreen.tsx` дополнительно сокращён (до ~402 строк).
- Вынесено состояние позиций HUD окон:
  - `src/components/game/hud/useHudWindowPositions.ts` (load/save/reset layout)
  - `GameScreen.tsx` дополнительно сокращён (до ~392 строк).
- Вынесена видимость HUD окон:
  - `src/components/game/hud/useHudVisibility.ts` (load/save)
  - `GameScreen.tsx` без изменений по строкам (~392), но стал тоньше по ответственности.
- Вынесено локальное UI-состояние экрана:
  - `src/components/game/ui/useGameUiState.ts` (модалки/подтверждения/selected card/curse picker)
  - `GameScreen.tsx` по строкам примерно сопоставим (~403), но проще по структуре.
- Вынесено правило выбора карты для зума/описания:
  - `src/components/game/ui/useCardSelection.ts` (1:1 со старым `handleCardClick` в `GameScreen`)
- Вынесен UI-флоу активации проклятия (picker → confirm → activate → cleanup):
  - `src/components/game/ui/useCurseActivationFlow.ts` (1:1 со старой inline-логикой в `GameScreen`)
- Вынесен эффект блокировки пасхалки Lumos/Nox при проклятии “Тьма”:
  - `src/components/game/effects/useDarknessFlashlightLock.ts` (1:1 со старым useEffect в `GameScreen`)
  - Дополнили русские inline‑комментарии (unlock при размонтировании/смене проклятия).
- Вынесен флоу старта/рестарта забега:
  - `src/components/game/ui/useStartGameFlow.ts` (start on mount + единый `restartGame`, 1:1 с прежними вызовами в `GameScreen`)
- Вынесено правило доступности “Сброс (-5HP)” и обработчик сброса:
  - `src/components/game/board/useHandResetControl.ts` (1:1 с прежним `canReset` + `handleReset` в `GameScreen`)
- Добавлен общий хелпер для stale-closure guard:
  - `src/shared/react/useLatestRef.ts` (применён в `GameScreen` вместо `stateRef.current = state`, поведение 1:1)
- Вынесены эффекты завершения забега:
  - `src/components/game/effects/useRunCompletionEffects.ts` (saveRun + начисление кристаллов)
  - Дополнили русские inline‑комментарии: награда кристаллами начисляется только при победе.
  - `GameScreen.tsx` дополнительно сокращён (до ~399 строк).
- Вынесены вычисляемые флаги поля:
  - `src/components/game/board/useBoardComputedFlags.ts` (isSellBlocked/hasWeb/getCardModifier)
  - `GameScreen.tsx` дополнительно сокращён (до ~377 строк).
- Технический фикс TypeScript (чисто инфраструктурно, без изменения логики игры):
  - `tsconfig.json`: добавлены `allowSyntheticDefaultImports`, `esModuleInterop`.
  - `src/main.tsx`: корректный импорт `createRoot` из `react-dom/client`.
- Проверена сборка (`npm run build`).
- Техническая стабилизация линта после выноса кода (без изменения поведения):
  - `npm run lint` снова проходит (исправлены `no-case-declarations`/`prefer-const` в `src/features/game/domain/reducer/gameReducer.ts` только структурными правками).
  - Продолжили перевод англоязычных комментариев в `src/features/game/domain/reducer/gameReducer.ts` (kill/spawn/passive/mirror/attack/miss + “Туман” + hidden/silence checks).
  - Почищены зависимости `useEffect` (warnings `react-hooks/exhaustive-deps`) в `src/App.tsx`, `src/components/MainMenu.tsx`, `src/components/Chalkboard.tsx`, `src/components/NotesModal.tsx`.
  - Вынесена константа `DEFAULT_MONSTER_GROUPS` в `src/components/MonstersEditor.defaults.ts` (убрано предупреждение `react-refresh/only-export-components`).
- Структурное улучшение Блока 3 (screen-компоновка):
  - `GameScreen` перенесён в `src/components/game/screens/GameScreen.tsx`.
  - `src/components/GameScreen.tsx` оставлен как proxy‑реэкспорт (совместимость).
  - Проверено: `npm run lint` и `npm run build` проходят после переноса.
 - Дальнейшая чистка `GameScreen` (без изменения поведения):
   - Вынесена glue‑логика `GameScreen` в `src/components/game/screens/useGameScreenController.ts`.
   - `GameScreen.tsx` стал в основном layout‑компоновкой.
   - Дополнили русские inline‑комментарии в `useGameScreenController`: `stateRef` как защита от stale-closure, refs слотов/кнопки продажи для координат FX, “Тьма” как UI-only lock.
   - Привели к русскому заголовки секций в `return` (state/UI/HUD/derived/refs/handlers/view-model props).
   - Проверено: `npm run lint` и `npm run build` проходят после выноса.
 - Чистка “слоёв сцены” (без изменения поведения):
   - Вынесены фон/оверлеи (background + тьма + баннер проклятия + floating texts) в `src/components/game/screens/GameSceneOverlays.tsx`.
   - Проверено: `npm run lint` и `npm run build` проходят.
 - Чистка HUD-слоя (без изменения поведения):
   - Вынесены `GameTopBar` + `HudWindows` + `GameBottomBar` в `src/components/game/screens/GameHudLayer.tsx`.
   - `GameScreen.tsx` стал ещё более компоновочным.
   - Проверено: `npm run lint` и `npm run build` проходят.
 - Хотфикс layout HUD (без изменения поведения):
   - HUD-слой сделан overlay-слоем: `GameHudLayer` теперь `absolute inset-0` + аккуратные `pointer-events`.
   - `GameTopBar` закреплён сверху, `GameBottomBar` закреплён снизу (меню New Game/Пауза/Правила/Info снова внизу).
 - Чистка боевой компоновки (без изменения поведения):
   - Вынесены `CombatLayout` + `LeftControls` + `GameBoard` + `SellControl` в `src/components/game/screens/GameCombatLayer.tsx`.
   - Проверено: `npm run lint` и `npm run build` проходят.
 - Упрощение `GameScreen` через view-model (без изменения поведения):
   - Построение props для слоёв вынесено в `src/components/game/screens/useGameScreenController.ts` (`sceneOverlaysProps / hudLayerProps / combatLayerProps / modalsPropsBase`).
   - `GameScreen.tsx` стал максимально декларативным (с минимальными инъекциями `onExit/onOpenPause`).
   - Проверено: `npm run lint` и `npm run build` проходят.
 - Декомпозиция `GameFlow` (pause overlay / inGameView) — без изменения поведения:
   - Логика `inGameView/history/Esc` вынесена в `src/features/game/ui/useGameFlowController.ts`.
   - Дополнили русские inline‑комментарии в `useGameFlowController` (подписи к props/actions + Esc-навигация).
   - `src/features/game/ui/GameFlow.tsx` стал тонкой компоновкой (GameScreen всегда смонтирован; pause overlay поверх).
   - Проверено: `npm run lint` и `npm run build` проходят.
 - Документирование UI-файлов (Блок 3, без изменения поведения):
   - Уточнены/уплотнены “шапки” (объясняющие комментарии) у DnD-компонентов (`src/components/game/dnd/*`) и окон HUD (`src/components/game/windows/*`).
   - Проверено: `npm run lint` проходит.
   - Уточнены/уплотнены “шапки” у UI-хуков (`src/components/game/ui/*`).

---

## 2025-12-19 — Архитектурный рефакторинг: Блок 4 (Content Layer) — старт

**Сделано (Шаги 4.1–4.2, без изменения поведения):**
- Добавлен контейнер контента `GameContent` и типы *Definition в `src/content/gameContent.ts`.
- Добавлен сборщик `createGameContent('base')`; `base` pack собирается из модулей `src/content/*`.
- Добавлен публичный вход `src/content/index.ts`.

**Сделано (Шаг 4.3 — curses, без изменения поведения):**
- Проклятия перенесены из `src/data/curses.ts` в `src/content/curses/baseCurses.ts` (новый источник истины).
- `src/data/curses.ts` оставлен как deprecated‑мост (реэкспорт из content слоя).
- UI больше не импортит `data/curses` напрямую:
  - `CursePicker`, `CurseSlot`, `CurseActivationBanner`, `DeckbuilderScreen`, confirm-текст в `GameModals`.
  - Все эти места получают список/мету через `baseGameContent` (`src/features/game/application/gameContent.ts`).
- Domain больше не импортит `data/curses` напрямую:
  - `GameAction['ACTIVATE_CURSE']` расширен опциональным `curseMeta`,
  - `gameReducer` берёт имя для лога из `action.curseMeta` (fallback: id).

**Сделано (Шаг 4.4 — spells, без изменения поведения):**
- Заклинания перенесены из `src/data/spells.ts` в `src/content/spells/baseSpells.ts` (новый источник истины).
- `src/data/spells.ts` оставлен как deprecated‑мост (реэкспорт из content слоя).
- UI больше не импортит `data/spells` напрямую:
  - `SpellPicker`, `SpellsEditor`, `PlayerAvatar`, `DeckbuilderScreen`.
- Domain больше не импортит `data/spells` напрямую:
  - `START_GAME` расширен `content` (минимальный snapshot: `baseSpellIds` + `spellsById`),
  - `createDeck(content)` использует spell‑meta для создания spell-карт.

**Сделано (Шаг 4.5 — monsterAbilities, без изменения поведения):**
- Способности монстров перенесены из `src/data/monsterAbilities.ts` в `src/content/monsterAbilities/baseMonsterAbilities.ts` (новый источник истины).
- `src/data/monsterAbilities.ts` оставлен как deprecated‑мост (реэкспорт из content слоя).
- UI больше не импортит `data/monsterAbilities` напрямую:
  - `CardComponent`, `AbilityPicker`, `MonstersEditor`, `MonsterGroupEditor`, `GameModals`.
- Domain больше не импортит `data/monsterAbilities` напрямую:
  - `START_GAME.content` расширен `monsterAbilitiesById`,
  - генерация кастомных монстров использует meta из `action.content`.

**Сделано (документирование кода Блока 4, без изменения поведения):**
- Добавлены/расширены понятные русские “шапки” (что это / зачем) в файлах Блока 4:
  - content слой: `src/content/*` (definitions/modules/container),
  - application/domain glue: `gameSession.ts`, `model/types.ts`, `deckFactory.ts`, `gameReducer.ts`,
  - UI‑потребители контента: пикеры/редакторы/карточки/модалки/декбилдер (`baseGameContent`).
- Проверено: `npm run build` проходит.

**Следующее:**
- По roadmap: **Блок 5 — Infrastructure adapters** (Supabase → затем LocalStorage), начать с wallet.

---

## 2025-12-19 — Архитектурный рефакторинг: Блок 5 (Infrastructure adapters) — старт с wallet

**Сделано (Шаг 5.1 — wallet, без изменения поведения):**
- Добавлен порт `WalletRepository` (application слой): `src/features/wallet/application/ports/WalletRepository.ts`.
- Добавлены use-cases `createWalletUseCases(...)`: `src/features/wallet/application/walletUseCases.ts`.
- Добавлен инфраструктурный адаптер `SupabaseWalletRepository`: `src/infrastructure/supabase/wallet/SupabaseWalletRepository.ts`.
- `src/stores/useWalletStore.ts` больше не вызывает Supabase напрямую (store использует use-cases + repo).

**Следующее:**
- Продолжить Блок 5 по плану: Supabase `auth` (аккуратно оформить подписки), затем `notes`.

---

## 2025-12-19 — Архитектурный рефакторинг: Блок 5 (Infrastructure adapters) — Supabase auth

**Сделано (Шаг 5.2 — auth, без изменения поведения):**
- Добавлен порт `AuthRepository` (application слой): `src/features/auth/application/ports/AuthRepository.ts`.
- Добавлены use-cases `createAuthUseCases(...)`: `src/features/auth/application/authUseCases.ts`.
- Добавлен инфраструктурный адаптер `SupabaseAuthRepository`: `src/infrastructure/supabase/auth/SupabaseAuthRepository.ts`.
- `src/stores/useAuthStore.ts` больше не вызывает Supabase напрямую; store использует use-cases + repo.
- `src/components/AuthModal.tsx` больше не импортит Supabase напрямую (использует методы `useAuthStore`).
- Подписка `onAuthStateChange` теперь имеет единственного владельца (`useAuthStore`) и корректно очищается (защита от утечек/дубликатов).

**Проверено:**
- `npm run lint` проходит.
- `npm run build` проходит.

**Следующее:**
- По плану Блока 5: Supabase `notes` (вынести CRUD + realtime подписки из `useNotesStore.ts`), затем LocalStorage‑репозитории.

---

## 2025-12-19 — Архитектурный рефакторинг: Блок 5 (Infrastructure adapters) — Supabase notes

**Сделано (Шаг 5.3 — notes, без изменения поведения):**
- Добавлен порт `NotesRepository` (application слой): `src/features/notes/application/ports/NotesRepository.ts`.
- Добавлены use-cases `createNotesUseCases(...)`: `src/features/notes/application/notesUseCases.ts`.
- Добавлен инфраструктурный адаптер `SupabaseNotesRepository`: `src/infrastructure/supabase/notes/SupabaseNotesRepository.ts`.
- `src/stores/useNotesStore.ts` больше не вызывает Supabase напрямую; store использует use-cases + repo.
- Realtime‑подписка на заметки теперь корректно управляется через `dispose()` конкретного канала (без `removeAllChannels()`).

**Проверено:**
- `npm run build` проходит.

**Следующее:**
- По плану Блока 5: LocalStorage‑подсистемы — вынести `uiStorage.ts` (HUD layout/visibility), затем `storage.ts` (templates), затем `statsStorage.ts` (run history).

---

## 2025-12-19 — Архитектурный рефакторинг: Блок 5 (Infrastructure adapters) — LocalStorage uiStorage (HUD state)

**Сделано (без изменения поведения):**
- Добавлен порт `UIStateRepository`: `src/features/game/application/ports/UIStateRepository.ts`.
- Добавлены use-cases `createUIStateUseCases(...)`: `src/features/game/application/uiStateUseCases.ts`.
- Добавлен инфраструктурный адаптер `LocalStorageUIStateRepository`: `src/infrastructure/localStorage/ui/LocalStorageUIStateRepository.ts`.
- `src/utils/uiStorage.ts` перестал напрямую использовать localStorage и стал thin‑bridge к use-case’ам (обратная совместимость для текущих импортов UI-хуков).

**Проверено:**
- `npm run build` проходит.

**Следующее:**
- Продолжить LocalStorage миграцию по плану: `storage.ts` (templates) → `statsStorage.ts` (run history).

---

## 2025-12-19 — Архитектурный рефакторинг: Блок 5 (Infrastructure adapters) — LocalStorage templates + run history

**Сделано (без изменения поведения):**
- Шаблоны колод (templates):
  - Добавлен порт `TemplatesRepository`: `src/features/templates/application/ports/TemplatesRepository.ts`.
  - Добавлены use-cases `createTemplatesUseCases(...)`: `src/features/templates/application/templatesUseCases.ts`.
  - Добавлен инфраструктурный адаптер `LocalStorageTemplatesRepository`: `src/infrastructure/localStorage/templates/LocalStorageTemplatesRepository.ts`.
  - `src/utils/storage.ts` стал thin‑bridge (прямого localStorage там больше нет).
- История забегов (run history):
  - Добавлен порт `RunHistoryRepository`: `src/features/runHistory/application/ports/RunHistoryRepository.ts`.
  - Добавлены use-cases `createRunHistoryUseCases(...)`: `src/features/runHistory/application/runHistoryUseCases.ts`.
  - Добавлен инфраструктурный адаптер `LocalStorageRunHistoryRepository`: `src/infrastructure/localStorage/runHistory/LocalStorageRunHistoryRepository.ts`.
  - `src/utils/statsStorage.ts` стал thin‑bridge (прямого localStorage там больше нет).
  - Логика форматирования записи забега (dedupe по `startTime`, `gameNumber`, `id/date/result/overheads`) перенесена в application use-case.

**Проверено:**
- `npm run build` проходит.

**Следующее:**
- Блок 5: финальная ревизия (убедиться, что в сторах/компонентах нет прямого Supabase/LocalStorage для мигрированных подсистем).
- Затем по roadmap перейти к Блоку 6 (Composition Root / Plugins).

---

## 2025-12-19 — Архитектурный рефакторинг: Блок 5 — финальная ревизия (DoD)

**Сделано:**
- Проверено поиском по коду (grep), что для мигрированных подсистем **нет прямых** обращений к Supabase/LocalStorage в UI/stores:
  - `supabase` импортится только в `src/lib/supabase.ts` и в `src/infrastructure/supabase/*` (auth/notes/wallet).
  - Ключи `skazmor_ui_state / skazmor_templates / skazmor_run_history` и прямой `localStorage.*` для этих подсистем находятся только в `src/infrastructure/localStorage/*` и в bridge‑файлах `src/utils/{uiStorage,storage,statsStorage}.ts`.
- Зафиксировано осознанное исключение (вне scope подсистем Блока 5): `src/components/NotesModal.tsx` использует localStorage для локального режима заметок/окна без авторизации.

**Результат:**
- DoD Блока 5 для мигрированных подсистем выполнен: I/O сосредоточен в `src/infrastructure/*`, UI/stores работают через use-cases/bridge.

---

## 2025-12-19 — Блок 6 (Composition Root / Plugins) — техническая стабилизация (без изменения поведения)

**Сделано:**
- Унифицировали алиасы импортов: перевели использования `@features/*` на `@/features/*`, чтобы резолвинг был одинаковым для `tsc` и Vite.
- Добавлен конфиг подключения плагинов `src/app/appConfig.ts` + env‑флаги для отключения:
  - `VITE_DEVQUEST_ENABLED=false`
  - `VITE_OVERLAYS_ENABLED=false`
  - `VITE_DEVCONSOLE_ENABLED=false`
- Подключён `GameSessionProvider` на границе game‑ветки: `src/app/game/GameFlowRoot.tsx` теперь владеет жизненным циклом сессии, а `useGameScreenController` берёт `state/dispatch` из `useGameSession()`.
- Доведено требование “подробные русские комментарии” для Блока 6: добавлены/расширены шапки (что это/зачем/что делает/инварианты) в файлах `src/app/*` и `src/app/plugins/*`, а также в ключевых точках game‑ветки, где Блок 6 задаёт границы.

**Проверено:**
- `npm run build` проходит (есть предупреждения bundler’а по `@supabase/supabase-js`, но сборка успешная).

---

## 2025-12-19 — Блок 8 (RNG/Clock ports) — выполнен (без изменения поведения)

**Сделано:**
- Добавлены порты домена:
  - `src/features/game/domain/ports/Rng.ts`
  - `src/features/game/domain/ports/Clock.ts`
- Добавлены дефолтные runtime‑реализации (application слой):
  - `src/features/game/application/runtime/defaultRuntime.ts` (`defaultRng`/`defaultClock` поверх `Math.random/Date.now`)
- Доменный код переведён на зависимости:
  - `src/features/game/domain/deck/deckFactory.ts` (id/shuffle через `rng`)
  - `src/features/game/domain/reducer/gameReducer.ts` (id/timestamps/случайные выборы/“Туман” через `rng/clock`)
- Инъекция сделана на границе game‑ветки:
  - `src/app/game/GameFlowRoot.tsx` передаёт `rng/clock` в `GameSessionProvider`
  - `src/features/game/application/react/GameSessionProvider.tsx` создаёт reducer через `createGameReducer({ rng, clock })` и initial state через `createInitialState({ clock })`

**Проверено:**
- `npm run lint` проходит
- `npm run build` проходит

---

## 2025-12-19 — Блок 90 (Memory Bank docs refresh) — старт планирования формата

**Сделано (выполнено, без изменения поведения):**
- Обновлён мини‑план `memory-bank/refactor/blocks/block-90-memory-bank-docs-refresh.md` и зафиксирован единый формат документов.
- Добавлены/обновлены опорные точки входа:
  - `memory-bank/README.md` (индекс/навигация),
  - `memory-bank/_templates/doc-template.md` (шаблон).
- Приведены к фактической архитектуре и источникам истины:
  - `memory-bank/systemPatterns.md`
  - `memory-bank/techContext.md`
  - `memory-bank/infoHUD.md`
  - `memory-bank/projectbrief.md`, `memory-bank/productContext.md`
  - `memory-bank/wallet.md`, `memory-bank/devQuest.md`
  - `memory-bank/gameMechanics.md`, `memory-bank/gameContent.md`
- Обновлён чекпойнт `memory-bank/activeContext.md` под финальный статус V1.

---

## 2025-12-19 — Архитектурный рефакторинг (Clean Architecture, V1) — завершён

**Итог:**
- Все блоки из `memory-bank/refactor/roadmap-v1.md` выполнены: **0–6, 8, 90**.
- Источники истины закреплены:
  - **domain**: `src/features/*/domain/*` (в т.ч. `src/features/game/domain/*`)
  - **application**: `src/features/*/application/*`
  - **ui**: `src/components/*` и `src/features/*/ui/*` (где уместно)
  - **content**: `src/content/*` (а `src/data/*` — deprecated‑мосты)
  - **infrastructure**: `src/infrastructure/*`
- Документация Memory Bank приведена к актуальным путям и правилам обновления.

## 2025-12-19 — Архитектурный рефакторинг: Блок 0 (Guardrails)

**Сделано:**
- Создана структура папок Clean Architecture:
  - `src/features/` (с `README.md` о правилах Bounded Contexts)
  - `src/shared/`
  - `src/infrastructure/`
  - `src/content/`
- Настроены алиасы путей (`@/`, `@features/`, `@shared/`, `@infrastructure/`, `@content/`) в `tsconfig.json` и `vite.config.ts`.
- Проверена корректность сборки (`npm run build`) с новыми настройками.
- Блок 0 завершён.

---

## 2025-12-18 — Проклятья (Curses)

**Сделано:**
- Добавлена/доведена механика **Проклятий** (перманентный модификатор забега).
- Реализован выбор проклятия **до первого действия** (после первого действия выбор блокируется).
- Добавлено подтверждение применения проклятия (необратимо).
- Реализованы проклятия:
  - **☁️ Туман**: скрывает 2 случайные карты в каждом раунде; скрытые карты нельзя трогать; раскрытие при ≤2 карт на столе.
  - **🌕 Полнолуние**: при смерти одного монстра лечит остальных на +1 HP, но не выше maxHP.
  - **🥦 Отравление**: зелья лечат на 1 HP меньше (стакается с Гнилью).
  - **🛠️ Закалка**: оружие наносит на 1 урон больше (учитывается в Mirror).
  - **💰 Жадность**: любая монета даёт +2 💎 сверху (номинал не меняется; Offering не усиливает).
  - **🌑 Тьма**: визуальный режим “темнота + круг света вокруг мышки” в игре и в декбилдере; отключает пасхалку Lumos/Nox.
- UI:
  - Слот проклятия как **монета/токен** размещён **слева от кнопки “Сброс (-5HP)”**.
  - Добавлен крупный баннер “Проклятие активировано” над полем.
  - Универсальная “рубашка” скрытых карт (без иконки облака).
  - Обновлён UI “Правила”: добавлен блок про проклятия для игрока + визуальный пример токена.
- Декбилдер:
  - Проклятие вынесено в отдельную секцию “Модификаторы”.
  - Экран декбилдера переведён на layout с **внутренним скроллом** (фикс. хедер/футер).

**Осталось:**
- Ручная верификация по чеклисту (прогоны сценариев). ✅ Проверено пользователем (2025-12-18): “вроде всё работает”.


---

## 2025-12-19 — Архитектурный рефакторинг (Clean Architecture) — планирование

**Сделано (планы/чекпойнт):**
- Создан главный документ планирования: `memory-bank/refactor/plan-v1.md`.
- Создан roadmap порядка внедрения: `memory-bank/refactor/roadmap-v1.md`.
- Созданы мини‑планы блоков (0–6, 8, 90).
- Зафиксированы ключевые решения (ре-экспорты разрешены, сессия живёт между экранами, контент-паки через registry).

**Следующее (что планируем дальше):**
- Блок 2 (Application Layer) — GameSession.

---

## 2025-12-19 — Traveling Merchant: Партия 1 (merchant overlay + “уйти”) — выполнено

**Сделано (без покупки/эффектов артефактов, только базовый флоу):**
- Domain (`src/features/game/domain/reducer/gameReducer.ts`, `src/features/game/domain/model/types.ts`):
  - Добавлен `GameState.merchant` (Variant B: overlay поверх стола).
  - На старте забега планируется торговец: 40% шанс + `scheduledRound`.
  - Торговец может появиться **только между раундами**, **после `round++`**, и только если на столе была **ровно 1 карта** (если 0 — не появляется).
  - При появлении создаются 3 “товара” (🦁/🗡️/📜) и токен **🚪 “Уйти”**; 🚪 перекрывает слот с последней картой.
  - `MERCHANT_LEAVE` закрывает торговца и делает обычный добор 3 карт из деки.
  - Во время торговца заблокированы бой/касты/сброс/прочие действия, разрешены только:
    - “уйти”,
    - ровно 1 продажа предмета из рюкзака (строго `backpack`).
- UI:
  - Overlay токены рисуются поверх слотов в `GameBoard`.
  - “🚪 Уйти” можно перетаскивать на героя или в пустой слот инвентаря (команда `gameSession.leaveMerchant()`).

**Проверено:**
- `npm run build` проходит **вне sandbox** (в sandbox наблюдается нестабильность резолва алиасов/реэкспортов — ранее уже встречалось).

**Следующее:**
- Партия 2: покупка артефакта за 15💎 (DnD в слот), блокировка покупки при нехватке 💎 + UX “не хватает”.
- Партия 3: эффекты артефактов (🦁/🗡️/📜) и перенос артефактов в content-пул (под будущий рандомный набор).

---

## 2025-12-19 — Traveling Merchant: Партия 2 (покупка за 15💎) — выполнено

**Сделано:**
- Domain:
  - Добавлено действие покупки: `MERCHANT_BUY`.
  - Валидации покупки:
    - цена фиксированная **15💎** (`state.player.coins`),
    - только в **пустой** слот (лев/прав/рюкзак),
    - слот не должен быть заблокирован.
  - По ТЗ: **покупка закрывает магазин сразу** и запускает **обычный добор 3 карт из деки** (как при “🚪 Уйти”).
  - Во время торговца: разрешена строго 1 продажа предмета и только из `backpack` (добавлена UI-валидация + доменная защита).
- UI:
  - Товары торговца теперь **draggable**, но блокируются при нехватке 💎 (серость + запрет drag).
  - На токенах товаров показан бейдж цены **💎15**.
  - Drop товара в пустой слот инвентаря отправляет `MERCHANT_BUY`.

**Проверено:**
- `npm run lint` — OK
- `npm run build` — OK (вне sandbox; в sandbox бывают расхождения резолва алиасов)

**Следующее:**
- Партия 3: эффекты артефактов (🦁/🗡️/📜) + обновление `memory-bank/gameContent.md` “как контент” (под будущий пул/рандом).

---

## 2025-12-19 — Traveling Merchant: Партия 3 (эффекты артефактов) — выполнено

**Сделано:**
- 🦁 `bravery_potion`:
  - drop на героя → `USE_BRAVERY_POTION`: -4 HP (в God Mode игнор), затем +2 maxHp, затем в `discardPile`.
- 🗡️ `claymore`:
  - атакует как оружие (drag на монстра),
  - **остаётся в руке** и теряет прочность на **HP монстра до удара**,
  - ломается при 0 и уходит в `discardPile`,
  - учитывается `mirror` как оружие по текущей прочности.
- 📜 `prayer_spell`:
  - drag “Молитву” на spell-карту в руке → `CAST_PRAYER`:
    - копия спелла (по `spellType`) появляется в рюкзаке,
    - если рюкзак занят/заблокирован `web` — не срабатывает,
    - “Молчание” (`silence`) блокирует каст,
    - сама “Молитва” уходит в `discardPile`.

**Проверено:**
- `npm run lint` — OK
- `npm run build` — OK (вне sandbox)

**Следующее:**
- Если ок по UX/балансу — можно переходить к “полишу” (улучшить визуал артефактов, отдельные логи/тултипы) и/или к следующей фиче.

---

## 2025-12-19 — Traveling Merchant: UX polish (логи фейлов + стили токенов) — выполнено

**Сделано:**
- Добавлены явные лог-сообщения при неудачной активации:
  - 🦁 “Храбрость”: слот заблокирован / карта не найдена / неверный тип.
  - 📜 “Молитва”: слот заблокирован / карта не найдена / неверная цель (не spell в руке).
- Визуально выделены `CardType` артефактов торговца (рамка/фон) в `CardComponent`:
  - 🦁 — amber,
  - 📜 — indigo (более светлая рамка),
  - 🗡️ — светлее stone.
- Дизайн-правила зафиксированы в `memory-bank/uiDesign.md` (A2 таблица).

---

## 2025-12-19 — Traveling Merchant: Visual v2 (баннер + описания + “золото”) — planning завершён

**Зафиксировано в ТЗ:**
- Баннер по центру над сеткой, 3–5 строк, текст + иконки, всегда виден; 🎩 в заголовке; “Тьма” затемняет и баннер.
- Описания артефактов по клику — как у заклинаний; на таче tap=описание, hold-to-drag; доступно всегда.
- “Золото” артефактов: amber‑400 + лёгкий glow + мягкий shimmer (3–4 сек/цикл), shimmer остаётся даже при “не хватает 💎”; 🚪 “Уйти” — отдельный стиль.

**Док:** `memory-bank/travelingMerchantVisual.md`

**Партия 1 (сделано):**
- Добавлен баннер 🎩 “Странствующий торговец” над сеткой слотов, видимый всё время пока активен магазин (pop-in).
- Герой подсвечивается как drop‑цель для 🚪 “Уйти” (amber‑ring при наведении/дропе).

**Партия 2 (сделано):**
- Клик по артефактам торговца (🦁/🗡️/📜) открывает описание **как у заклинаний** — и в магазине (оверлей), и когда артефакт лежит в инвентаре.
- На тач‑устройствах включён **hold‑to‑drag** (задержка старта drag), чтобы обычный тап работал как “открыть описание”.

**Партия 3 (сделано):**
- Артефакты торговца (🦁/🗡️/📜) переведены на единый “золотой” стиль: `border-amber-400` + лёгкий glow + мягкий shimmer (≈3–4с).
- Shimmer **не отключается** при “не хватает 💎” (остаётся, но общий blocked‑стейт даёт серость/opacity).
- 🚪 “Уйти” получил отдельный стиль (определяется по `merchantAction: 'leave'`).
- Обновлена дизайн‑система: `memory-bank/uiDesign.md` (A2 таблица).

**Финал баннера (v1):**
- Позиционирование доведено до “как задумано”: по центру **над 4 верхними слотами**, баннер **не сдвигает поле** (только absolute overlay).

---

## 2025-12-19 — Traveling Merchant: hotfix появления (планирование раунда + диагностика)

**Проблема:**
- Планирование `scheduledRound` предполагало добор **по 3 карты**, но при переходе раунда с пустым столом добирается **4** → иногда выбирался раунд, который в забеге фактически не наступал.

**Фикс:**
- Планирование `scheduledRound` переведено на консервативную оценку **/4** (без изменения “40% на забег”).
- Добавлен диагностический лог на старте забега: “🎩 торговец будет/не будет…”, чтобы проверять выпадение без угадываний.

---

## 2025-12-20 — DnD: drag-preview offset fix (кастомный DragLayer) — WIP (paused)

**Контекст/проблема:**
- При перетаскивании некоторых токенов (особенно 🗡️ **Клеймор** у торговца) drag-preview визуально “уезжал” относительно курсора.
- Причина: нативный HTML5 drag-preview плохо дружит с `transform/scale` (у нас hover-scale + `framer-motion`).

**Сделано:**
- Введён кастомный drag-preview слой `GameDragLayer` (react-dnd `useDragLayer`) и подавлен нативный preview через `getEmptyImage()` в `CardComponent`.
- Добавлена попытка эмуляции **snapback** (плавный возврат при отмене drag, если отпустили вне валидной drop-зоны).
- Drop-зоны начали возвращать `dropResult: { accepted: true }` для более надёжного отличения “успешного drop” от отмены.

**Файлы:**
- `src/components/CardComponent.tsx`
- `src/components/game/dnd/GameDragLayer.tsx`
- `src/components/game/dnd/CardDragPreview.tsx`
- `src/components/game/dnd/dragSnapbackBus.ts`
- `src/app/AppShell.tsx`
- Drop-zones: `src/components/Slot.tsx`, `src/components/game/board/PlayerAvatar.tsx`, `src/components/game/dnd/EnemySlotDropZone.tsx`, `src/components/game/dnd/SellZone.tsx`

**Документация:**
- `memory-bank/uiDesign.md` — зафиксировано правило про кастомный DragLayer + snapback.

**Известная проблема (не закрыто):**
- В Chrome отмена drag (“snapback” при отпускании в пустоте) всё ещё ощущается **неидеально** (со слов пользователя: “задержка”, “мигание” при возврате монеты в слот).
- Работу по полишу snapback **временно остановили**.
