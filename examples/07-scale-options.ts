/* oxlint-disable no-console */
/**
 * Example 07: Scale Options
 *
 * The scale option controls the resolution of rendered images.
 * - Default: 1
 * - Lower values (0.5-1.0): smaller files, lower quality, less memory
 * - Higher values (2.0-4.0): larger files, higher quality, more memory
 *
 * This option affects pdf2image and image-based pages in parsePdf.
 */

import { writeFile } from 'node:fs/promises';

import { pdf2image } from '../dist/index.js';
import { ensureOutputDir, outputPath, PDF_PATH } from './utils.js';

async function compareScales() {
  console.log('\n=== Scale Comparison ===');

  const scales = [0.5, 1, 1.5, 2, 3, 4];

  for (const scale of scales) {
    const images = await pdf2image(PDF_PATH, { scale });
    console.log(
      `Scale ${scale}: ${images[0].byteLength.toLocaleString()} bytes`,
    );
  }
}

async function defaultQuality() {
  console.log('\n=== Default Quality (scale: 1) ===');

  const images = await pdf2image(PDF_PATH, {
    scale: 1, // Default
  });

  await writeFile(outputPath('output-scale-1.png'), images[0]);
  console.log(`Size: ${images[0].byteLength.toLocaleString()} bytes`);
}

async function highQuality() {
  console.log('\n=== High Quality (scale: 3.0) ===');

  const images = await pdf2image(PDF_PATH, {
    scale: 3.0, // Higher quality
  });

  await writeFile(outputPath('output-scale-3.0.png'), images[0]);
  console.log(`Size: ${images[0].byteLength.toLocaleString()} bytes`);
}

async function lowQuality() {
  console.log('=== Low Quality (scale: 0.5) ===');

  const images = await pdf2image(PDF_PATH, {
    scale: 0.5, // Minimum quality, smallest files
  });

  await writeFile(outputPath('output-scale-0.5.png'), images[0]);
  console.log(`Size: ${images[0].byteLength.toLocaleString()} bytes`);
}

async function main() {
  await ensureOutputDir();
  await lowQuality();
  await defaultQuality();
  await highQuality();
  await maximumQuality();
  await compareScales();
  await memoryOptimized();
}

async function maximumQuality() {
  console.log('\n=== Maximum Quality (scale: 4.0) ===');

  const images = await pdf2image(PDF_PATH, {
    scale: 4.0, // Maximum quality, largest files
  });

  await writeFile(outputPath('output-scale-4.0.png'), images[0]);
  console.log(`Size: ${images[0].byteLength.toLocaleString()} bytes`);
}

async function memoryOptimized() {
  console.log('\n=== Memory Optimized Settings ===');

  // For large PDFs on memory-constrained systems
  const images = await pdf2image(PDF_PATH, {
    concurrency: 1, // Sequential processing
    imageEncoding: 'jpeg', // Smaller file size
    scale: 1.5, // Lower quality
  });

  console.log(`Rendered ${images.length} pages with minimal memory usage`);
}

main().catch(console.error);
