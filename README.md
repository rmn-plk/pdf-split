# pdf-split

TypeScript CLI utility that splits a PDF into separate files — one page each. Output: `1.pdf`, `2.pdf`, … `N.pdf`, where **N** is the number of pages in the source document.

Runs via **Bun** (development) and **Node.js** (built output).

## Requirements

- [Bun](https://bun.sh/) 1.x — to run locally without building
- [Node.js](https://nodejs.org/) 18+ — to run the compiled `dist/`

## Installation

```bash
bun install
bun run build   # optional, for node dist/split.js
```

## Usage

### Bun

```bash
bun run split <input.pdf> [output-dir] [--crop-top <mm>] [--crop-bottom <mm>]
```

### Node.js

```bash
node dist/split.js <input.pdf> [output-dir] [--crop-top <mm>] [--crop-bottom <mm>]
```

### Arguments

| Argument      | Description |
|---------------|-------------|
| `input.pdf`   | Path to the source PDF |
| `output-dir`  | Output folder (default: `<file-name>-pages` next to the source file) |

### Options

| Option | Description |
|--------|-------------|
| `--crop-top <mm>` | Crop each page from the top by the given number of millimeters (default `0`) |
| `--crop-bottom <mm>` | Crop each page from the bottom by the given number of millimeters (default `0`) |

### Examples

```bash
bun run split document.pdf
# → document-pages/1.pdf, 2.pdf, …

bun run split document.pdf ./pages
# → ./pages/1.pdf, 2.pdf, …

bun run split document.pdf ./pages --crop-top 15 --crop-bottom 20
# → pages cropped 15 mm from the top and 20 mm from the bottom

node dist/split.js report.pdf ./out
```

## Programmatic API

The `splitPdf` function is exported from `src/split.ts` and returns the number of files created:

```ts
import { splitPdf } from "./split.js";

const count = await splitPdf({
  inputPath: "document.pdf",
  outputDir: "./pages",
  cropTopMm: 15,
  cropBottomMm: 20,
});
console.log(`Files created: ${count}`);
```

## Scripts

| Command        | Description |
|----------------|-------------|
| `bun run split` | Run the CLI via Bun (`src/split.ts`) |
| `bun run build` | Compile TypeScript → `dist/` |
| `bun run start` | Run `dist/split.js` via Node |

## Stack

- TypeScript 5
- [pdf-lib](https://pdf-lib.js.org/) — PDF reading and writing
- Bun / Node.js ESM (`"type": "module"`)

## Structure

```
src/
  split.ts      # CLI and splitPdf()
dist/           # tsc build output (gitignored)
package.json
tsconfig.json
```

## Limitations

- Each page is saved as a separate single-page PDF
- File names are always numeric: `1.pdf` … `N.pdf`
- Password-protected PDFs are not supported; files with an encryption flag but no password, and files with minor structural damage, may still open thanks to pdf-lib's lenient loading options
