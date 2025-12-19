/**
 * GameDragLayer — кастомный drag preview для всех `ItemTypes.CARD`.
 *
 * Зачем:
 * - Нативный HTML5 drag-preview часто “уезжает” (неверный offset), если drag-source
 *   находится внутри элементов с `transform` (например hover/scale, framer-motion).
 * - По дизайн-системе: при drag оригинал может быть скрыт, а “призрак” должен следовать за курсором.
 *
 * Реализация:
 * - В `CardComponent` мы подавляем нативный preview через `getEmptyImage()`.
 * - Здесь рисуем свой превью-токен, позиционируя его по monitor offsets.
 *
 * Важно:
 * - `pointer-events-none`, чтобы слой никогда не мешал dnd/click'ам.
 */
import { useDragLayer } from 'react-dnd';
import { ItemTypes } from '@/types/DragTypes';
import { CardDragPreview, type DragPreviewCard } from './CardDragPreview';
import { useEffect, useRef, useState } from 'react';
import { subscribeDragSnapback, type DragSnapbackPayload } from './dragSnapbackBus';

function getItemStyles({
  initialClientOffset,
  initialSourceClientOffset,
  currentClientOffset,
}: {
  initialClientOffset: { x: number; y: number } | null;
  initialSourceClientOffset: { x: number; y: number } | null;
  currentClientOffset: { x: number; y: number } | null;
}) {
  if (!initialClientOffset || !initialSourceClientOffset || !currentClientOffset) {
    return { display: 'none' as const };
  }

  // Сохраняем “точку хвата” внутри токена: cursorOffset = mouseStart - sourceTopLeftStart
  const cursorOffsetX = initialClientOffset.x - initialSourceClientOffset.x;
  const cursorOffsetY = initialClientOffset.y - initialSourceClientOffset.y;

  const x = currentClientOffset.x - cursorOffsetX;
  const y = currentClientOffset.y - cursorOffsetY;

  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
}

export function GameDragLayer() {
  const { isDragging, itemType, item, initialClientOffset, initialSourceClientOffset, currentClientOffset } =
    useDragLayer((monitor) => ({
      isDragging: monitor.isDragging(),
      itemType: monitor.getItemType(),
      item: monitor.getItem() as DragPreviewCard | null,
      initialClientOffset: monitor.getInitialClientOffset(),
      initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
      currentClientOffset: monitor.getClientOffset(),
    }));

  // Последние валидные оффсеты “во время drag”. Нужны для snapback, потому что в `end()`
  // (и сразу после dragend) HTML5 backend может отдавать null.
  const lastDragRef = useRef<{
    itemId: string;
    item: DragPreviewCard;
    initialClientOffset: { x: number; y: number } | null;
    initialSourceClientOffset: { x: number; y: number } | null;
    currentClientOffset: { x: number; y: number } | null;
  } | null>(null);

  const [snapback, setSnapback] = useState<{
    item: DragPreviewCard;
    from: { x: number; y: number };
    to: { x: number; y: number };
    phase: 'from' | 'to';
  } | null>(null);
  const clearTimerRef = useRef<number | null>(null);

  // If a new drag starts, cancel any in-progress snapback.
  useEffect(() => {
    if (isDragging && snapback) setSnapback(null);
  }, [isDragging, snapback]);

  // Keep last offsets while dragging (for snapback fallback).
  useEffect(() => {
    if (isDragging && itemType === ItemTypes.CARD && item) {
      lastDragRef.current = {
        itemId: item.id,
        item,
        initialClientOffset,
        initialSourceClientOffset,
        currentClientOffset,
      };
    }
  }, [isDragging, itemType, item, initialClientOffset, initialSourceClientOffset, currentClientOffset]);

  useEffect(() => {
    const unsubscribe = subscribeDragSnapback((payload: DragSnapbackPayload) => {
      const payloadItem = payload.item;
      const fallback = lastDragRef.current?.itemId === payloadItem.id ? lastDragRef.current : null;

      const ic = payload.initialClientOffset ?? fallback?.initialClientOffset ?? null;
      const is = payload.initialSourceClientOffset ?? fallback?.initialSourceClientOffset ?? null;
      const cc = payload.currentClientOffset ?? fallback?.currentClientOffset ?? null;

      if (!ic || !is || !cc) return;

      // Same positioning math as during drag: compute top-left from current mouse position and “grab point”.
      const cursorOffsetX = ic.x - is.x;
      const cursorOffsetY = ic.y - is.y;
      const fromX = cc.x - cursorOffsetX;
      const fromY = cc.y - cursorOffsetY;

      const toX = is.x;
      const toY = is.y;

      // Если почти не сдвинули токен — не показываем “возврат”, чтобы не ощущалось как задержка.
      const dx = fromX - toX;
      const dy = fromY - toY;
      // Даже если сдвиг маленький — в Chrome ощущение “snapback” важнее, чем микро-оптимизация.
      // (Иначе можно получить “мигание” без видимой анимации.)

      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);

      // Phase 1: render at “from”.
      setSnapback({ item: payloadItem, from: { x: fromX, y: fromY }, to: { x: toX, y: toY }, phase: 'from' });

      // Phase 2: next frame switch to “to” with transition.
      requestAnimationFrame(() => {
        setSnapback((prev) => (prev ? { ...prev, phase: 'to' } : prev));
      });

      // Cleanup after transition.
      clearTimerRef.current = window.setTimeout(() => setSnapback(null), 110);
    });

    return () => {
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
      unsubscribe();
    };
  }, []);

  const showDraggingPreview = isDragging && itemType === ItemTypes.CARD && !!item;
  const showSnapbackPreview = !showDraggingPreview && !!snapback;

  if (!showDraggingPreview && !showSnapbackPreview) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]">
      {showDraggingPreview && item && (
        <div style={getItemStyles({ initialClientOffset, initialSourceClientOffset, currentClientOffset })}>
          <CardDragPreview card={item} />
        </div>
      )}

      {showSnapbackPreview && snapback && (
        <div
          style={{
            transform:
              snapback.phase === 'from'
                ? `translate(${snapback.from.x}px, ${snapback.from.y}px)`
                : `translate(${snapback.to.x}px, ${snapback.to.y}px)`,
            WebkitTransform:
              snapback.phase === 'from'
                ? `translate(${snapback.from.x}px, ${snapback.from.y}px)`
                : `translate(${snapback.to.x}px, ${snapback.to.y}px)`,
            transition: snapback.phase === 'to' ? 'transform 80ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
          }}
        >
          <CardDragPreview card={snapback.item} />
        </div>
      )}
    </div>
  );
}


