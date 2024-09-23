import { readFile } from 'node:fs/promises';

import type {
  DocumentInitParameters,
  TextItem,
} from 'pdfjs-dist/types/src/display/api.js';
import { PDFPageProxy } from 'pdfjs-dist/types/web/interfaces';

const parsePdfFileBuffer = async (options: DocumentInitParameters) =>
  import('pdfjs-dist/legacy/build/pdf.mjs').then(async (pdfjsLib) => {
    const loadingTask = pdfjsLib.getDocument({
      ...options,
      verbosity: 0, // TODO enable for debug
    });
    const pdfDocument = await loadingTask.promise;

    const { numPages } = pdfDocument;
    const pageContents: string[] = new Array<string>(numPages).fill('');
    const pagePromises: Promise<PDFPageProxy | void>[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum += 1) {
      pagePromises.push(
        pdfDocument.getPage(pageNum).then(async (page) => {
          const textContent = await page.getTextContent({
            includeMarkedContent: false,
          });
          // ? Type assertion of items to TextItem[] should be safe because {includeMarkedContent: false}
          const items = textContent.items as TextItem[];
          if (items.length === 0) {
            pageContents[pageNum - 1] = '';
          } else {
            const pageText = items.map((item) => item.str || '').join(' ');
            pageContents[pageNum - 1] = pageText;
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
 * Converts a PDF file from various input formats (Buffer, Uint8Array, string path, or URL) to a string.
 *
 * @async
 * @function pdf2string
 *
 * @param {Buffer|Uint8Array|string|URL} input - The PDF source, which can be a file path, URL, Buffer, or Uint8Array.
 * @param {Object} [options] - Optional parsing options for customizing the PDF parsing process.
 * @param {string} [options.password] - The password for encrypted PDF files, if required.
 *
 * @since — v1.0.0
 *
 * @returns {Promise<string>} - A promise that resolves to the string representation of the PDF content.
 *
 * @throws {Error} Throws an error if the input type is invalid.
 */
export const pdf2string = async (
  input: Buffer | URL | Uint8Array | string,
  options?: ParseOptions,
) => {
  if (typeof input === 'string') {
    const fileBuffer = await readFile(input, {});
    const data = new Uint8Array(fileBuffer);
    return parsePdfFileBuffer({ data, ...options });
  }
  if (Buffer.isBuffer(input)) {
    const data = new Uint8Array(input);
    return parsePdfFileBuffer({ data, ...options });
  }
  if (input instanceof Uint8Array) {
    return parsePdfFileBuffer({ data: input, ...options });
  }
  if (input instanceof URL) {
    return parsePdfFileBuffer({ url: input, ...options });
  }
  throw new Error(`Invalid source type: ${typeof input}`);
};
