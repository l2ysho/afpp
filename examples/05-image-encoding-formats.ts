/* eslint-disable no-console */
/**
 * Example 05: Image Encoding Formats
 *
 * AFPP supports multiple image encoding formats:
 * - 'png'  - Lossless, larger file size (default)
 * - 'jpeg' - Lossy, smaller file size, good for photos
 * - 'webp' - Modern format, excellent compression
 * - 'avif' - Next-gen format, best compression
 */

import { writeFile } from 'node:fs/promises';

import { pdf2image } from '../dist/index.js';
import { ensureOutputDir, outputPath, PDF_PATH } from './utils.js';

async function compareFormats() {
  console.log('\n=== Format Comparison ===');

  const [png, jpeg, webp, avif] = await Promise.all([
    pdf2image(PDF_PATH, { imageEncoding: 'png' }),
    pdf2image(PDF_PATH, { imageEncoding: 'jpeg' }),
    pdf2image(PDF_PATH, { imageEncoding: 'webp' }),
    pdf2image(PDF_PATH, { imageEncoding: 'avif' }),
  ]);

  console.log('First page sizes:');
  console.log(`  PNG:  ${png[0].byteLength.toLocaleString()} bytes`);
  console.log(`  JPEG: ${jpeg[0].byteLength.toLocaleString()} bytes`);
  console.log(`  WebP: ${webp[0].byteLength.toLocaleString()} bytes`);
  console.log(`  AVIF: ${avif[0].byteLength.toLocaleString()} bytes`);
}

async function main() {
  await ensureOutputDir();
  await renderAsPng();
  await renderAsJpeg();
  await renderAsWebp();
  await renderAsAvif();
  await compareFormats();
}

async function renderAsAvif() {
  console.log('\n=== AVIF Format ===');

  // AVIF - next-generation format, best compression
  const images = await pdf2image(PDF_PATH, {
    imageEncoding: 'avif',
  });

  await writeFile(outputPath('output-avif.avif'), images[0]);
  console.log(`AVIF size: ${images[0].byteLength} bytes`);
}

async function renderAsJpeg() {
  console.log('\n=== JPEG Format ===');

  // JPEG - lossy compression, smaller files
  const images = await pdf2image(PDF_PATH, {
    imageEncoding: 'jpeg',
  });

  await writeFile(outputPath('output-jpeg.jpg'), images[0]);
  console.log(`JPEG size: ${images[0].byteLength} bytes`);
}

async function renderAsPng() {
  console.log('=== PNG Format (default) ===');

  // PNG is the default format - lossless compression
  const images = await pdf2image(PDF_PATH, {
    imageEncoding: 'png',
  });

  await writeFile(outputPath('output-png.png'), images[0]);
  console.log(`PNG size: ${images[0].byteLength} bytes`);
}

async function renderAsWebp() {
  console.log('\n=== WebP Format ===');

  // WebP - modern format with excellent compression
  const images = await pdf2image(PDF_PATH, {
    imageEncoding: 'webp',
  });

  await writeFile(outputPath('output-webp.webp'), images[0]);
  console.log(`WebP size: ${images[0].byteLength} bytes`);
}

main().catch(console.error);
