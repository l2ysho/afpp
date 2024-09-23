/* eslint-disable no-underscore-dangle */
import { readFile } from 'node:fs/promises';

import { createCanvas } from 'canvas';
import { type DocumentInitParameters } from 'pdfjs-dist/types/src/display/api.js';
import { NodeCanvasFactory } from 'pdfjs-dist/types/src/display/node_utils';
import { PDFPageProxy } from 'pdfjs-dist/types/web/interfaces';

const parsePdfFileBuffer = async (options: DocumentInitParameters) =>
  import('pdfjs-dist/legacy/build/pdf.mjs').then(async (pdfjsLib) => {
    const loadingTask = pdfjsLib.getDocument({
      ...options,
      verbosity: 0, // TODO enable for debug
    });

    const pdfDocument = await loadingTask.promise;
    // get a canvas factory method from pdfjs-dist
    const { canvasFactory } = pdfDocument._transport as {
      canvasFactory: NodeCanvasFactory;
    };

    if (!canvasFactory) {
      throw new Error('Get canvas error, check current node version');
    }

    const { numPages } = pdfDocument;
    const pageContents: Buffer[] = new Array<Buffer>(numPages).fill(
      Buffer.from(''),
    );
    const pagePromises: Promise<PDFPageProxy | void>[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum += 1) {
      pagePromises.push(
        pdfDocument.getPage(pageNum).then(async (page) => {
          const viewport = page.getViewport({ scale: 1.0 });
          const canvas = createCanvas(viewport.width, viewport.height);
          const context = canvas.getContext('2d');

          await page.render({ canvasContext: context, viewport }).promise;
          const imageBuffer = canvas.toBuffer();
          pageContents[pageNum - 1] = imageBuffer;
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
export const pdf2image = async (
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
