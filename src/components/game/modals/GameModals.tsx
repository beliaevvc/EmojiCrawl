/**
 * GameModals — единая точка управления модалками/оверлеями Game UI.
 *
 * UI-слой (React). Вынесено из `GameScreen` в рамках Блока 3, чтобы:
 * - собрать все <AnimatePresence> в одном месте,
 * - упростить `GameScreen` (экран-компоновка),
 * - облегчить подключение новых внутриигровых экранов (story/shop/rewards/...) без копипасты модалок.
 *
 * Важно: поведение не меняем — это перенос “как есть”.
 *
 * Блок 4 (Content Layer):
 * - тексты/иконки (например имя проклятия в подтверждении, иконка способности монстра в зуме карты)
 *   берём из `baseGameContent`, а не через прямые импорты `src/data/*`.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import type { Card, CurseType, DeckConfig } from '@/types/game';
import type { HUDVisibility } from '@/utils/uiStorage';

import { HUDSettingsModal } from '@/components/HUDSettingsModal';
import { RulesModal } from '@/components/RulesModal';
import { CursePicker } from '@/components/CursePicker';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { GameStatsOverlay } from '@/components/GameStatsOverlay';
import CardComponent from '@/components/CardComponent';
import { CheatAddCoinsModal } from '@/components/game/modals/CheatAddCoinsModal';

import { baseGameContent } from '@/features/game/application/gameContent';

export type GameModalsProps = {
  // Настройки HUD
  showHUDSettings: boolean;
  hudVisibility: HUDVisibility;
  onUpdateHudVisibility: (next: HUDVisibility) => void;
  onCloseHUDSettings: () => void;

  // Зум/просмотр карты
  selectedCard: Card | null;
  onCloseSelectedCard: () => void;

  // Правила
  showRules: boolean;
  onCloseRules: () => void;

  // Проклятие: выбор и подтверждение
  showCursePicker: boolean;
  onSelectCurse: (curse: CurseType) => void;
  onCloseCursePicker: () => void;
  showCurseConfirm: boolean;
  pendingCurse: CurseType | null;
  onConfirmCurse: () => void;
  onCancelCurse: () => void;

  // Подтверждения рестарта/выхода
  showRestartConfirm: boolean;
  onConfirmRestart: () => void;
  onCancelRestart: () => void;

  showExitConfirm: boolean;
  onConfirmExit: () => void;
  onCancelExit: () => void;

  // Dev/Debug: чит-окна
  showCheatAddCoins: boolean;
  onConfirmCheatAddCoins: (amount: number) => void;
  onCancelCheatAddCoins: () => void;

  // Оверлеи предпросмотра (peek/scout)
  peekCards: Card[] | null;
  peekType?: 'epiphany' | 'whisper' | 'beacon';
  scoutCards: Card[] | null;

  // Оверлей конца забега (победа/поражение)
  status: 'playing' | 'won' | 'lost';
  stats: any;
  playerHp: number;
  onRestartFromStats: () => void;
  onExitFromStats: () => void;

  // Для текста подтверждения рестарта (как было раньше)
  deckConfig?: DeckConfig;
  runType?: 'standard' | 'custom';
  templateName?: string;
};

export function GameModals(props: GameModalsProps) {
  const {
    showHUDSettings,
    hudVisibility,
    onUpdateHudVisibility,
    onCloseHUDSettings,

    selectedCard,
    onCloseSelectedCard,

    showRules,
    onCloseRules,

    showCursePicker,
    onSelectCurse,
    onCloseCursePicker,
    showCurseConfirm,
    pendingCurse,
    onConfirmCurse,
    onCancelCurse,

    showRestartConfirm,
    onConfirmRestart,
    onCancelRestart,

    showExitConfirm,
    onConfirmExit,
    onCancelExit,

    showCheatAddCoins,
    onConfirmCheatAddCoins,
    onCancelCheatAddCoins,

    peekCards,
    peekType,
    scoutCards,

    status,
    stats,
    playerHp,
    onRestartFromStats,
    onExitFromStats,
  } = props;

  return (
    <>
      <AnimatePresence>
        {showHUDSettings && (
          <HUDSettingsModal visibility={hudVisibility} onUpdate={onUpdateHudVisibility} onClose={onCloseHUDSettings} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onCloseSelectedCard}
          >
            <div
              className="bg-stone-800 border-2 border-stone-600 rounded-lg p-6 max-w-sm w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={onCloseSelectedCard} className="absolute top-2 right-2 text-stone-400 hover:text-white">
                <X size={20} />
              </button>
              <div className="flex flex-col items-center gap-4">
                <div className="text-6xl relative">
                  {selectedCard.icon}
                  {selectedCard.type === 'monster' && selectedCard.ability && (
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-stone-900 border border-stone-600 rounded-full flex items-center justify-center text-xl shadow-lg">
                      {baseGameContent.monsterAbilitiesById[selectedCard.ability]?.icon}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-stone-100">{selectedCard.name || 'Карта'}</h3>
                <p className="text-stone-300 text-center text-sm leading-relaxed">
                  {selectedCard.description || 'Описание отсутствует.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{showRules && <RulesModal onClose={onCloseRules} />}</AnimatePresence>

      <AnimatePresence>
        {showCursePicker && <CursePicker onSelect={onSelectCurse} onClose={onCloseCursePicker} />}
        {showCurseConfirm && pendingCurse && (
          <ConfirmationModal
            title="Принять Проклятие?"
            message={`Вы собираетесь активировать проклятие "${baseGameContent.cursesById[pendingCurse]?.name}". Это действие необратимо и будет действовать всю игру.`}
            onConfirm={onConfirmCurse}
            onCancel={onCancelCurse}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRestartConfirm && (
          <ConfirmationModal
            title="Новая игра"
            message="Вы уверены, что хотите начать заново? Текущий прогресс будет потерян."
            onConfirm={onConfirmRestart}
            onCancel={onCancelRestart}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExitConfirm && (
          <ConfirmationModal
            title="Выход в меню"
            message="Вы уверены, что хотите выйти? Текущий прогресс игры будет потерян."
            onConfirm={onConfirmExit}
            onCancel={onCancelExit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCheatAddCoins && (
          <CheatAddCoinsModal onConfirm={onConfirmCheatAddCoins} onCancel={onCancelCheatAddCoins} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {peekCards && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 md:top-24 left-0 w-full z-[100] flex justify-center pointer-events-none"
          >
            <div
              className={`
                backdrop-blur-md border rounded-2xl p-3 shadow-2xl flex flex-col items-center gap-2
                ${
                  peekType === 'beacon'
                    ? 'bg-rose-900/90 border-rose-500/50'
                    : peekType === 'whisper'
                    ? 'bg-stone-900/90 border-indigo-500/30'
                    : 'bg-stone-900/90 border-indigo-500/30'
                }
              `}
            >
              <div
                className={`text-[10px] font-bold tracking-[0.2em] uppercase ${
                  peekType === 'beacon' ? 'text-rose-200' : 'text-indigo-300'
                }`}
              >
                {peekType === 'whisper' ? 'ШЕПОТ ЛЕСА' : peekType === 'beacon' ? 'МАЯК' : 'СЛЕДУЮЩИЕ КАРТЫ'}
              </div>
              <div className="flex gap-3">
                {peekCards.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                    className="w-12 h-12 md:w-14 md:h-14 relative"
                  >
                    <CardComponent card={card} isDraggable={false} />
                  </motion.div>
                ))}
                {peekCards.length === 0 && (
                  <p className="text-stone-500 text-xs font-bold uppercase px-2">Колода пуста</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scoutCards && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 md:top-24 left-0 w-full z-[100] flex justify-center pointer-events-none"
          >
            <div className="bg-stone-900/90 backdrop-blur-md border border-amber-500/30 rounded-2xl p-3 shadow-2xl flex flex-col items-center gap-2">
              <div className="text-[10px] font-bold text-amber-300 tracking-[0.2em] uppercase">РАЗВЕДКА</div>
              <div className="flex gap-3 relative min-h-[56px] min-w-[120px] justify-center">
                {scoutCards.map((card, i) => (
                  <motion.div
                    key={card.id + '_scout'}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={
                      i === 0
                        ? {
                            opacity: [0, 1, 1, 0],
                            scale: [0.5, 1, 1, 0.5],
                            x: [0, 0, 0, 100],
                            y: [0, 0, 0, 50],
                            rotate: [0, 0, 0, 45],
                          }
                        : { opacity: 1, scale: 1 }
                    }
                    transition={
                      i === 0
                        ? { duration: 2.5, times: [0, 0.2, 0.6, 1], ease: 'easeInOut' }
                        : { delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }
                    }
                    className="w-12 h-12 md:w-14 md:h-14 relative"
                  >
                    <CardComponent card={card} isDraggable={false} />
                    {i === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full"
                      >
                        <span className="text-xl">🗑️</span>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(status === 'lost' || status === 'won') && (
        <GameStatsOverlay
          stats={stats}
          status={status}
          playerHp={playerHp}
          onRestart={onRestartFromStats}
          onExit={onExitFromStats}
        />
      )}
    </>
  );
}


