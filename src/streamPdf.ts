import {
  AfppParseOptions,
  PROCESSING_TYPE,
  StreamingResult,
  streamPdfFile,
} from '#afpp/src/core';

/**
 * Streams PDF pages as images, yielding each page as it's processed.
 * Useful for large PDFs where you want to process pages incrementally.
 *
 * @example
 * ```typescript
 * for await (const { pageNumber, data } of streamPdf2image('./large.pdf')) {
 *   await fs.writeFile(`page-${pageNumber}.png`, data);
 * }
 * ```
 *
 * @param input - The PDF source (file path, URL, Buffer, or Uint8Array)
 * @param options - Optional parsing options
 * @yields {StreamingResult<Buffer>} Page data with page number and total count
 */
export const streamPdf2image = (
  input: Buffer | string | Uint8Array | URL,
  options?: AfppParseOptions,
): AsyncGenerator<StreamingResult<Buffer>> =>
  streamPdfFile(PROCESSING_TYPE.IMAGE, input, options);

/**
 * Streams PDF pages as text, yielding each page as it's processed.
 * Useful for large PDFs where you want to process pages incrementally.
 *
 * @example
 * ```typescript
 * for await (const { pageNumber, data } of streamPdf2string('./large.pdf')) {
 *   console.log(`Page ${pageNumber}: ${data.substring(0, 100)}...`);
 * }
 * ```
 *
 * @param input - The PDF source (file path, URL, Buffer, or Uint8Array)
 * @param options - Optional parsing options
 * @yields {StreamingResult<string>} Page text with page number and total count
 */
export const streamPdf2string = (
  input: Buffer | string | Uint8Array | URL,
  options?: AfppParseOptions,
): AsyncGenerator<StreamingResult<string>> =>
  streamPdfFile(PROCESSING_TYPE.TEXT, input, options);
