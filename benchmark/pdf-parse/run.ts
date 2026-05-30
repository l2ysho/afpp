/* oxlint-disable no-console */
/**
 * Benchmark script for pdf-parse
 *
 * Measures time and RSS memory usage for PDF rendering.
 * Results are saved to benchmark/pdf-parse/output/results.json
 *
 * Usage:
 *   pnpm exec tsx benchmark/pdf-parse/run.ts [runs]
 *
 * Arguments:
 *   runs - Number of benchmark runs (default: 10)
 *
 * Environment:
 *   BENCHMARK_RUNS - Alternative way to set number of runs
 *   SAVE_IMAGES - Set to "true" to save result images to output folder
 */

import { readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// @ts-expect-error pdf-parse is installed in docker
import { PDFParse } from 'pdf-parse';

import {
  parseRuns,
  printSummary,
  runBenchmark,
  saveResults,
  shouldSaveOutput,
} from '../utils.ts';

const require = createRequire(import.meta.url);
const pdfParseEntry = require.resolve('pdf-parse');
// Traverse up to find package.json with the package name
let pdfParsePath = dirname(pdfParseEntry);
while (pdfParsePath !== '/') {
  try {
    const pkgContent = readFileSync(
      join(pdfParsePath, 'package.json'),
      'utf-8',
    );
    if (pkgContent.includes('"name": "pdf-parse"')) {
      break;
    }
  } catch {
    // package.json doesn't exist at this level, continue up
  }
  pdfParsePath = dirname(pdfParsePath);
}
const pdfParsePkg = JSON.parse(
  readFileSync(join(pdfParsePath, 'package.json'), 'utf-8'),
) as { version: string };

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'output');
const PDF_PATH = join(__dirname, '../../test/example.pdf');

async function main() {
  const runs = parseRuns();

  const result = await runBenchmark(
    {
      name: 'pdf-parse',
      outputDir: OUTPUT_DIR,
      packageVersion: pdfParsePkg.version,
      runs,
      saveOutput: shouldSaveOutput(),
      warmupRuns: 20,
    },
    {
      operation: () => parsePdf(PDF_PATH),
      saveOutput: async (images: Buffer[]) => {
        for (let i = 0; i < images.length; i++) {
          await writeFile(join(OUTPUT_DIR, `page-${i + 1}.png`), images[i]);
        }
        console.log(`Saved ${images.length} sample images.`);
      },
    },
  );

  printSummary(result);
  await saveResults(result, OUTPUT_DIR);
}

async function parsePdf(pdfPath: string): Promise<Buffer[]> {
  const buffer = await readFile(pdfPath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getScreenshot({ scale: 1 });
  await parser.destroy();
  return result.pages.map((page: { data: Buffer }) => page.data);
}

main().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
