import {
  AfppParseOptions,
  parsePdfFile,
  PROCESSING_TYPE,
} from '#afpp/src/core.js';

/**
 * Converts a PDF file from various input formats (Buffer, Uint8Array, string path, or URL) to an array of image buffers.
 *
 * @async
 * @function pdf2image
 *
 * @param {Buffer|Uint8Array|string|URL} input - The PDF source, which can be a file path, URL, Buffer, or Uint8Array.
 * @param {AfppParseOptions} [options] - Optional parsing options for customizing the PDF parsing process.
 *
 * @since v1.0.0
 *
 * @returns {Promise<Buffer[]>} - A promise that resolves to an array of image buffers.
 *
 * @throws {Error} Throws an error if the input type is invalid.
 */
export const pdf2image = async (
  input: Buffer | string | Uint8Array | URL,
  options?: AfppParseOptions,
) => parsePdfFile(PROCESSING_TYPE.IMAGE, input, options);
