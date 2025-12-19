/**
 * GameBoard — центральная доска боя (enemy slots + руки/рюкзак + герой).
 *
 * Контекст (Блок 3.5): вынос “доски” из `GameScreen`, чтобы экран стал компоновкой.
 *
 * Слой: UI (React).
 *
 * Что делает:
 * - рендерит ряд слотов врагов (c drop-zone для карт/спеллов),
 * - рендерит левую/правую руку и рюкзак (drop-zone/клики),
 * - рендерит `PlayerAvatar` по центру.
 *
 * Входы:
 * - `enemySlots` + колбэки для drop/click,
 * - refs на DOM-элементы (hand/backpack/slot refs) для FX и позиционирования.
 *
 * Инварианты:
 * - не содержит доменной логики; правила проверяются снаружи (контроллер/хуки),
 * - refs прокидываем извне, чтобы сохранить поведение/анимации 1:1.
 */

import type { RefObject } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Card } from '@/types/game';
import { EnemySlotDropZone } from '../dnd/EnemySlotDropZone';
import { InteractionZone } from '../dnd/InteractionZone';
import Slot from '@/components/Slot';
import CardComponent from '@/components/CardComponent';
import { PlayerAvatar } from './PlayerAvatar';

export type GameBoardProps = {
  enemySlots: Array<Card | null>;
  onSetEnemySlotRef: (idx: number, el: HTMLDivElement | null) => void;

  leftHandRef: RefObject<HTMLDivElement>;
  rightHandRef: RefObject<HTMLDivElement>;
  backpackRef: RefObject<HTMLDivElement>;

  leftHandCard: Card | null;
  rightHandCard: Card | null;
  backpackCard: Card | null;
  isLeftBlocked: boolean;
  isRightBlocked: boolean;
  isBackpackBlocked: boolean;

  hasWeb: boolean;

  onDropToLeftHand: (item: any) => void;
  onDropToRightHand: (item: any) => void;
  onDropToBackpack: (item: any) => void;
  onDropOnEnemy: (item: any, targetId: string) => void;

  onCardClick: (card: Card) => void;
  isStealthBlocked: (card: Card) => boolean;
  getCardModifier: (card: Card | null) => number;

  onMonsterToShieldLeft?: (item: any) => void;
  onMonsterToShieldRight?: (item: any) => void;

  // Player avatar props (прокидываем как есть, чтобы избежать скрытых зависимостей)
  heroRef: RefObject<HTMLDivElement>;
  onDropToPlayer: (item: any) => void;
  visualHp: number;
  maxHp: number;
  heroShake: boolean;
  armorFlash: boolean;
  healFlash: boolean;
  coinPulse: boolean;
  coins: number;
  activeBuffs: string[];
  hasMissEffect: boolean;
};

