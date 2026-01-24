/* eslint-disable no-console */
/**
 * Example 08: parsePdf with Custom Callback
 *
 * The parsePdf function is the low-level API for advanced use cases.
 * It intelligently detects page content type:
 * - Text-based pages return string content
 * - Image-based pages return Buffer content
 *
 * The callback receives: (content, pageNumber, pageCount)
 * - content: Buffer | string - the page content
 * - pageNumber: number - current page (1-indexed)
 * - pageCount: number - total pages in document
 */

import { writeFile } from 'node:fs/promises';

import { parsePdf } from '../dist/index.js';
import {
  ensureOutputDir,
  IMAGE_PDF_PATH,
  outputPath,
  PDF_PATH,
} from './utils.js';

interface PageInfo {
  contentLength: number;
  pageNumber: number;
  totalPages: number;
  type: 'image' | 'text';
}

async function asyncCallback() {
  console.log('\n=== Async Callback Processing ===');

  const results = await parsePdf(
    PDF_PATH,
    { concurrency: 4 },
    async (content, pageNumber, pageCount) => {
      // Simulate async processing (e.g., API call, database save)
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        isLast: pageNumber === pageCount,
        pageNumber,
        processedAt: new Date().toISOString(),
      };
    },
  );

  console.log(`Processed ${results.length} pages asynchronously`);
}

async function basicCallback() {
  console.log('=== Basic Callback ===');

  const results = await parsePdf(
    PDF_PATH,
    {}, // Empty options uses defaults
    (content, pageNumber, pageCount) => {
      const isText = typeof content === 'string';
      return `Page ${pageNumber}/${pageCount}: ${isText ? 'text' : 'image'}`;
    },
  );

  results.forEach((result) => console.log(result));
}

async function complexTransformation() {
  console.log('\n=== Complex Transformation ===');

  interface ProcessedPage {
    metadata: {
      byteSize?: number;
      charCount?: number;
      preview?: string;
    };
    pageNumber: number;
    summary: string;
    totalPages: number;
    type: 'image' | 'text';
  }

  const pages = await parsePdf<ProcessedPage>(
    PDF_PATH,
    { imageEncoding: 'png', scale: 2.0 },
    (content, pageNumber, pageCount) => {
      const isText = typeof content === 'string';

      if (isText) {
        return {
          metadata: {
            charCount: content.length,
            preview: content.substring(0, 100).replace(/\n/g, ' '),
          },
          pageNumber,
          summary: `Text page with ${content.length} characters`,
          totalPages: pageCount,
          type: 'text',
        };
      } else {
        const buffer = content as Buffer;
        return {
          metadata: {
            byteSize: buffer.byteLength,
          },
          pageNumber,
          summary: `Image page (${buffer.byteLength} bytes)`,
          totalPages: pageCount,
          type: 'image',
        };
      }
    },
  );

  pages.forEach((page) => {
    console.log(`\nPage ${page.pageNumber}/${page.totalPages}`);
    console.log(`  Type: ${page.type}`);
    console.log(`  Summary: ${page.summary}`);
    if (page.metadata.preview) {
      console.log(`  Preview: ${page.metadata.preview}...`);
    }
  });
}

async function detectContentType() {
  console.log('\n=== Content Type Detection ===');

  const results = await parsePdf<PageInfo>(
    IMAGE_PDF_PATH,
    { scale: 2.0 },
    (content, pageNumber, pageCount) => {
      const isText = typeof content === 'string';
      return {
        contentLength: isText ? content.length : (content as Buffer).byteLength,
        pageNumber,
        totalPages: pageCount,
        type: isText ? 'text' : 'image',
      };
    },
  );

  results.forEach((info) => {
    console.log(
      `Page ${info.pageNumber}: ${info.type} (${info.contentLength} ${info.type === 'text' ? 'chars' : 'bytes'})`,
    );
  });
}

async function main() {
  await ensureOutputDir();
  await basicCallback();
  await detectContentType();
  await processTextPages();
  await saveImagePages();
  await asyncCallback();
  await complexTransformation();
}

async function processTextPages() {
  console.log('\n=== Process Text Pages ===');

  const textPages = await parsePdf(PDF_PATH, {}, (content, pageNumber) => {
    if (typeof content === 'string') {
      // Process text: count words, extract keywords, etc.
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      return { page: pageNumber, text: content, wordCount };
    }
    // Skip image pages or handle differently
    return { page: pageNumber, text: null, wordCount: 0 };
  });

  textPages
    .filter((p) => p.text !== null)
    .forEach((p) => {
      console.log(`Page ${p.page}: ${p.wordCount} words`);
    });
}

async function saveImagePages() {
  console.log('\n=== Save Image Pages ===');

  const savedFiles = await parsePdf(
    IMAGE_PDF_PATH,
    { imageEncoding: 'webp', scale: 2.5 },
    async (content, pageNumber) => {
      if (typeof content !== 'string') {
        const filename = `page-${pageNumber}.webp`;
        await writeFile(outputPath(filename), content);
        return filename;
      }
      return null; // Text page, nothing to save
    },
  );

  savedFiles
    .filter((f) => f !== null)
    .forEach((filename) => console.log(`Saved: ${filename}`));
}

main().catch(console.error);
