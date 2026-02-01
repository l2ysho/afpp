/* oxlint-disable no-console */
/**
 * Example 06: Concurrency and Performance
 *
 * The concurrency option controls how many pages are processed in parallel.
 * - Default: 1 (sequential processing, minimal memory)
 * - Higher values: faster processing, more memory usage
 *
 * Recommended: 4-8 for large PDFs on modern systems.
 */

import { pdf2image, pdf2string } from '../dist/index.js';
import { PDF_PATH } from './utils.js';

async function compareConcurrencyLevels() {
  console.log('\n=== Concurrency Comparison ===');

  const concurrencyLevels = [1, 2, 4, 8];

  for (const concurrency of concurrencyLevels) {
    const start = Date.now();
    await pdf2string(PDF_PATH, { concurrency });
    const elapsed = Date.now() - start;

    console.log(`Concurrency ${concurrency}: ${elapsed}ms`);
  }
}

async function highConcurrency() {
  console.log('\n=== High Concurrency (concurrency: 8) ===');

  const start = Date.now();
  const images = await pdf2image(PDF_PATH, {
    concurrency: 8, // Process 8 pages simultaneously
  });
  const elapsed = Date.now() - start;

  console.log(`Rendered ${images.length} images in ${elapsed}ms`);
}

async function main() {
  await sequentialProcessing();
  await parallelProcessing();
  await highConcurrency();
  await compareConcurrencyLevels();
}

async function parallelProcessing() {
  console.log('\n=== Parallel Processing (concurrency: 4) ===');

  const start = Date.now();
  const pages = await pdf2string(PDF_PATH, {
    concurrency: 4, // Process 4 pages simultaneously
  });
  const elapsed = Date.now() - start;

  console.log(`Processed ${pages.length} pages in ${elapsed}ms`);
}

async function sequentialProcessing() {
  console.log('=== Sequential Processing (concurrency: 1) ===');

  const start = Date.now();
  const pages = await pdf2string(PDF_PATH, {
    concurrency: 1, // Default - one page at a time
  });
  const elapsed = Date.now() - start;

  console.log(`Processed ${pages.length} pages in ${elapsed}ms`);
}

main().catch(console.error);
