/* oxlint-disable no-console */
/**
 * Benchmark script for pdf2pic
 *
 * Measures time and RSS memory usage for PDF image rendering.
 * Results are saved to benchmark/pdf2pic/output/results.json
 *
 * Usage:
 *   npx tsx benchmark/pdf2pic/run.ts [runs]
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

// @ts-expect-error pdf2pic is installed in docker
import { fromPath } from 'pdf2pic';
// @ts-expect-error pdf2pic is installed in docker
import pdf2picPkg from 'pdf2pic/package.json' with { type: 'json' };

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

interface ConvertResult {
  base64?: string;
  buffer?: Buffer;
  name?: string;
  page: number;
  size?: string;
}

async function convertPdfToImages(pdfPath: string): Promise<ConvertResult[]> {
  // density: 72 matches scale:1 in pdfjs-based tools (72 DPI is PDF standard)
  // width/height: 595x841 matches pdfjs output dimensions exactly
  // Note: pdf2pic uses GraphicsMagick/Ghostscript which outputs grayscale for
  // text-only PDFs, while pdfjs-based tools output RGBA. This is expected behavior.
  const options = {
    density: 72,
    format: 'png',
    height: 841,
    width: 595,
  };

  const convert = fromPath(pdfPath, options);

  // Convert all 9 pages of example.pdf
  return await convert.bulk([1, 2, 3, 4, 5, 6, 7, 8, 9], {
    responseType: 'buffer',
  });
}

async function main() {
  const runs = parseRuns();

  const result = await runBenchmark(
    {
      name: 'pdf2pic',
      outputDir: OUTPUT_DIR,
      packageVersion: pdf2picPkg.version,
      runs,
      saveOutput: shouldSaveOutput(),
      warmupRuns: 20,
    },
    {
      operation: () => convertPdfToImages(PDF_PATH),
      saveOutput: async (results: ConvertResult[]) => {
        for (const item of results) {
          if (item.buffer) {
            await writeFile(
              join(OUTPUT_DIR, `page-${item.page}.png`),
              item.buffer,
            );
          }
        }
        console.log(`Saved ${results.length} sample images.`);
      },
    },
  );

  printSummary(result);
  await saveResults(result, OUTPUT_DIR);
}

main().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
