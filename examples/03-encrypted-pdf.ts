/* eslint-disable no-console */
/**
 * Example 03: Encrypted PDF Handling
 *
 * AFPP seamlessly handles password-protected PDFs.
 * Simply pass the password in the options object.
 */

import { pdf2image, pdf2string } from '../dist/index.js';
import { ENCRYPTED_PDF_PATH, PASSWORD } from './utils.js';

async function extractTextFromEncrypted() {
  console.log('=== Text Extraction from Encrypted PDF ===');

  // Pass the password in the options object
  const pages = await pdf2string(ENCRYPTED_PDF_PATH, {
    password: PASSWORD,
  });

  console.log(`Extracted ${pages.length} pages`);
  pages.forEach((text, i) => {
    console.log(`Page ${i + 1}: ${text.substring(0, 100)}...`);
  });
}

async function main() {
  await extractTextFromEncrypted();
  await renderImagesFromEncrypted();
}

async function renderImagesFromEncrypted() {
  console.log('\n=== Image Rendering from Encrypted PDF ===');

  // Works the same way with pdf2image
  const images = await pdf2image(ENCRYPTED_PDF_PATH, {
    password: PASSWORD,
  });

  console.log(`Rendered ${images.length} images`);
  images.forEach((buffer, i) => {
    console.log(`Page ${i + 1}: ${buffer.byteLength} bytes`);
  });
}

main().catch(console.error);
