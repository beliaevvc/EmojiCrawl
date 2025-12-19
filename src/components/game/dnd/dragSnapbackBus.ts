/**
 * dragSnapbackBus — мини-шина событий для “возврата” drag-preview в исходную позицию,
 * когда drop НЕ произошёл (monitor.didDrop() === false).
 *
 * Почему так:
 * - После перехода на кастомный `useDragLayer` мы подавляем нативный HTML5 drag-preview,
 *   а значит браузер больше не делает “плавный возврат” картинки назад при отмене drag.
 * - Этот bus позволяет источнику (CardComponent) сообщить DragLayer'у, что нужен snapback,
 *   не протаскивая state через половину приложения.
 */

import type { DragPreviewCard } from './CardDragPreview';

export type DragSnapbackPayload = {
  item: DragPreviewCard;
  // Offsets могут быть null, потому что в `end()` у HTML5 backend monitor часто уже “очищен”.
  // В этом случае DragLayer возьмёт последние известные оффсеты из своего ref.
  initialClientOffset?: { x: number; y: number } | null;
  initialSourceClientOffset?: { x: number; y: number } | null;
  currentClientOffset?: { x: number; y: number } | null;
};

type Listener = (payload: DragSnapbackPayload) => void;

const listeners = new Set<Listener>();

export function emitDragSnapback(payload: DragSnapbackPayload) {
  listeners.forEach((l) => l(payload));
}

export function subscribeDragSnapback(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}


