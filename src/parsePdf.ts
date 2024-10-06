/* eslint-disable no-underscore-dangle */
import { readFile } from 'node:fs/promises';

import { createCanvas } from 'canvas';
import type {
  DocumentInitParameters,
  TextItem,
} from 'pdfjs-dist/types/src/display/api.js';
import { PDFPageProxy } from 'pdfjs-dist/types/web/interfaces';

type ParsePdfCallback<T> = (content: Buffer | string) => T;

const defaultParsePdfCallback: ParsePdfCallback<Buffer | string> = (content) =>
  content;

const parsePdfFileBuffer = async <T = Buffer | string>(
  options: DocumentInitParameters,
  callback: ParsePdfCallback<T> = defaultParsePdfCallback as ParsePdfCallback<T>,
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
    const pagePromises: Promise<PDFPageProxy | void>[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum += 1) {
      pagePromises.push(
        pdfDocument.getPage(pageNum).then(async (page) => {
          const textContent = await page.getTextContent({
            includeMarkedContent: false,
          });
          const items = textContent.items as TextItem[];
          if (items.length === 0) {
            const viewport = page.getViewport({ scale: 1.0 });
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');

            await page.render({ canvasContext: context, viewport }).promise;
            const imageBuffer = canvas.toBuffer();
            pageContents[pageNum - 1] = callback(imageBuffer);
          } else {
            const pageText = items.map((item) => item.str || '').join(' ');
            pageContents[pageNum - 1] = callback(pageText);
          }
        }),
      );
    }
    await Promise.all(pagePromises);
    return pageContents;
  });

type ParseOptions = {
  password?: string;
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
 * @param {function} callback - callback function to add another layer of processing, default callback returns content of page withouth any added processing.
 *
 * @since — v1.0.0
 *
 * @returns {Promise<string>} - A promise that resolves to the string representation of the PDF content.
 *
 * @throws {Error} Throws an error if the input type is invalid.
 */

export const parsePdf = async <T>(
  input: Buffer | URL | Uint8Array | string,
  options?: ParseOptions,
  callback: ParsePdfCallback<T> = defaultParsePdfCallback as ParsePdfCallback<T>,
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
