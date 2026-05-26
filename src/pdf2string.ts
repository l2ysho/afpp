import {
  AfppParseOptions,
  parsePdfFile,
  PROCESSING_TYPE,
} from '#afpp/src/core.js';

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
  input: Buffer | string | Uint8Array | URL,
  options?: AfppParseOptions,
) => parsePdfFile(PROCESSING_TYPE.TEXT, input, options);
