#!/usr/bin/env node

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, basename, join } from "node:path";
import { PDFDocument } from "pdf-lib";

interface SplitOptions {
  inputPath: string;
  outputDir: string;
}

function printUsage(): void {
  console.log(`Usage: pdf-split <input.pdf> [output-dir]

Splits a PDF into separate files — one per page — named 1.pdf, 2.pdf, … N.pdf.

Arguments:
  input.pdf   Path to the source PDF file
  output-dir  Directory for output files (default: <input-name>-pages)

Examples:
  bun run split document.pdf
  bun run split document.pdf ./pages
  node dist/split.js document.pdf ./pages`);
}

function parseArgs(argv: string[]): SplitOptions | null {
  const args = argv.slice(2).filter((a) => !a.startsWith("-"));

  if (args.length === 0) {
    return null;
  }

  const inputPath = resolve(args[0]);
  const baseName = basename(inputPath, ".pdf");
  const outputDir = args[1]
    ? resolve(args[1])
    : resolve(dirname(inputPath), `${baseName}-pages`);

  return { inputPath, outputDir };
}

export async function splitPdf(options: SplitOptions): Promise<number> {
  const { inputPath, outputDir } = options;

  const bytes = await readFile(inputPath);

  const source = await PDFDocument.load(bytes, {
    ignoreEncryption: true,
    throwOnInvalidObject: false,
  });

  const pageCount = source.getPageCount();

  if (pageCount === 0) {
    throw new Error("PDF has no pages");
  }

  await mkdir(outputDir, { recursive: true });

  for (let i = 0; i < pageCount; i++) {
    const newDoc = await PDFDocument.create();

    const [page] = await newDoc.copyPages(source, [i]);
    newDoc.addPage(page);

    const pdfBytes = await newDoc.save();
    await writeFile(join(outputDir, `${i + 1}.pdf`), pdfBytes);
  }

  return pageCount;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv);

  if (!options) {
    printUsage();
    process.exit(1);
  }

  try {
    const count = await splitPdf(options);
    console.log(`Split into ${count} files in ${options.outputDir}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

main();
