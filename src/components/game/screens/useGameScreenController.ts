/**
 * useGameScreenController — view-model/контроллер экрана боя.
 *
 * Слой: UI (React view-model).
 *
 * ## Что это
 * “Контроллер” (view-model) экрана боя: здесь собрана вся склейка UI‑уровня
 * вокруг доменного состояния игры:
 * - вычисляемые значения для HUD/поля,
 * - refs DOM‑элементов (для позиционирования FX),
 * - обработчики событий (DnD/клики/кнопки),
 * - UI‑эффекты (floating texts, таймеры peek/scout, визуальные реакции и т.д.).
 *
 * Сам `GameScreen.tsx` остаётся компоновкой JSX.
 *
 * ## Зачем
 * - Уменьшить `GameScreen` и сделать его переиспользуемым экранным “шаблоном”.
 * - Иметь одно место, где видно всю “склейку” боя, не смешивая это с JSX.
 * - Сохранить поведение 1:1 при выносе кода (рефакторинг без изменения механики).
 *
 * ## Откуда берётся `GameState`
 * В Блоке 6 источник истины состояния забега — `GameSessionProvider` (граница game‑ветки).
 * Этот хук получает `state/dispatch` через `useGameSession()`.
 *
 * ## Что делает
 * - Берёт `state/dispatch` из `useGameSession()`.
 * - Подключает UI‑эффекты (floating texts, hero fx, stealth block, timers и т.д.).
 * - Собирает “props view-model” для слоёв экрана:
 *   `sceneOverlaysProps / hudLayerProps / combatLayerProps / modalsPropsBase`.
 * - Даёт обработчики, которые мапятся на application команды (`gameSession.*`) и доменные actions.
 *
 * ## Инварианты / правила
 * - Этот модуль не должен менять доменные правила (механика живёт в domain reducer).
 * - Побочные эффекты здесь — только UI‑уровня (анимации/таймеры/локальные UI состояния).
 * - Взаимодействие с доменом — через `dispatch` и `gameSession` (application фасад).
 *
 * Входы:
 * - `deckConfig/runType/templateName` — для старта/рестарта и текстов модалок.
 *
 * Выход:
 * - объект с состоянием, refs, handlers и готовыми props для `GameScreen`.
 *
 * Инварианты:
 * - поведение 1:1 (рефакторинг без изменения геймплея),
 * - побочные эффекты только UI-уровня (анимации/локальное состояние/таймеры),
 * - домен остаётся в `features/game/domain` и управляется через reducer/commands.
 */
import { useCallback, useRef } from 'react';
import type { DeckConfig } from '../../../types/game';
import { useWalletStore } from '../../../stores/useWalletStore';
import { gameSession, useGameSession } from '@/features/game/application';
import { useFloatingTextController } from '../effects/useFloatingTextController';
import { useHeroVisualFx } from '../effects/useHeroVisualFx';
import { useSequentialHp } from '../effects/useSequentialHp';
import { useEnemySlotFloatingTexts } from '../effects/useEnemySlotFloatingTexts';
import { useStealthBlockFx } from '../effects/useStealthBlockFx';
import { useTimedPeekScoutClear } from '../effects/useTimedPeekScoutClear';
import { useSilenceBlockedFx } from '../effects/useSilenceBlockedFx';
import { useLastEffectFloatingTexts } from '../effects/useLastEffectFloatingTexts';
import { useRunCompletionEffects } from '../effects/useRunCompletionEffects';
import { useDarknessFlashlightLock } from '../effects/useDarknessFlashlightLock';
import { useSellDropHandler } from '../board/useSellDropHandler';
import { useCombatDnDActions } from '../board/useCombatDnDActions';
import { useHudComputedData } from '../hud/useHudComputedData';
import { useHudWindowPositions } from '../hud/useHudWindowPositions';
import { useHudVisibility } from '../hud/useHudVisibility';
import { useGameUiState } from '../ui/useGameUiState';
import { useBoardComputedFlags } from '../board/useBoardComputedFlags';
import { useCardSelection } from '../ui/useCardSelection';
import { useCurseActivationFlow } from '../ui/useCurseActivationFlow';
import { useStartGameFlow } from '../ui/useStartGameFlow';
import { useHandResetControl } from '../board/useHandResetControl';
import { useLatestRef } from '@/shared/react/useLatestRef';
import type { GameSceneOverlaysProps } from './GameSceneOverlays';
import type { GameHudLayerProps } from './GameHudLayer';
import type { GameCombatLayerProps } from './GameCombatLayer';
import type { GameModalsProps } from '../modals/GameModals';

