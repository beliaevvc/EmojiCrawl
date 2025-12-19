/**
 * useGameUiState
 *
 * Контекст (Блок 3): вынесено из `GameScreen` в `ui/`, чтобы:
 * - локальные UI-флаги и временные выборы были собраны в одном месте,
 * - `GameScreen` оставался “экраном‑компоновкой”, а не хранилищем десятка useState.
 *
 * Слой: UI (React). Это локальный UI state, не persisted.
 *
 * Что хранит:
 * - выбранную карту для зума/описания,
 * - флаги модалок (rules/HUD settings/restart/exit),
 * - состояние выбора/подтверждения проклятия (picker + pendingCurse + confirm),
 * - флаг `showInfo` (показываем ли HUD-окна/детали).
 *
 * Выход:
 * - объект со всеми значениями и их setState-функциями.
 *
 * Инварианты:
 * - поведение 1:1 с набором `useState(...)`, который раньше жил в `GameScreen`,
 * - этот хук не знает про reducer/dispatch и не влияет на механику игры.
 *
 */

import { useState } from 'react';
import type { Card, CurseType } from '@/types/game';

export function useGameUiState() {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showHUDSettings, setShowHUDSettings] = useState(false);
  const [showCursePicker, setShowCursePicker] = useState(false);
  const [pendingCurse, setPendingCurse] = useState<CurseType | null>(null);
  const [showCurseConfirm, setShowCurseConfirm] = useState(false);

  return {
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
  };
}


