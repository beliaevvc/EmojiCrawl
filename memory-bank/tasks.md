# Tasks (актуальная задача)

Этот файл — **рабочий**. Исторический контент сохранён в архиве: `memory-bank/archive/archive-tasks-md-snapshot-2025-12-20.md`.

---

## Текущая задача

### Название
DnD: drag-preview/offset (Клеймор/артефакты торговца) + snapback (отмена drag) — WIP

### Статус
- [x] Planning
- [x] Implementation
- [ ] Verification
- [x] Documentation
- [ ] Reflection

### Сложность
Level 2 (Simple Enhancement / UX polish)

### Контекст / Требования
- **Проблема**: при drag токена (особенно 🗡️ Клеймора у торговца) drag-preview “уезжал” относительно курсора (offset неверный).
- **Требование**: исправить аккуратно, **не ломая** существующие DnD-правила (слоты/продажа/герой/монстры/заклинания/торговец).
- **UX ожидание**: при drag оригинал скрывается, “призрак” следует за курсором (см. `uiDesign.md`).
- **UX ожидание**: при отмене drag (отпустил **в пустоте**) раньше был “плавный возврат” (snapback); после ухода от нативного preview это поведение должно быть сохранено.
- **Текущее состояние**: drag-preview/offset исправлен кастомным drag-layer’ом, но **snapback в Chrome ощущается неидеально** (со слов пользователя: “задержка”, “мигание” при возврате в слот). Работу **временно остановили** для последующего прицельного полиша.

### План (маленькими партиями)
- Заменить нативный HTML5 drag-preview на кастомный `GameDragLayer` (исправить offset при transform/scale).
- Добавить эмуляцию snapback при отмене drag.
- Довести snapback UX до “как было” в Chrome (убрать задержку/мигание).

### Файлы/точки входа (если код)
- UI drag-source: `src/components/CardComponent.tsx`
- UI drag-layer: `src/components/game/dnd/GameDragLayer.tsx`, `src/components/game/dnd/CardDragPreview.tsx`
- DnD drop-zones: `src/components/Slot.tsx`, `src/components/game/board/PlayerAvatar.tsx`, `src/components/game/dnd/*`
- Документация: `memory-bank/uiDesign.md`, `memory-bank/progress.md`, `memory-bank/activeContext.md`

---

## Архив (задачи, которые уже “не актуальны” как текущая работа)

### Архивные отчёты (task archives)
- `memory-bank/archive/archive-traveling-merchant-v1.md`
- `memory-bank/archive/archive-traveling-merchant-visual-v1.md`
- `memory-bank/archive/archive-traveling-merchant-opaque-tokens-v1.md`
- `memory-bank/archive/archive-traveling-merchant-new-game-while-active-v1.md`
- `memory-bank/archive/archive-versioning-0-1.md`
- `memory-bank/archive/archive-memory-bank-grouping-rollback-v1.md`

### Снэпшоты рабочих файлов
- `memory-bank/archive/archive-tasks-md-snapshot-2025-12-20.md` — полный исторический `tasks.md` до очистки.


