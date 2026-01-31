/* eslint-disable no-console */
/**
 * Benchmark script for AFPP - pdf2image
 *
 * Measures time and RSS memory usage for PDF image rendering.
 * Results are saved to benchmark/afpp/output/results.json
 *
 * Usage:
 *   npx tsx benchmark/afpp/run.ts [runs]
 *
 * Arguments:
 *   runs - Number of benchmark runs (default: 10)
 *
 * Environment:
 *   BENCHMARK_RUNS - Alternative way to set number of runs
 *   SAVE_IMAGES - Set to "true" to save result images to output folder
 */

import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// @ts-expect-error afpp is installed in docker
import { pdf2image } from 'afpp';

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
      name: 'afpp-pdf2image',
      outputDir: OUTPUT_DIR,
      runs,
      saveOutput: shouldSaveOutput(),
    },
    {
      operation: async () => pdf2image(PDF_PATH, { concurrency: 1, scale: 1 }),
      saveOutput: async (images: Buffer[]) => {
        for (let i = 0; i < images.length; i++) {
          await writeFile(join(OUTPUT_DIR, `page-${i + 1}.png`), images[i]);
        }
        console.log(`Saved ${images.length} sample images.`);
      },
      warmup: async () =>
        pdf2image(PDF_PATH, { imageEncoding: 'png', scale: 1 }),
    },
  );

  printSummary(result);
  await saveResults(result, OUTPUT_DIR);
}

main().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
