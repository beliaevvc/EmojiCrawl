# TASK ARCHIVE: Versioning — `0.1.N` + сохранение истории коммитов (generate-version.js)

## METADATA
- **Task ID**: `versioning-0-1`
- **Дата**: 2025-12-20
- **Сложность**: Level 2 (Simple Enhancement / Tooling)

## SUMMARY
Обновили `scripts/generate-version.js`, чтобы:
- версия формировалась как **`0.1.N`**, где **`N` считается с 0** от заданной точки (`baseRef`);
- `src/data/version_history.json` **не затирался**, а аккуратно **мержился** с новыми данными (дедуп по `hash`);
- при ошибках Git скрипт **не перезаписывал** уже существующий `version_history.json` (защита от потери истории).

## REQUIREMENTS
- Перейти на серию версий `0.1.N` с “обнулением счётчика” внутри серии.
- Сохранить историю коммитов/версий в `version_history.json` без потерь.
- Сделать поведение надёжным при ошибках получения данных из git.

## IMPLEMENTATION
- `N` считается через `git rev-list --count <baseRef>..HEAD`.
- История:
  - читается существующий `version_history.json` (если есть),
  - берутся новые записи из `git log`,
  - выполняется merge (новые сверху) + дедуп по `hash`.
- Fallback‑логика не затирает существующий файл при ошибках git.

## TESTING / VERIFICATION
- Ручная проверка: версия меняется как `0.1.N`; история коммитов сохраняется и дополняется, без перезаписи.

## LESSONS LEARNED
- “Версия” и “история коммитов” — разные сущности: версию можно обнулить, историю — нельзя терять.
- В генераторах артефактов сборки важно исключать сценарии, где обработка ошибок стирает валидные данные.

## REFERENCES
- Reflection: `memory-bank/reflection/reflection-versioning-0-1.md`
- Script: `scripts/generate-version.js`
- Output: `src/data/version_history.json`