const BUFF_SPELLS = ['trophy', 'deflection', 'echo', 'snack', 'armor'];

export type UseGameScreenControllerArgs = {
  deckConfig?: DeckConfig;
  runType: 'standard' | 'custom';
  templateName?: string;
};

export function useGameScreenController({ deckConfig, runType, templateName }: UseGameScreenControllerArgs) {
  // Источник истины состояния забега теперь в `GameSessionProvider` (граница game‑ветки, Блок 6).
  // Это позволяет сессии жить между внутриигровыми экранами, не завися от того,
  // как `GameScreen` компонуется/переиспользуется.
  const { state, dispatch } = useGameSession();

  const {
    selectedCard,
    setSelectedCard,
    showRules,
    setShowRules,
    showRestartConfirm,
    setShowRestartConfirm,
    showExitConfirm,
    setShowExitConfirm,
    showInfo,
    setShowInfo,
    showHUDSettings,
    setShowHUDSettings,
    showCursePicker,
    setShowCursePicker,
    pendingCurse,
    setPendingCurse,
    showCurseConfirm,
    setShowCurseConfirm,
  } = useGameUiState();

  const { hudVisibility, setHudVisibility } = useHudVisibility();
  const { addCrystals } = useWalletStore();

  // Проклятие “Тьма”: пока активно — блокируем пасхалку Lumos/Nox (UI-only).
  useDarknessFlashlightLock(state.curse || null);

  // Визуализация HP с “очередью” (Блок 3): `hpUpdates` -> `visualHp`, без изменения механики.
  const { visualHp } = useSequentialHp({ hp: state.player.hp, hpUpdates: state.hpUpdates });

  /**
   * Защита от stale-closure:
   * DnD-колбэки и эффекты могут вызываться позже, чем был создан callback.
   * Поэтому “актуальное” состояние читаем через ref.
   */
  const stateRef = useLatestRef(state);

  const { windowPositions, updateWindowPosition, resetLayout: handleResetLayout } = useHudWindowPositions();

  // Контроллер floating texts (Блок 3): единая точка управления “плавающими цифрами”.
  const { floatingTexts, addFloatingText, removeFloatingText } = useFloatingTextController();

  const { heroRef, heroShake, coinPulse, armorFlash, healFlash } = useHeroVisualFx({
    hp: state.player.hp,
    coins: state.player.coins,
    logs: state.logs,
    addFloatingText,
  });

  // Ref нужен, чтобы спавнить floating-text рядом с кнопкой продажи (координаты берём из DOMRect).
  const sellButtonRef = useRef<HTMLButtonElement>(null);

  // DOM-refs слотов врагов: для координат floating texts и некоторых UI-эффектов.
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const leftHandRef = useRef<HTMLDivElement>(null);
  const rightHandRef = useRef<HTMLDivElement>(null);
  const backpackRef = useRef<HTMLDivElement>(null);

  useLastEffectFloatingTexts({
    lastEffect: state.lastEffect as any,
    enemySlots: state.enemySlots,
    leftHandCardId: state.leftHand.card?.id,
    rightHandCardId: state.rightHand.card?.id,
    backpackCardId: state.backpack.card?.id,
    leftHandRef,
    rightHandRef,
    backpackRef,
    slotRefs,
    addFloatingText,
  });

  const { deckStats, discardStats, activeBuffs, activeLabels } = useHudComputedData({
    deck: state.deck,
    discardPile: state.discardPile,
    enemySlots: state.enemySlots,
    leftHandCard: state.leftHand.card,
    rightHandCard: state.rightHand.card,
    backpackCard: state.backpack.card,
    activeEffects: state.activeEffects,
    buffSpellIds: BUFF_SPELLS,
  });

  useTimedPeekScoutClear({
    peekCards: state.peekCards,
    scoutCards: state.scoutCards,
    dispatch,
  });

  const startGame = useCallback(
    (args: { deckConfig?: DeckConfig; runType?: 'standard' | 'custom'; templateName?: string }) => {
      dispatch(gameSession.startGame(args));
    },
    [dispatch]
  );

  const { restartGame } = useStartGameFlow({
    startGame,
    deckConfig,
    runType,
    templateName,
  });

  useRunCompletionEffects({
    status: state.status,
    stats: state.stats,
    overheads: state.overheads,
    coins: state.player.coins,
    addCrystals,
  });

  useSilenceBlockedFx({
    logs: state.logs,
    slotRefs,
    addFloatingText,
  });

  // Enemy slot floating texts вынесены в `useEnemySlotFloatingTexts` (Блок 3, effects).
  useEnemySlotFloatingTexts({
    enemySlots: state.enemySlots,
    logs: state.logs,
    slotRefs,
    addFloatingText,
  });

  const { checkStealthBlock, isStealthBlocked } = useStealthBlockFx({
    enemySlots: state.enemySlots,
    slotRefs,
    addFloatingText,
  });

  const { isSellBlocked, hasWeb, getCardModifier } = useBoardComputedFlags({
    enemySlots: state.enemySlots,
    curse: state.curse || null,
  });

  const handleSellDrop = useSellDropHandler({
    stateRef,
    sellButtonRef,
    addFloatingText,
    onSellCard: (cardId) => dispatch(gameSession.sellItem({ cardId })),
  });

  const { handleDropToHand, handleMonsterInteraction, handleDropOnEnemy } = useCombatDnDActions({
    stateRef,
    dispatch,
    checkStealthBlock,
  });

  const { canReset, onReset: handleReset } = useHandResetControl({
    enemySlots: state.enemySlots,
    hp: state.player.hp,
    isGodMode: state.isGodMode,
    resetHand: () => dispatch(gameSession.resetHand()),
  });

  const { handleCardClick } = useCardSelection({ onSelect: setSelectedCard });

  const {
    openCursePicker,
    closeCursePicker,
    selectCurse,
    confirmCurse,
    cancelCurse,
  } = useCurseActivationFlow({
    pendingCurse,
    setPendingCurse,
    setShowCursePicker,
    setShowCurseConfirm,
    activateCurse: (curse) => dispatch(gameSession.activateCurse(curse)),
  });

  const sceneOverlaysProps: GameSceneOverlaysProps = {
    floatingTexts,
    onFloatingTextComplete: removeFloatingText,
    curse: state.curse || null,
  };

  const hudLayerProps: GameHudLayerProps = {
    topBar: {
      deckCount: state.deck.length,
      showInfo,
      showDeckStats: hudVisibility.deckStats,
      deckStats,
      onOpenExitConfirm: () => setShowExitConfirm(true),
    },
    windows: {
      showInfo,
      hudVisibility,
      deck: state.deck,
      discardPile: state.discardPile,
      discardStats,
      overheads: state.overheads,
      logs: state.logs,
      activeLabels,
      windowPositions,
      onPositionChange: (key, pos) => updateWindowPosition(key, pos),
    },
    bottomBar: {
      showInfo,
      onToggleInfo: () => setShowInfo(!showInfo),
      onOpenHUDSettings: () => setShowHUDSettings(true),
      onResetLayout: handleResetLayout,
      onOpenRestartConfirm: () => setShowRestartConfirm(true),
      onOpenRules: () => setShowRules(true),
      onOpenPause: undefined,
      isGodMode: state.isGodMode,
      onToggleGodMode: () => dispatch({ type: 'TOGGLE_GOD_MODE' }),
    },
  };

  const combatLayerProps: GameCombatLayerProps = {
    leftControls: {
      curse: state.curse || null,
      isCurseLocked: state.hasActed,
      canOpenCursePicker: !state.curse && !state.hasActed,
      onOpenCursePicker: openCursePicker,
      canReset,
      onReset: handleReset,
    },
    board: {
      enemySlots: state.enemySlots,
      merchantOverlaySlots: state.merchant?.isActive ? state.merchant.overlaySlots : undefined,
      merchantBlockedSlotIndex: state.merchant?.isActive ? state.merchant.blockedSlotIndex : null,
      onSetEnemySlotRef: (idx, el) => {
        slotRefs.current[idx] = el;
      },
      leftHandRef,
      rightHandRef,
      backpackRef,
      leftHandCard: state.leftHand.card,
      rightHandCard: state.rightHand.card,
      backpackCard: state.backpack.card,
      isLeftBlocked: state.leftHand.blocked,
      isRightBlocked: state.rightHand.blocked,
      isBackpackBlocked: hasWeb || state.backpack.blocked,
      hasWeb,
      onDropToLeftHand: handleDropToHand('left'),
      onDropToRightHand: handleDropToHand('right'),
      onDropToBackpack: handleDropToHand('backpack'),
      onDropOnEnemy: handleDropOnEnemy,
      onCardClick: handleCardClick,
      isStealthBlocked,
      getCardModifier,
      onMonsterToShieldLeft: handleMonsterInteraction('shield_left'),
      onMonsterToShieldRight: handleMonsterInteraction('shield_right'),
      heroRef,
      onDropToPlayer: handleMonsterInteraction('player'),
      visualHp,
      maxHp: state.player.maxHp,
      heroShake,
      armorFlash,
      healFlash,
      coinPulse,
      coins: state.player.coins,
      activeBuffs,
      hasMissEffect: state.activeEffects.includes('miss'),
    },
    sellControl: {
      sellButtonRef,
      isSellBlocked,
      onSell: handleSellDrop,
    },
  };

  const modalsPropsBase: Omit<GameModalsProps, 'onConfirmExit' | 'onExitFromStats'> = {
    showHUDSettings,
    hudVisibility,
    onUpdateHudVisibility: setHudVisibility,
    onCloseHUDSettings: () => setShowHUDSettings(false),

    selectedCard,
    onCloseSelectedCard: () => setSelectedCard(null),

    showRules,
    onCloseRules: () => setShowRules(false),

    showCursePicker,
    onSelectCurse: selectCurse,
    onCloseCursePicker: closeCursePicker,
    showCurseConfirm,
    pendingCurse,
    onConfirmCurse: confirmCurse,
    onCancelCurse: cancelCurse,

    showRestartConfirm,
    onConfirmRestart: () => {
      restartGame();
      setShowRestartConfirm(false);
    },
    onCancelRestart: () => setShowRestartConfirm(false),

    showExitConfirm,
    onCancelExit: () => setShowExitConfirm(false),

    peekCards: state.peekCards,
    peekType: state.peekType,
    scoutCards: state.scoutCards,

    status: state.status,
    stats: state.stats,
    playerHp: state.player.hp,
    onRestartFromStats: restartGame,

    deckConfig,
    runType,
    templateName,
  };

  return {
    // Доменное состояние (ядро игры живёт в reducer/domain; тут только “обвязка” экрана).
    state,
    dispatch,

    // UI-состояние экрана (модалки/выборы/переключатели).
    selectedCard,
    setSelectedCard,
    showRules,
    setShowRules,
    showRestartConfirm,
    setShowRestartConfirm,
    showExitConfirm,
    setShowExitConfirm,
    showInfo,
    setShowInfo,
    showHUDSettings,
    setShowHUDSettings,
    showCursePicker,
    setShowCursePicker,
    pendingCurse,
    showCurseConfirm,

    // HUD-состояние (видимость окон/позиции/сброс layout).
    hudVisibility,
    setHudVisibility,
    windowPositions,
    updateWindowPosition,
    handleResetLayout,

    // Вычисляемые данные HUD (derived data).
    deckStats,
    discardStats,
    activeBuffs,
    activeLabels,

    // Вычисляемые флаги поля (derived data).
    isSellBlocked,
    hasWeb,
    getCardModifier,
    isStealthBlocked,

    // DOM-refs для позиционирования FX/координат (board/hands/sell).
    heroRef,
    sellButtonRef,
    slotRefs,
    leftHandRef,
    rightHandRef,
    backpackRef,

    // Визуальные эффекты/анимации (UI-only).
    floatingTexts,
    removeFloatingText,
    visualHp,
    heroShake,
    armorFlash,
    healFlash,
    coinPulse,

    // Команды/обработчики UI-событий (вызывают gameSession/reducer).
    restartGame,
    canReset,
    handleReset,
    openCursePicker,
    closeCursePicker,
    selectCurse,
    confirmCurse,
    cancelCurse,
    handleSellDrop,
    handleDropToHand,
    handleMonsterInteraction,
    handleDropOnEnemy,
    handleCardClick,

    // Готовые “props view-model” для слоёв `GameScreen` (scene/hud/combat/modals).
    sceneOverlaysProps,
    hudLayerProps,
    combatLayerProps,
    modalsPropsBase,
  };
}


