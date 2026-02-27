/* oxlint-disable no-console */
/**
 * Example 10: All Options Combined
 *
 * This example demonstrates using all available options together
 * for maximum control over PDF processing.
 *
 * Available options:
 * - password: string - for encrypted PDFs
 * - concurrency: number - parallel page processing (default: 1)
 * - scale: number - image rendering resolution (default: 1)
 * - imageEncoding: 'png' | 'jpeg' | 'webp' | 'avif' - output format (default: 'png')
 */

import { writeFile } from 'node:fs/promises';

import { parsePdf, pdf2image, pdf2string } from '../dist/index.js';
import {
  ENCRYPTED_PDF_PATH,
  ensureOutputDir,
  IMAGE_PDF_PATH,
  outputPath,
  PASSWORD,
  PDF_PATH,
} from './utils.js';

async function batchProcessing() {
  console.log('\n=== Batch Processing Multiple PDFs ===');

  const pdfFiles = [
    { name: 'example.pdf', path: PDF_PATH },
    { name: 'example-img.pdf', path: IMAGE_PDF_PATH },
    { name: 'example-encrypted.pdf', path: ENCRYPTED_PDF_PATH },
  ];

  const options = {
    concurrency: 4,
    imageEncoding: 'webp' as const,
    scale: 2,
  };

  for (const pdfFile of pdfFiles) {
    try {
      // For encrypted PDF, add password
      const fileOptions = pdfFile.name.includes('encrypted')
        ? { ...options, password: PASSWORD }
        : options;

      const pages = await pdf2string(pdfFile.path, fileOptions);
      console.log(`${pdfFile.name}: ${pages.length} pages extracted`);
    } catch (error) {
      console.log(`${pdfFile.name}: Failed - ${(error as Error).message}`);
    }
  }
}

async function fullImageRendering() {
  console.log('\n=== Full Image Rendering with All Options ===');

  const images = await pdf2image(ENCRYPTED_PDF_PATH, {
    concurrency: 8, // Process 8 pages in parallel
    imageEncoding: 'webp', // Modern compression format
    password: PASSWORD, // Decrypt the PDF
    scale: 3.0, // High quality rendering
  });

  console.log(`Rendered ${images.length} images`);

  // Save all images
  for (let i = 0; i < images.length; i++) {
    const filename = `output-page-${i + 1}.webp`;
    await writeFile(outputPath(filename), images[i]);
    console.log(
      `Saved ${filename} (${images[i].byteLength.toLocaleString()} bytes)`,
    );
  }
}

async function fullParsePdf() {
  console.log('\n=== Full parsePdf with All Options ===');

  interface PageResult {
    content: Buffer | string;
    pageNumber: number;
    size: number;
    timestamp: string;
    totalPages: number;
    type: 'image' | 'text';
  }

  const results = await parsePdf<PageResult>(
    ENCRYPTED_PDF_PATH,
    {
      concurrency: 4,
      imageEncoding: 'jpeg',
      password: PASSWORD,
      scale: 2.5,
    },
    (content, pageNumber, pageCount) => {
      const isText = typeof content === 'string';
      return {
        content,
        pageNumber,
        size: isText ? content.length : (content as Buffer).byteLength,
        timestamp: new Date().toISOString(),
        totalPages: pageCount,
        type: isText ? 'text' : 'image',
      };
    },
  );

  console.log(`Processed ${results.length} pages:`);
  results.forEach((r) => {
    console.log(
      `  Page ${r.pageNumber}: ${r.type} (${r.size} ${
        r.type === 'text' ? 'chars' : 'bytes'
      })`,
    );
  });
}

async function fullTextExtraction() {
  console.log('=== Full Text Extraction with All Options ===');

  const pages = await pdf2string(ENCRYPTED_PDF_PATH, {
    concurrency: 4, // Process 4 pages in parallel
    imageEncoding: 'png', // Format for any image pages
    password: PASSWORD, // Decrypt the PDF
    scale: 2, // For any image-based pages
  });

  console.log(`Extracted ${pages.length} pages`);
  console.log(`Total characters: ${pages.join('').length}`);
}

async function main() {
  await ensureOutputDir();
  await fullTextExtraction();
  await fullImageRendering();
  await fullParsePdf();
  await productionConfiguration();
  await memoryConstrainedConfiguration();
  await qualityFocusedConfiguration();
  await batchProcessing();
}

async function memoryConstrainedConfiguration() {
  console.log('\n=== Memory-Constrained Configuration ===');

  // Settings for memory-constrained environments
  const lowMemoryOptions = {
    concurrency: 1, // Sequential processing
    imageEncoding: 'jpeg' as const, // Smaller files
    scale: 1.5, // Lower resolution
  };

  const images = await pdf2image(PDF_PATH, lowMemoryOptions);

  console.log(`Rendered ${images.length} images with minimal memory usage`);
  const totalSize = images.reduce((sum, img) => sum + img.byteLength, 0);
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

async function productionConfiguration() {
  console.log('\n=== Production Configuration ===');

  // High-performance settings for production
  const productionOptions = {
    concurrency: 8, // Maximize parallel processing
    imageEncoding: 'webp' as const, // Best compression
    scale: 2, // Good quality without excessive memory
  };

  const start = Date.now();
  const pages = await pdf2string(PDF_PATH, productionOptions);
  const elapsed = Date.now() - start;

  console.log(`Processed ${pages.length} pages in ${elapsed}ms`);
  console.log(`Average: ${(elapsed / pages.length).toFixed(2)}ms per page`);
}

async function qualityFocusedConfiguration() {
  console.log('\n=== Quality-Focused Configuration ===');

  // Settings for maximum quality output
  const highQualityOptions = {
    concurrency: 2, // Moderate parallelism
    imageEncoding: 'png' as const, // Lossless compression
    scale: 4.0, // Maximum resolution
  };

  const images = await pdf2image(PDF_PATH, highQualityOptions);

  console.log(`Rendered ${images.length} high-quality images`);
  images.forEach((img, i) => {
    console.log(
      `  Page ${i + 1}: ${(img.byteLength / 1024 / 1024).toFixed(2)} MB`,
    );
  });
}

main().catch(console.error);
