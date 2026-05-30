/* oxlint-disable no-console */
/**
 * Benchmark script for AFPP - pdf2image with auto concurrency
 *
 * Measures time and RSS memory usage for PDF image rendering
 * using automatic concurrency based on available CPU cores.
 * Results are saved to benchmark/afpp-auto/output/results.json
 *
 * Usage:
 *   pnpm exec tsx benchmark/afpp-auto/run.ts [runs]
 *
 * Arguments:
 *   runs - Number of benchmark runs (default: 10)
 *
 * Environment:
 *   BENCHMARK_RUNS - Alternative way to set number of runs
 *   SAVE_IMAGES - Set to "true" to save result images to output folder
 */

import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { findPackageJSON } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// @ts-expect-error afpp is installed in docker
import { pdf2image } from 'afpp';

const afppPkg = JSON.parse(
  readFileSync(findPackageJSON('afpp', import.meta.url)!, 'utf-8'),
) as { version: string };

import {
  parseRuns,
  printSummary,
  runBenchmark,
  saveResults,
  shouldSaveOutput,
} from '../utils.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'output');
const PDF_PATH = join(__dirname, '../../test/example.pdf');

async function main() {
  const runs = parseRuns();

  const result = await runBenchmark(
    {
      name: 'afpp-pdf2image-auto',
      outputDir: OUTPUT_DIR,
      packageVersion: afppPkg.version,
      runs,
      saveOutput: shouldSaveOutput(),
      warmupRuns: 20,
    },
    {
      operation: async () =>
        pdf2image(PDF_PATH, { concurrency: 'auto', scale: 1 }),
      saveOutput: async (images: Buffer[]) => {
        for (let i = 0; i < images.length; i++) {
          await writeFile(join(OUTPUT_DIR, `page-${i + 1}.png`), images[i]);
        }
        console.log(`Saved ${images.length} sample images.`);
      },
      warmup: async () =>
        pdf2image(PDF_PATH, {
          concurrency: 'auto',
          imageEncoding: 'png',
          scale: 1,
        }),
    },
  );

  printSummary(result);
  await saveResults(result, OUTPUT_DIR);
}

main().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
