# AGENTS.md — pdf-split

Руководство для AI-агентов, работающих с репозиторием **pdf-split** — CLI-утилита разбиения PDF по страницам.

## О проекте

**pdf-split** — небольшая утилита командной строки. Читает один PDF, создаёт N одностраничных файлов с именами `1.pdf` … `N.pdf`. Без UI, без сервера, без БД.

**Коммиты:** [Conventional Commits](https://www.conventionalcommits.org/) на английском (`feat:`, `fix:`, `docs:`).

## Стек

| Слой | Технологии |
|------|------------|
| Runtime | Bun (dev), Node.js 18+ (prod) |
| Язык | TypeScript 5, ESM (`"type": "module"`) |
| PDF | [pdf-lib](https://pdf-lib.js.org/) |

## Быстрый старт

```bash
bun install
bun run split document.pdf [output-dir] [--crop-top <mm>] [--crop-bottom <mm>]
```

Для Node.js после изменений в коде:

```bash
bun run build
node dist/split.js document.pdf [output-dir] [--crop-top <mm>] [--crop-bottom <mm>]
```

## Структура репозитория

```
src/
  split.ts        # CLI (main), parseArgs, splitPdf()
dist/             # tsc output, bin entry: dist/split.js
package.json
tsconfig.json
README.md
```

## Архитектура

```
CLI args → parseArgs() → splitPdf({ inputPath, outputDir, cropTopMm, cropBottomMm })
                              ↓
        PDFDocument.load(bytes, { ignoreEncryption, throwOnInvalidObject: false })
                              ↓
              for each page: copyPages → optional crop (CropBox/MediaBox) → save → {i+1}.pdf
```

### Ключевые точки

| Функция | Файл | Назначение |
|---------|------|------------|
| `splitPdf` | `src/split.ts` | Основная логика; экспортируется для переиспользования |
| `parseArgs` | `src/split.ts` | Разбор `process.argv`, дефолтная папка `<name>-pages` |
| `main` | `src/split.ts` | Точка входа CLI, код выхода 1 при ошибке |

### Поведение по умолчанию

- Папка вывода: `dirname(input) / `${basename(input, '.pdf')}-pages``
- Нумерация с 1, не с нуля
- `mkdir(outputDir, { recursive: true })` перед записью
- Загрузка PDF: `ignoreEncryption: true`, `throwOnInvalidObject: false` — лучшая совместимость с «мягко» зашифрованными и слегка битым файлами; пароль не запрашивается
- Обрезка: `--crop-top` / `--crop-bottom` в миллиметрах (по умолчанию `0`); мм → pt через `mm * 72 / 25.4`; после `copyPages` выставляются `setCropBox` и `setMediaBox` (origin снизу слева)

## Соглашения при изменениях

- Минимальный diff — утилита намеренно простая
- Не добавлять UI, веб-сервер, тестовый фреймворк без явного запроса
- PDF-операции только через `pdf-lib`; не тянуть тяжёлые нативные зависимости без причины
- `splitPdf` оставлять экспортируемой — CLI и библиотечное использование в одном файле
- Пути резолвить через `node:path` (`resolve`, `join`)
- Файловая I/O — `node:fs/promises`

## Чего не делать

- Не менять схему имён (`1.pdf` … `N.pdf`) без согласования
- Не коммитить `node_modules/`, `dist/`, тестовые PDF и артефакты (`out/`, `*-pages/`)
- Не добавлять Tailwind, React и прочий frontend-стек — проект CLI-only
- Не усложнять парсинг аргументов (yargs/commander) без запроса пользователя

## Полезные команды

```bash
bun install
bun run split <file.pdf> [dir] [--crop-top <mm>] [--crop-bottom <mm>]
bun run build
node dist/split.js <file.pdf> [dir] [--crop-top <mm>] [--crop-bottom <mm>]
```

## Возможные расширения (только по запросу)

- Диапазоны страниц (`--pages 1-5,10`)
- Разбиение на K частей (не по одной странице)
- Перезапись / dry-run флаги
- Поддержка PDF с паролем (расшифровка по паролю)
- Обрезка слева/справа (`--crop-left` / `--crop-right`)
