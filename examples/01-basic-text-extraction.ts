/* oxlint-disable no-console */
/**
 * Example 01: Basic Text Extraction
 *
 * Demonstrates the simplest use case of AFPP - extracting text from a PDF file.
 * The pdf2string function returns an array of strings, one per page.
 */

import { pdf2string } from '../dist/index.js';
import { PDF_PATH } from './utils.js';

async function main() {
  // Basic usage: pass a file path to extract text from all pages
  const pages = await pdf2string(PDF_PATH);

  // Each element in the array contains the text content of a page
  console.log(`Total pages: ${pages.length}`);

  // Print each page's content
  pages.forEach((pageText, index) => {
    console.log(`\n--- Page ${index + 1} ---`);
    console.log(pageText);
  });

  // You can also join all pages into a single string
  const fullText = pages.join('\n\n');
  console.log('\n--- Full Document ---');
  console.log(fullText);
}

main().catch(console.error);
