# pdf-split

CLI-утилита на TypeScript для разбиения PDF на отдельные файлы — по одной странице в каждом. Результат: `1.pdf`, `2.pdf`, … `N.pdf`, где **N** — число страниц исходного документа.

Работает через **Bun** (разработка) и **Node.js** (сборка).

## Требования

- [Bun](https://bun.sh/) 1.x — для локального запуска без сборки
- [Node.js](https://nodejs.org/) 18+ — для запуска скомпилированного `dist/`

## Установка

```bash
bun install
bun run build   # опционально, для node dist/split.js
```

## Использование

### Bun

```bash
bun run split <input.pdf> [output-dir]
```

### Node.js

```bash
node dist/split.js <input.pdf> [output-dir]
```

### Аргументы

| Аргумент      | Описание |
|---------------|----------|
| `input.pdf`   | Путь к исходному PDF |
| `output-dir`  | Папка для результата (по умолчанию: `<имя-файла>-pages` рядом с исходником) |

### Примеры

```bash
bun run split document.pdf
# → document-pages/1.pdf, 2.pdf, …

bun run split document.pdf ./pages
# → ./pages/1.pdf, 2.pdf, …

node dist/split.js report.pdf ./out
```

## Программный API

Функция `splitPdf` экспортируется из `src/split.ts` и возвращает количество созданных файлов:

```ts
import { splitPdf } from "./split.js";

const count = await splitPdf({
  inputPath: "document.pdf",
  outputDir: "./pages",
});
console.log(`Создано файлов: ${count}`);
```

## Скрипты

| Команда        | Описание |
|----------------|----------|
| `bun run split` | Запуск CLI через Bun (`src/split.ts`) |
| `bun run build` | Компиляция TypeScript → `dist/` |
| `bun run start` | Запуск `dist/split.js` через Node |

## Стек

- TypeScript 5
- [pdf-lib](https://pdf-lib.js.org/) — чтение и запись PDF
- Bun / Node.js ESM (`"type": "module"`)

## Структура

```
src/
  split.ts      # CLI и splitPdf()
dist/           # сборка tsc (в .gitignore)
package.json
tsconfig.json
```

## Ограничения

- Каждая страница сохраняется в отдельный одностраничный PDF
- Имена файлов всегда числовые: `1.pdf` … `N.pdf`
- PDF с паролем не поддерживаются; файлы с флагом шифрования без пароля и с мелкими повреждениями структуры могут открываться за счёт мягких опций загрузки pdf-lib
