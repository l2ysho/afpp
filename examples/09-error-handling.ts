/* oxlint-disable no-console */
/**
 * Example 09: Error Handling
 *
 * AFPP throws specific errors for different failure scenarios.
 * This example demonstrates how to handle common errors gracefully.
 */

import { pdf2image, pdf2string } from '../dist/index.js';
import { ENCRYPTED_PDF_PATH, PDF_PATH } from './utils.js';

async function handleCorruptedPdf() {
  console.log('\n=== Corrupted PDF Error ===');

  try {
    // Attempting to parse a corrupted or invalid PDF
    const corruptedBuffer = Buffer.from('not a valid pdf content');
    await pdf2string(corruptedBuffer);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Error message: ${error.message}`);
      // PDF.js will throw parsing errors
    }
  }
}

async function handleFileNotFound() {
  console.log('\n=== File Not Found Error ===');

  try {
    await pdf2string('nonexistent.pdf');
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Error message: ${error.message}`);
      // Error from filesystem or PDF.js
    }
  }
}

async function handleIncorrectPassword() {
  console.log('\n=== Incorrect Password Error ===');

  try {
    // Attempting to read encrypted PDF with wrong password
    await pdf2string(ENCRYPTED_PDF_PATH, {
      password: 'wrong-password',
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Error name: ${error.name}`);
      console.log(`Error message: ${error.message}`);
      // Expected: PasswordException - Incorrect Password
    }
  }
}

async function handleInvalidImageEncoding() {
  console.log('\n=== Invalid Image Encoding Error ===');

  try {
    // Using unsupported image encoding
    await pdf2image(PDF_PATH, {
      // @ts-expect-error - Intentionally passing wrong encoding for demo
      imageEncoding: 'bmp',
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Error message: ${error.message}`);
      // Expected: Unsupported image encoding format: 'bmp'
    }
  }
}

async function handleInvalidInputType() {
  console.log('\n=== Invalid Input Type Error ===');

  try {
    // Passing invalid input type
    // @ts-expect-error - Intentionally passing wrong type for demo
    await pdf2string(12345);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Error message: ${error.message}`);
      // Expected: Invalid source type: number
    }
  }
}

async function handleMissingPassword() {
  console.log('=== Missing Password Error ===');

  try {
    // Attempting to read encrypted PDF without password
    await pdf2string(ENCRYPTED_PDF_PATH);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Error name: ${error.name}`);
      console.log(`Error message: ${error.message}`);
      // Expected: PasswordException - No password given
    }
  }
}

async function main() {
  await handleMissingPassword();
  await handleIncorrectPassword();
  await handleInvalidInputType();
  await handleInvalidImageEncoding();
  await handleFileNotFound();
  await handleCorruptedPdf();
  await robustPdfProcessing();
}

async function robustPdfProcessing() {
  console.log('\n=== Robust PDF Processing ===');

  const possiblePasswords = ['password1', 'password2', 'example'];

  // Try without password first
  try {
    const pages = await pdf2string(ENCRYPTED_PDF_PATH);
    console.log(`Success without password: ${pages.length} pages`);
    return pages;
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('password')) {
      throw error; // Re-throw non-password errors
    }
    console.log('PDF is encrypted, trying passwords...');
  }

  // Try each password
  for (const password of possiblePasswords) {
    try {
      const pages = await pdf2string(ENCRYPTED_PDF_PATH, { password });
      console.log(`Success with password "${password}": ${pages.length} pages`);
      return pages;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Incorrect Password')
      ) {
        console.log(`Password "${password}" failed`);
        continue;
      }
      throw error; // Re-throw other errors
    }
  }

  throw new Error('All passwords failed');
}

main().catch(console.error);
