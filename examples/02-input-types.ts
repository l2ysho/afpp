/* eslint-disable no-console */
/**
 * Example 02: Different Input Types
 *
 * AFPP supports multiple input types for flexibility:
 * - string: Local file path
 * - Buffer: Node.js Buffer containing PDF data
 * - Uint8Array: Typed array with PDF bytes
 * - URL: Remote PDF URL
 */

import { readFile } from 'node:fs/promises';

import { pdf2string } from '../dist/index.js';
import { PDF_PATH } from './utils.js';

async function fromBuffer() {
  console.log('\n=== From Buffer ===');

  // Read PDF into a Buffer first
  const buffer = await readFile(PDF_PATH);
  const pages = await pdf2string(buffer);
  console.log(`Extracted ${pages.length} pages from Buffer`);
}

async function fromFilePath() {
  console.log('=== From File Path ===');

  // Simply pass a file path string
  const pages = await pdf2string(PDF_PATH);
  console.log(`Extracted ${pages.length} pages from file path`);
}

async function fromUint8Array() {
  console.log('\n=== From Uint8Array ===');

  // Convert Buffer to Uint8Array
  const buffer = await readFile(PDF_PATH);
  const uint8Array = new Uint8Array(buffer);
  const pages = await pdf2string(uint8Array);
  console.log(`Extracted ${pages.length} pages from Uint8Array`);
}

async function fromUrl() {
  console.log('\n=== From URL ===');

  // Pass a URL object for remote PDFs
  const url = new URL('https://pdfobject.com/pdf/sample.pdf');
  const pages = await pdf2string(url);
  console.log(`Extracted ${pages.length} pages from URL`);
}

async function main() {
  await fromFilePath();
  await fromBuffer();
  await fromUint8Array();
  await fromUrl();
}

main().catch(console.error);
