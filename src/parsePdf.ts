import {
  AfppParseOptions,
  PageProcessor,
  parsePdfFile,
  PROCESSING_TYPE,
} from '#afpp/src/core';

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
  options: AfppParseOptions,
  callback: PageProcessor<T>,
): Promise<T[]> =>
  parsePdfFile(PROCESSING_TYPE.MIXED, input, options, callback);
