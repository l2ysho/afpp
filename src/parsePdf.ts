import { readFile } from 'node:fs/promises';

import { createCanvas } from '@napi-rs/canvas';
import type {
  DocumentInitParameters,
  TextItem,
} from 'pdfjs-dist/types/src/display/api.js';
import { PDFPageProxy } from 'pdfjs-dist/types/web/interfaces';

export type ParsePdfCallback<T> = (
  content: Buffer | string,
  pageNumber: number,
  pageCount: number,
) => Promise<T> | T;

const parsePdfFileBuffer = async <T = Buffer | string>(
  options: DocumentInitParameters,
  callback: ParsePdfCallback<T>,
) =>
  import('pdfjs-dist/legacy/build/pdf.mjs').then(async (pdfjsLib) => {
    const loadingTask = pdfjsLib.getDocument({
      ...options,
      verbosity: 0,
    });

    const pdfDocument = await loadingTask.promise;

    const { numPages } = pdfDocument;
    const pageContents: T[] = Array.from(
      { length: numPages },
      () => null as unknown as T,
    );
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    const pagePromises: Promise<PDFPageProxy | void>[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum += 1) {
      pagePromises.push(
        pdfDocument.getPage(pageNum).then(async (page) => {
          const textContent = await page.getTextContent({
            includeMarkedContent: false,
          });
          const items = textContent.items as TextItem[];
          if (items.length === 0) {
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');

            await page.render({ canvasContext: context, viewport }).promise;

            const imageBuffer = await canvas.encode('png');
            // eslint-disable-next-line promise/no-callback-in-promise
            pageContents[pageNum - 1] = await callback(
              imageBuffer,
              pageNum,
              numPages,
            );
            return page;
          } else {
            const pageText = items.map((item) => item.str || '').join(' ');
            // eslint-disable-next-line promise/no-callback-in-promise
            pageContents[pageNum - 1] = await callback(
              pageText,
              pageNum,
              numPages,
            );
            return page;
          }
        }),
      );
    }
    await Promise.all(pagePromises);
    return pageContents;
  });

interface ParseOptions {
  /**
   * Password for encrypted pdf files.
   */
  password?: string;
  /**
   * Scale of a page if content is not text.
   */
  scale: number;
}

/**
 * Converts a PDF file from various input formats (Buffer, Uint8Array, string path, or URL). Pages are returned in mixed array of strings (text content) and buffers (image content) with in callback function.
 *
 * @async
 * @function pdf2string
 *
 * @param {Buffer|Uint8Array|string|URL} input - The PDF source, which can be a file path, URL, Buffer, or Uint8Array.
 * @param {Object} [options] - Optional parsing options for customizing the PDF parsing process.
 * @param {string} [options.password] - The password for encrypted PDF files, if required.
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
  callback: ParsePdfCallback<T>,
) => {
  if (typeof callback !== 'function') {
    throw new Error(`Invalid callback type: ${typeof callback}`);
  }
  if (typeof input === 'string') {
    const fileBuffer = await readFile(input, {});
    const data = new Uint8Array(fileBuffer);
    return parsePdfFileBuffer({ data, ...options }, callback);
  }
  if (Buffer.isBuffer(input)) {
    const data = new Uint8Array(input);
    return parsePdfFileBuffer({ data, ...options }, callback);
  }
  if (input instanceof Uint8Array) {
    return parsePdfFileBuffer({ data: input, ...options }, callback);
  }
  if (input instanceof URL) {
    return parsePdfFileBuffer({ url: input, ...options }, callback);
  }
  throw new Error(`Invalid source type: ${typeof input}`);
};