export function GameBoard(props: GameBoardProps) {
  const {
    enemySlots,
    onSetEnemySlotRef,
    leftHandRef,
    rightHandRef,
    backpackRef,
    leftHandCard,
    rightHandCard,
    backpackCard,
    isLeftBlocked,
    isRightBlocked,
    isBackpackBlocked,
    hasWeb,
    onDropToLeftHand,
    onDropToRightHand,
    onDropToBackpack,
    onDropOnEnemy,
    onCardClick,
    isStealthBlocked,
    getCardModifier,
    onMonsterToShieldLeft,
    onMonsterToShieldRight,
    heroRef,
    onDropToPlayer,
    visualHp,
    maxHp,
    heroShake,
    armorFlash,
    healFlash,
    coinPulse,
    coins,
    activeBuffs,
    hasMissEffect,
  } = props;

  return (
    <div className="relative grid grid-cols-4 gap-2 md:gap-4 w-full max-w-sm md:max-w-xl aspect-[2/1] transition-all duration-300">
      {/* Enemy Row */}
      {enemySlots.map((card, i) => (
        <div
          key={`enemy-slot-${i}`}
          className="aspect-square flex items-center justify-center relative"
          ref={(el) => onSetEnemySlotRef(i, el)}
        >
          {/* Static Placeholder Background */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-stone-800/50 bg-stone-900/20 backdrop-blur-sm" />

          <EnemySlotDropZone card={card} onDropOnEnemy={onDropOnEnemy}>
            {/* Default mode (sync) allows exiting and entering cards to exist together. Absolute positioning handles overlap. */}
            <AnimatePresence>
              {card && (
                <CardComponent
                  key={card.id}
                  card={card}
                  isDraggable={true}
                  onClick={() => onCardClick(card)}
                  isBlocked={isStealthBlocked(card)}
                  penalty={getCardModifier(card)}
                />
              )}
            </AnimatePresence>
          </EnemySlotDropZone>
        </div>
      ))}

      {/* Left Hand */}
      <InteractionZone onDrop={() => {}} accepts={[]} className="relative">
        <div ref={leftHandRef} className="w-full h-full">
          <Slot
            card={leftHandCard}
            onDrop={onDropToLeftHand}
            accepts={['card']}
            placeholderIcon="✋"
            isBlocked={isLeftBlocked}
            canDropItem={(item) => item.type !== 'monster'}
            /**
             * Важно: интеракшн “монстр -> щит” должен быть доступен только если в руке именно щит.
             * Если прокинуть `onInteract` для других типов, `Slot` начнёт подсвечивать/принимать
             * взаимодействия, которых быть не должно.
             *
             * Это не “фикс логики” — это явная защита интерфейса (поведение сохранено 1:1).
             */
            onInteract={leftHandCard?.type === 'shield' ? onMonsterToShieldLeft : undefined}
            onCardClick={() => leftHandCard && onCardClick(leftHandCard)}
            penalty={getCardModifier(leftHandCard)}
            location="hand"
          />
        </div>
      </InteractionZone>

      <PlayerAvatar
        heroRef={heroRef}
        onDropToPlayer={onDropToPlayer}
        visualHp={visualHp}
        maxHp={maxHp}
        heroShake={heroShake}
        armorFlash={armorFlash}
        healFlash={healFlash}
        coinPulse={coinPulse}
        coins={coins}
        activeBuffs={activeBuffs}
        hasMissEffect={hasMissEffect}
      />

      {/* Right Hand */}
      <InteractionZone onDrop={() => {}} accepts={[]} className="relative">
        <div ref={rightHandRef} className="w-full h-full">
          <Slot
            card={rightHandCard}
            onDrop={onDropToRightHand}
            accepts={['card']}
            placeholderIcon="✋"
            isBlocked={isRightBlocked}
            canDropItem={(item) => item.type !== 'monster'}
            /**
             * См. пояснение выше (левая рука): `onInteract` задаём только для щита,
             * чтобы не создавать “ложных” интерактивных состояний у других предметов.
             */
            onInteract={rightHandCard?.type === 'shield' ? onMonsterToShieldRight : undefined}
            onCardClick={() => rightHandCard && onCardClick(rightHandCard)}
            penalty={getCardModifier(rightHandCard)}
            location="hand"
          />
        </div>
      </InteractionZone>

      {/* Backpack */}
      <div className="relative" ref={backpackRef}>
        <Slot
          card={backpackCard}
          onDrop={onDropToBackpack}
          accepts={['card']}
          placeholderIcon="🎒"
          isBlocked={isBackpackBlocked}
          canDropItem={(item) => item.type !== 'monster' && item.location !== 'hand'}
          onCardClick={() => backpackCard && onCardClick(backpackCard)}
          penalty={getCardModifier(backpackCard)}
          location="backpack"
        />
        {hasWeb && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <span className="text-4xl md:text-5xl drop-shadow-lg opacity-90 filter brightness-125">🕸️</span>
          </div>
        )}
      </div>
    </div>
  );
}


