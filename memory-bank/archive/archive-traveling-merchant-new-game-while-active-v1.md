# TASK ARCHIVE: Traveling Merchant — Hotfix: New Game во время активного торговца — v1

## METADATA
- **Task ID**: `traveling-merchant-new-game-while-active-v1`
- **Дата**: 2025-12-20
- **Сложность**: Level 1 (Bugfix / Domain Guard)

## SUMMARY
Исправили баг: при активном `merchant.isActive` кнопка **New Game** не работала, потому что доменный гейт режима магазина отбрасывал почти все действия, включая `START_GAME`. Решение — разрешить системные экшены `START_GAME` и `INIT_GAME` даже во время торговца, не ослабляя блокировки боевых действий.

## REQUIREMENTS
- Системные команды (старт/инициализация новой игры) должны работать в любом состоянии, включая режим магазина.
- Блокировки режима торговца должны остаться для “игровых” действий (бой/касты/сброс и т.д.).

## IMPLEMENTATION
- Доменный allowlist экшенов во время merchant‑режима расширен на `START_GAME` и `INIT_GAME`.
- Инвариант зафиксирован комментариями/документацией.

## TESTING / VERIFICATION
- Ручная проверка: New Game работает, даже если торговец активен.

## LESSONS LEARNED
- Для любых “режимов”, которые блокируют действия, нужно явно отделять:
  - **игровые** действия (можно блокировать),
  - **системные** команды (нельзя блокировать).

## REFERENCES
- Reflection: `memory-bank/reflection/reflection-traveling-merchant-new-game-while-active-v1.md`
- Mechanics: `memory-bank/gameMechanics.md`


