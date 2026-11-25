# AGENTS.md — pdf-split

Guidance for AI agents working on the **pdf-split** repository — a CLI utility that splits PDFs by page.

## About the project

**pdf-split** is a small command-line utility. It reads one PDF and creates N single-page files named `1.pdf` … `N.pdf`. No UI, no server, no DB.

**Commits:** [Conventional Commits](https://www.conventionalcommits.org/) in English (`feat:`, `fix:`, `docs:`).

## Stack

| Layer | Technologies |
|---|---|
|Runtime|Bun (dev), Node.js 18+ (prod)|
|Language|TypeScript 5, ESM (`"type": "module"`)|
|PDF|[pdf-lib](https://pdf-lib.js.org/)|

## Quick start

```bash
bun install
bun run split document.pdf [output-dir] [--crop-top <mm>] [--crop-bottom <mm>]
```

For Node.js after code changes:

```bash
bun run build
node dist/split.js document.pdf [output-dir] [--crop-top <mm>] [--crop-bottom <mm>]
```

## Repository structure

```
src/
  split.ts        # CLI (main), parseArgs, splitPdf()
dist/             # tsc output, bin entry: dist/split.js
package.json
tsconfig.json
README.md
```

## Architecture

```
CLI args → parseArgs() → splitPdf({ inputPath, outputDir, cropTopMm, cropBottomMm })
                              ↓
        PDFDocument.load(bytes, { ignoreEncryption, throwOnInvalidObject: false })
                              ↓
              for each page: copyPages → optional crop (CropBox/MediaBox) → save → {i+1}.pdf
```

### Key points

| Function | File | Purpose |
|---|---|---|
|`splitPdf`|`src/split.ts`|Core logic; exported for reuse|
|`parseArgs`|`src/split.ts`|Parses `process.argv`, default output folder `<name>-pages`|
|`main`|`src/split.ts`|CLI entry point, exit code 1 on error|

### Default behavior

- Output folder: `dirname(input) / `${basename(input, '.pdf')}-pages``
- Numbering starts at 1, not 0
- `mkdir(outputDir, { recursive: true })` before writing
- PDF loading: `ignoreEncryption: true`, `throwOnInvalidObject: false` — best compatibility with "softly" encrypted and slightly broken files; no password prompt
- Cropping: `--crop-top` / `--crop-bottom` in millimeters (default `0`); mm → pt via `mm * 72 / 25.4`; after `copyPages`, `setCropBox` and `setMediaBox` are applied (origin at bottom-left)

## Conventions for changes

- Minimal diff — the utility is intentionally simple
- No UI, web server, or test framework without an explicit request
- PDF operations only via `pdf-lib`; don't pull heavy native dependencies without a reason
- Keep `splitPdf` exported — CLI and library usage in one file
- Resolve paths via `node:path` (`resolve`, `join`)
- File I/O via `node:fs/promises`

## What not to do

- Don't change the naming scheme (`1.pdf` … `N.pdf`) without agreement
- Don't commit `node_modules/`, `dist/`, test PDFs, or artifacts (`out/`, `*-pages/`)
- Don't add Tailwind, React, or other frontend stack — the project is CLI-only
- Don't complicate argument parsing (yargs/commander) without a user request

## Useful commands

```bash
bun install
bun run split <file.pdf> [dir] [--crop-top <mm>] [--crop-bottom <mm>]
bun run build
node dist/split.js <file.pdf> [dir] [--crop-top <mm>] [--crop-bottom <mm>]
```

## Possible extensions (on request only)

- Page ranges (`--pages 1-5,10`)
- Splitting into K parts (not one page each)
- Overwrite / dry-run flags
- Password-protected PDF support (decryption by password)
- Left/right cropping (`--crop-left` / `--crop-right`)
