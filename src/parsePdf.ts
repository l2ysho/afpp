import { readFile } from 'node:fs/promises';

import { createCanvas } from '@napi-rs/canvas';
import pLimit from 'p-limit';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type {
  DocumentInitParameters,
  TextItem,
} from 'pdfjs-dist/types/src/display/api.js';
import { PDFPageProxy } from 'pdfjs-dist/types/web/interfaces';

export type PageProcessor<T> = (
  content: Buffer | string,
  pageNumber: number,
  pageCount: number,
) => Promise<T> | T;

type ImageEncoding = 'avif' | 'jpeg' | 'png' | 'webp';

interface ParseOptions {
  /**
   * Concurrency level for page processing.
   */
  concurrency?: number;

  /**
   * Image encoding format when rendering non-text pages. Defaults to 'png'.
   */
  imageEncoding?: ImageEncoding;

  /**
   * Password for encrypted pdf files.
   */
  password?: string;

  /**
   * Scale of a page if content is not text.
   */
  scale: number;
}

const processPdfPage = async <T>(
  page: PDFPageProxy,
  pageNumber: number,
  pageCount: number,
  scale: number,
  encoding: ImageEncoding,
  callback: PageProcessor<T>,
): Promise<T> => {
  const textContent = await page.getTextContent({
    includeMarkedContent: false,
  });
  const items = textContent.items as TextItem[];

  if (items.length === 0) {
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    await page.render({ canvasContext: context, viewport }).promise;
    //@ts-expect-error this should be fixed in release
    const imageBuffer = await canvas.encode(encoding);
    return callback(imageBuffer, pageNumber, pageCount);
  }

  const pageText = items.map((item) => item.str || '').join(' ');
  return callback(pageText, pageNumber, pageCount);
};

const parsePdfFileBuffer = async <T>(
  options: DocumentInitParameters,
  scale: number,
  concurrency: number,
  encoding: ImageEncoding,
  callback: PageProcessor<T>,
): Promise<T[]> => {
  const limit = pLimit(concurrency);
  const loadingTask = getDocument({ ...options, verbosity: 0 });
  const pdfDocument = await loadingTask.promise;
  const { numPages } = pdfDocument;
  const results: T[] = new Array(numPages);

  const pageTasks = Array.from({ length: numPages }, (_, i) => {
    const pageNum = i + 1;
    return limit(async () => {
      const page = await pdfDocument.getPage(pageNum);

      const result = await processPdfPage(
        page,
        pageNum,
        numPages,
        scale,
        encoding,
        callback,
      );
      results[i] = result;
    });
  });

  await Promise.all(pageTasks);
  return results;
};

/**
 * Converts a PDF file from various input formats (Buffer, Uint8Array, string path, or URL). Pages are returned in mixed array of strings (text content) and buffers (image content) with in callback function.
 *
 * @async
 * @function pdf2string
 *
 * @param {Buffer|Uint8Array|string|URL} input - The PDF source, which can be a file path, URL, Buffer, or Uint8Array.
 * @param {Object} [options] - Optional parsing options for customizing the PDF parsing process.
 * @param {string} [options.password] - The password for encrypted PDF files, if required.
 * @param {number} [options.scale=2.0] - Scale factor for rendering pages (affects image resolution).
 * @param {number} [options.concurrency=1] - Number of pages to process in parallel.
 * @param {'png' | 'jpeg' | 'webp' | 'avif'} [options.imageEncoding='png'] - Image format for rendered PDF pages.
 * @param {function} callback - callback function to add another layer of processing, default callback returns content of page withouth any added processing.
 *
 * @since — v1.0.0
 *
 * @returns {Promise<string>} - A promise that resolves to the string representation of the PDF content.
 *
 * @throws {Error} Throws an error if the input type is invalid.
 */

export const parsePdf = async <T>(
  input: Buffer | string | Uint8Array | URL,
  options: ParseOptions,
  callback: PageProcessor<T>,
): Promise<T[]> => {
  if (typeof callback !== 'function') {
    throw new Error(`Invalid callback type: ${typeof callback}`);
  }

  const scale = options.scale ?? 2.0;
  const concurrency = options.concurrency ?? 1;
  const encoding = options.imageEncoding ?? 'png';

  if (!['avif', 'jpeg', 'png', 'webp'].includes(encoding)) {
    throw new Error(`Unsupported image encoding format: '${encoding}'`);
  }

  const baseOptions = { ...options };

  if (typeof input === 'string') {
    const fileBuffer = await readFile(input);
    return parsePdfFileBuffer(
      { data: new Uint8Array(fileBuffer), ...baseOptions },
      scale,
      concurrency,
      encoding,
      callback,
    );
  }

  if (Buffer.isBuffer(input)) {
    return parsePdfFileBuffer(
      { data: new Uint8Array(input), ...baseOptions },
      scale,
      concurrency,
      encoding,
      callback,
    );
  }

  if (input instanceof Uint8Array) {
    return parsePdfFileBuffer(
      { data: input, ...baseOptions },
      scale,
      concurrency,
      encoding,
      callback,
    );
  }

  if (input instanceof URL) {
    return parsePdfFileBuffer(
      { url: input, ...baseOptions },
      scale,
      concurrency,
      encoding,
      callback,
    );
  }

  throw new Error(`Invalid source type: ${typeof input}`);
};
