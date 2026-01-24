/* eslint-disable no-console */
/**
 * Example 04: Basic Image Rendering
 *
 * The pdf2image function renders all PDF pages as images.
 * Returns an array of Buffers containing image data (PNG by default).
 */

import { writeFile } from 'node:fs/promises';

import { pdf2image } from '../dist/index.js';
import { ensureOutputDir, outputPath, PDF_PATH } from './utils.js';

async function main() {
  await ensureOutputDir();

  // Basic usage: render all pages as images
  const images = await pdf2image(PDF_PATH);

  console.log(`Rendered ${images.length} pages as images`);

  // Save each page as an image file
  for (let i = 0; i < images.length; i++) {
    const filename = `page-${i + 1}.png`;
    await writeFile(outputPath(filename), images[i]);
    console.log(`Saved ${filename} (${images[i].byteLength} bytes)`);
  }

  // You can also work with the buffers directly
  // For example, upload to cloud storage, send via API, etc.
  const firstPageBuffer = images[0];
  console.log(`\nFirst page buffer length: ${firstPageBuffer.byteLength}`);
}

main().catch(console.error);
