#!/usr/bin/env node

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, basename, join } from "node:path";
import { PDFDocument } from "pdf-lib";

const MM_TO_PT = 72 / 25.4;

interface SplitOptions {
  inputPath: string;
  outputDir: string;
  cropTopMm: number;
  cropBottomMm: number;
}

function printUsage(): void {
  console.log(`Usage: pdf-split <input.pdf> [output-dir] [--crop-top <mm>] [--crop-bottom <mm>]

Splits a PDF into separate files — one per page — named 1.pdf, 2.pdf, … N.pdf.

Arguments:
  input.pdf       Path to the source PDF file
  output-dir      Directory for output files (default: <input-name>-pages)

Options:
  --crop-top <mm>     Crop this many millimetres from the top of each page (default: 0)
  --crop-bottom <mm>  Crop this many millimetres from the bottom of each page (default: 0)

Examples:
  bun run split document.pdf
  bun run split document.pdf ./pages
  bun run split document.pdf ./pages --crop-top 15 --crop-bottom 20
  node dist/split.js document.pdf ./pages`);
}

function parseNonNegativeMm(flag: string, raw: string | undefined): number {
  if (raw === undefined) {
    throw new Error(`Missing value for ${flag}`);
  }

  const value = Number(raw);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${flag} expects a non-negative number (mm), got: ${raw}`);
  }

  return value;
}

function parseArgs(argv: string[]): SplitOptions | null {
  const tokens = argv.slice(2);
  const positional: string[] = [];
  let cropTopMm = 0;
  let cropBottomMm = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === "--crop-top") {
      cropTopMm = parseNonNegativeMm(token, tokens[++i]);
      continue;
    }

    if (token === "--crop-bottom") {
      cropBottomMm = parseNonNegativeMm(token, tokens[++i]);
      continue;
    }

    if (token.startsWith("-")) {
      throw new Error(`Unknown option: ${token}`);
    }

    positional.push(token);
  }

  if (positional.length === 0) {
    return null;
  }

  const inputPath = resolve(positional[0]);
  const baseName = basename(inputPath, ".pdf");
  const outputDir = positional[1]
    ? resolve(positional[1])
    : resolve(dirname(inputPath), `${baseName}-pages`);

  return { inputPath, outputDir, cropTopMm, cropBottomMm };
}

export async function splitPdf(options: SplitOptions): Promise<number> {
  const { inputPath, outputDir, cropTopMm, cropBottomMm } = options;
  const cropTopPt = cropTopMm * MM_TO_PT;
  const cropBottomPt = cropBottomMm * MM_TO_PT;

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

    if (cropTopPt > 0 || cropBottomPt > 0) {
      const { width, height } = page.getSize();
      const croppedHeight = height - cropTopPt - cropBottomPt;

      if (croppedHeight <= 0) {
        throw new Error(
          `Crop (${cropTopMm} mm top + ${cropBottomMm} mm bottom) exceeds page height on page ${i + 1}`,
        );
      }

      page.setCropBox(0, cropBottomPt, width, croppedHeight);
      page.setMediaBox(0, cropBottomPt, width, croppedHeight);
    }

    const pdfBytes = await newDoc.save();
    await writeFile(join(outputDir, `${i + 1}.pdf`), pdfBytes);
  }

  return pageCount;
}

async function main(): Promise<void> {
  let options: SplitOptions | null;

  try {
    options = parseArgs(process.argv);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    printUsage();
    process.exit(1);
    return;
  }

  if (!options) {
    printUsage();
    process.exit(1);
    return;
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
