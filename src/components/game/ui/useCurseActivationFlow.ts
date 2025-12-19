/**
 * useCurseActivationFlow
 *
 * Контекст (Блок 3): вынесено из `GameScreen` в `ui/`, чтобы UI-флоу выбора проклятия
 * не жил в экране и мог переиспользоваться/меняться без риска для остального UI.
 *
 * Слой: UI (React).
 *
 * Инкапсулирует UI-флоу активации проклятия:
 * picker -> pendingCurse -> confirm -> dispatch ACTIVATE_CURSE -> cleanup.
 *
 * Входы:
 * - локальные UI-сеттеры (`setShowCursePicker/setShowCurseConfirm/setPendingCurse`),
 * - `activateCurse(curse)` — абстракция над применением (обычно `dispatch(gameSession.activateCurse(curse))`).
 *
 * Выход:
 * - набор действий UI: `open/close/select/confirm/cancel`.
 *
 * Важно: поведение 1:1 с прежней inline-логикой в `GameScreen`.
 *
 * Инварианты:
 * - хук не знает про reducer/actions напрямую (это намеренно),
 * - доменные последствия активации проклятия происходят только в reducer/application слое.
 */
import { useCallback } from 'react';
import type { CurseType } from '@/types/game';

export type UseCurseActivationFlowParams = {
  pendingCurse: CurseType | null;
  setPendingCurse: (curse: CurseType | null) => void;
  setShowCursePicker: (next: boolean) => void;
  setShowCurseConfirm: (next: boolean) => void;

  /** Абстракция над dispatch(gameSession.activateCurse(...)) чтобы хук не знал про reducer/action. */
  activateCurse: (curse: CurseType) => void;
};

export function useCurseActivationFlow(params: UseCurseActivationFlowParams) {
  const { pendingCurse, setPendingCurse, setShowCursePicker, setShowCurseConfirm, activateCurse } = params;

  const openCursePicker = useCallback(() => {
    setShowCursePicker(true);
  }, [setShowCursePicker]);

  const closeCursePicker = useCallback(() => {
    setShowCursePicker(false);
  }, [setShowCursePicker]);

  const selectCurse = useCallback(
    (curse: CurseType) => {
      setPendingCurse(curse);
      setShowCursePicker(false);
      setShowCurseConfirm(true);
    },
    [setPendingCurse, setShowCursePicker, setShowCurseConfirm]
  );

  const confirmCurse = useCallback(() => {
    if (!pendingCurse) return;
    activateCurse(pendingCurse);
    setShowCurseConfirm(false);
    setPendingCurse(null);
  }, [activateCurse, pendingCurse, setPendingCurse, setShowCurseConfirm]);

  const cancelCurse = useCallback(() => {
    setShowCurseConfirm(false);
    setPendingCurse(null);
  }, [setPendingCurse, setShowCurseConfirm]);

  return {
    openCursePicker,
    closeCursePicker,
    selectCurse,
    confirmCurse,
    cancelCurse,
  };
}


