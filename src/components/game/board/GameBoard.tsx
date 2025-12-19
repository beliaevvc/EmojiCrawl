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
import { AnimatePresence, motion } from 'framer-motion';
import type { Card } from '@/types/game';
import { EnemySlotDropZone } from '../dnd/EnemySlotDropZone';
import { InteractionZone } from '../dnd/InteractionZone';
import Slot from '@/components/Slot';
import CardComponent from '@/components/CardComponent';
import { PlayerAvatar } from './PlayerAvatar';

export type GameBoardProps = {
  enemySlots: Array<Card | null>;
  merchantOverlaySlots?: Array<Card | null>;
  merchantBlockedSlotIndex?: number | null;
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
    merchantOverlaySlots,
    merchantBlockedSlotIndex,
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

  const isMerchantActive =
    !!merchantOverlaySlots && merchantOverlaySlots.some((c) => c !== null) && merchantBlockedSlotIndex != null;

  return (
    <div className="relative w-full max-w-sm md:max-w-xl transition-all duration-300">
      {/* Traveling Merchant banner (виден всё время, пока активен магазин) */}
      {isMerchantActive && (
        // Важно: баннер НЕ должен сдвигать поле вниз.
        // Поэтому крепим его “снаружи” над полем: bottom-full + margin-bottom.
        // Дополнительно поднимаем баннер ещё на половину его собственной высоты (по запросу),
        // чтобы он был выше верхнего ряда, но поле оставалось на месте.
        <div className="pointer-events-none absolute inset-x-0 bottom-full mb-3 -translate-y-1/2 z-10 flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 1 }}
            // Делаем табличку ограниченной ширины и центрируем — чтобы она не выглядела “сдвинутой”.
            className="w-[92%] md:w-[88%] max-w-lg"
          >
            <div className="bg-stone-900/80 backdrop-blur-md border border-stone-700 shadow-xl rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] md:text-xs font-display uppercase tracking-widest text-stone-200">
                🎩 Странствующий торговец
              </div>
              <div className="mt-1 text-[10px] md:text-xs text-stone-300 leading-snug space-y-0.5">
                <div>
                  🖐️ Перетащи артефакт в свободный слот — купить{' '}
                  <span className="text-amber-300 font-bold">💎15</span>
                </div>
                <div>🚪 Перетащи дверь на героя или в пустой слот — уйти</div>
                <div className="text-stone-400">⛔ Во время торговца бой и магия недоступны</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Сетка поля (позиция/размер не должны меняться из-за баннера) */}
      <div className="relative grid grid-cols-4 gap-2 md:gap-4 w-full aspect-[2/1]">
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
                  // Во время торговца последняя карта раунда перекрыта “🚪 Уйти” и не должна взаимодействовать.
                  isBlocked={isStealthBlocked(card) || (isMerchantActive && merchantBlockedSlotIndex === i)}
                  penalty={getCardModifier(card)}
                />
              )}
            </AnimatePresence>

            {/* Traveling Merchant overlay tokens */}
            {merchantOverlaySlots?.[i] && (
              <div className="absolute inset-0 z-40">
                {/**
                 * Токены торговца:
                 * - 🚪 “Уйти” всегда draggable,
                 * - товары draggable только если хватает 💎 (иначе блокируем с серостью).
                 */}
                {(() => {
                  const token = merchantOverlaySlots[i]!;
                  const price = token.merchantPrice ?? 15;
                  const isLeave = token.merchantAction === 'leave';
                  const canBuy = coins >= price;
                  return (
                <CardComponent
                  key={`merchant-overlay-${token.id}`}
                  card={token}
                  isDraggable={isLeave || (token.merchantOfferType ? canBuy : false)}
                  isBlocked={!isLeave && token.merchantOfferType ? !canBuy : false}
                  // По ТЗ: артефакты торговца должны открывать описание “как у заклинаний”.
                  // 🚪 “Уйти” — не артефакт, описание ему не нужно.
                  onClick={token.merchantOfferType ? () => onCardClick(token) : undefined}
                  penalty={0}
                  location="field"
                />
                  );
                })()}
              </div>
            )}
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
    </div>
  );
}


