import {
  AfppParseOptions,
  PageProcessor,
  parsePdfFile,
  PROCESSING_TYPE,
} from '#afpp/src/core';

/**
 * Converts a PDF file from various input formats (Buffer, Uint8Array, string path, or URL). Pages are returned in mixed array of strings (text content) and buffers (image content) via callback function.
 *
 * @async
 * @function parsePdf
 *
 * @param {Buffer|Uint8Array|string|URL} input - The PDF source, which can be a file path, URL, Buffer, or Uint8Array.
 * @param {AfppParseOptions} options - Parsing options for customizing the PDF parsing process.
 * @param {PageProcessor<T>} callback - Callback function to process each page's content.
 *
 * @since v1.0.0
 *
 * @returns {Promise<T[]>} - A promise that resolves to an array of processed page results.
 *
 * @throws {Error} Throws an error if the input type is invalid.
 */

export const parsePdf = async <T>(
  input: Buffer | string | Uint8Array | URL,
  options: AfppParseOptions,
  callback: PageProcessor<T>,
): Promise<T[]> =>
  parsePdfFile(PROCESSING_TYPE.MIXED, input, options, callback);
