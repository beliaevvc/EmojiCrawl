/**
 * Скрипт генерации истории версий (build/version history) для Skazmor Playtest.
 *
 * Зачем он нужен
 * - В игре удобно показывать “версию билда” и список последних изменений (коммиты) прямо в UI.
 * - Чтобы не поддерживать этот список вручную, мы берём данные из Git на момент сборки/запуска скрипта.
 *
 * Что он делает
 * 1) Формирует версию в виде `0.1.N`, где `N` считается ЗАНОВО (с 0) после большого рефакторинга.
 *
 *    Как считается `N`
 *    - Мы фиксируем “точку старта” серии 0.1.x (конкретный коммит) и считаем количество коммитов ПОСЛЕ него.
 *    - Команда: `git rev-list --count <BASE_REF>..HEAD`
 *      - Если `HEAD === BASE_REF`, то счётчик будет `0` (то, что нам и нужно для “с нуля”).
 *
 *    Откуда берётся BASE_REF
 *    - По умолчанию он зашит в константу `DEFAULT_VERSION_BASE_REF` в этом файле.
 *    - При необходимости можно переопределить через env-переменную `SKAZMOR_VERSION_BASE_REF`
 *      (удобно для CI или если захотим “перезапустить” серию без правок кода).
 *
 * 2) Собирает последние 50 коммитов для “чейнджлога”:
 *    - команда: `git log --pretty=format:"%h|%ad|%s" --date=format:"%d.%m.%Y %H:%M" -n 50`
 *    - формат строки: `hash|date|message`
 *    - парсинг: каждая строка превращается в объект `{ hash, date, message }`
 *
 * 3) Формирует объект версии:
 *    - `version`: строка вида `0.1.<N>`
 *    - `buildDate`: локальная дата/время машины, где выполнен скрипт (`new Date().toLocaleString()`)
 *    - `commits`: массив последних коммитов
 *    - `baseRef`: какой коммит считается “нулём” для серии 0.1.x (для прозрачности/диагностики)
 *
 * 4) Записывает результат в JSON файл:
 *    - путь: `src/data/version_history.json`
 *    - форматирование: JSON с отступами (pretty print, 2 пробела)
 *
 * 5) Важно: история коммитов НЕ должна “обнуляться” при каждом запуске.
 *    Поэтому мы:
 *    - читаем существующий `src/data/version_history.json` (если есть),
 *    - мержим новые коммиты (из git log) со старыми,
 *    - удаляем дубликаты по `hash`,
 *    - и только затем перезаписываем файл.
 *
 * Важно про ошибки/окружение
 * - Скрипт зависит от наличия Git и того, что он запускается внутри git-репозитория.
 * - Если любая из git-команд упадёт (например, в окружении без .git), мы пишем fallback-файл:
 *   `{ version: 'dev', commits: [] }`
 *   Это позволяет приложению не падать из-за отсутствия истории версий.
 */

import { execSync } from 'child_process';
import fs from 'fs';

try {
  // Версионная серия после рефакторинга: 0.1.N
  // N должен считаться “с нуля” от заранее выбранного коммита (base ref).
  //
  // ВАЖНО: если когда-нибудь захотим “перезапустить” серию снова, достаточно:
  // - поменять DEFAULT_VERSION_BASE_REF (в коде)
  //   или
  // - задать env `SKAZMOR_VERSION_BASE_REF` без правок кода.
  const VERSION_PREFIX = '0.1';
  const DEFAULT_VERSION_BASE_REF = 'c85a59e31ae9575fcce07d6a8a24de2e536ebf5b';
  const VERSION_HISTORY_PATH = 'src/data/version_history.json';
  const DEFAULT_LOG_LIMIT = 200;

  const baseRef = process.env.SKAZMOR_VERSION_BASE_REF || DEFAULT_VERSION_BASE_REF;
  const buildNumber = execSync(`git rev-list --count ${baseRef}..HEAD`).toString().trim();
  
  // Get git log with format: hash|date|message
  const logLimit = Number.parseInt(process.env.SKAZMOR_VERSION_LOG_LIMIT || '', 10) || DEFAULT_LOG_LIMIT;
  const log = execSync(
    `git log --pretty=format:"%h|%ad|%s" --date=format:"%d.%m.%Y %H:%M" -n ${logLimit}`
  ).toString();
  
  const newCommits = log
    .split('\n')
    .map((line) => {
      const [hash, date, message] = line.split('|');
      return { hash, date, message };
    })
    .filter((c) => c.hash); // Filter empty lines

  // Подхватываем уже сохранённую историю (если файл существует),
  // чтобы не “обнулять” список коммитов на каждом запуске.
  let existingCommits = [];
  try {
    if (fs.existsSync(VERSION_HISTORY_PATH)) {
      const existingRaw = fs.readFileSync(VERSION_HISTORY_PATH, 'utf-8');
      const existingJson = JSON.parse(existingRaw);
      if (Array.isArray(existingJson?.commits)) existingCommits = existingJson.commits;
    }
  } catch {
    // Если existing JSON повреждён/не парсится — просто считаем, что истории нет.
    existingCommits = [];
  }

  // Мержим: новые сверху, старые ниже; дубликаты по hash убираем.
  const seen = new Set();
  const commits = [];
  for (const c of [...newCommits, ...existingCommits]) {
    if (!c?.hash) continue;
    if (seen.has(c.hash)) continue;
    seen.add(c.hash);
    commits.push(c);
  }

  const versionData = {
    version: `${VERSION_PREFIX}.${buildNumber}`,
    buildDate: new Date().toLocaleString(),
    baseRef,
    commits
  };

  fs.writeFileSync(VERSION_HISTORY_PATH, JSON.stringify(versionData, null, 2));
  console.log(`✅ Version history generated! Build: v${versionData.version}`);
} catch (e) {
  console.error('❌ Failed to generate version history:', e);
  // Важно: при ошибке не затираем существующую историю версий.
  // Фоллбек пишем только если файла ещё нет (например, первый запуск вне git).
  if (!fs.existsSync('src/data/version_history.json')) {
    fs.writeFileSync('src/data/version_history.json', JSON.stringify({ version: 'dev', commits: [] }));
  }
}
