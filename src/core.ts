import { readFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';

import { Canvas, CanvasRenderingContext2D } from '@napi-rs/canvas';
import pLimit from 'p-limit';
import { getDocument, VerbosityLevel } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type {
  DocumentInitParameters,
  TextItem,
} from 'pdfjs-dist/types/src/display/api.js';
import { PDFPageProxy } from 'pdfjs-dist/types/web/interfaces';

export enum PROCESSING_TYPE {
  IMAGE = 'IMAGE',
  MIXED = 'MIXED',
  TEXT = 'TEXT',
}

export interface AfppParseOptions {
  /**
   * Concurrency level for page processing. Defaults to 1.
   * Higher values may improve performance but increase memory usage.
   * Set to 'auto' to use the number of available CPU cores (capped at 8).
   * @default 1
   */
  concurrency?: number | 'auto';
  /**
   * Image encoding format when rendering non-text pages. Defaults to 'png'.
   * Supported formats: 'avif', 'jpeg', 'png', 'webp'.
   * @default 'png'
   */
  imageEncoding?: ImageEncoding;

  /**
   * Password for encrypted pdf files.
   */
  password?: string;

  /**
   * Scale factor for image rendering. Defaults to 1.0.
   * - 1.0: Standard quality (72 DPI equivalent)
   * - 2.0: High quality (144 DPI equivalent, 4x memory)
   * - 3.0: Print quality (216 DPI equivalent, 9x memory)
   * @default 1.0
   */
  scale?: number;
}

export interface CanvasAndContext {
  canvas: Canvas;
  context: CanvasRenderingContext2D;
}

export type ImageEncoding = 'avif' | 'jpeg' | 'png' | 'webp';

export type PageProcessor<T> = (
  content: Buffer | string,
  pageNumber: number,
  pageCount: number,
) => Promise<T> | T;

export interface PdfCanvasFactory {
  create(width: number, height: number): CanvasAndContext;
  destroy(canvasAndContext: CanvasAndContext): void;
  reset(
    canvasAndContext: CanvasAndContext,
    width: number,
    height: number,
  ): void;
}

const extractText = (items: TextItem[]): string => {
  const parts: string[] = [];
  for (const item of items) {
    if (item.str) parts.push(item.str);
  }
  return parts.join(' ');
};

const processPdfPageTypeMixed = async <T>(
  page: PDFPageProxy,
  canvasFactory: PdfCanvasFactory,
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

    const canvasAndContext = canvasFactory.create(
      viewport.width,
      viewport.height,
    );

    try {
      await page.render({
        canvas: canvasAndContext.canvas,
        canvasContext: canvasAndContext.context,
        viewport,
      }).promise;
      //@ts-expect-error this should be fixed in release
      const imageBuffer = await canvasAndContext.canvas.encode(encoding);
      return callback(imageBuffer, pageNumber, pageCount);
    } finally {
      canvasFactory.destroy(canvasAndContext);
    }
  }

  return callback(extractText(items), pageNumber, pageCount);
};

const processPdfPageTypeText = async (page: PDFPageProxy) => {
  const textContent = await page.getTextContent({
    includeMarkedContent: false,
  });
  const items = textContent.items as TextItem[];

  return extractText(items);
};

const processPdfPageTypeImage = async (
  page: PDFPageProxy,
  canvasFactory: PdfCanvasFactory,
  pageNumber: number,
  pageCount: number,
  scale: number,
  encoding: ImageEncoding,
) => {
  const viewport = page.getViewport({ scale });

  const canvasAndContext = canvasFactory.create(
    viewport.width,
    viewport.height,
  );

  try {
    await page.render({
      canvas: canvasAndContext.canvas,
      canvasContext: canvasAndContext.context,
      viewport,
    }).promise;
    //@ts-expect-error this should be fixed in release
    const imageBuffer = await canvasAndContext.canvas.encode(encoding);
    return imageBuffer;
  } finally {
    canvasFactory.destroy(canvasAndContext);
  }
};

const validateParameters = async (
  input: Buffer | string | Uint8Array | URL,
  options?: AfppParseOptions,
) => {
  const documentInitParameters: DocumentInitParameters = {};

  switch (true) {
    case typeof input === 'string':
      documentInitParameters.data = new Uint8Array(await readFile(input));
      break;
    case Buffer.isBuffer(input):
      documentInitParameters.data = new Uint8Array(input);
      break;
    case input instanceof Uint8Array:
      documentInitParameters.data = input;
      break;
    case input instanceof URL:
      documentInitParameters.url = input;
      break;
    default:
      throw new Error(`Invalid source type: ${typeof input}`);
  }

  documentInitParameters.password = options?.password;
  documentInitParameters.verbosity = VerbosityLevel.ERRORS;
  // Performance optimizations for local file processing
  documentInitParameters.disableAutoFetch = true; // Don't prefetch - we have full data
  documentInitParameters.disableStream = true; // Don't stream - we have full data
  documentInitParameters.disableRange = true; // Don't use range requests - we have full data

  const scale = options?.scale ?? 1.0;

  if (Number.isNaN(scale) || scale < 0.1 || scale > 10) {
    throw new Error(
      `Invalid scale value: ${scale}. Must be a number between 0.1 and 10.`,
    );
  }

  const concurrency =
    options?.concurrency === 'auto'
      ? Math.min(availableParallelism(), 8)
      : (options?.concurrency ?? 1);

  if (
    typeof concurrency === 'number' &&
    (!Number.isInteger(concurrency) || concurrency < 1)
  ) {
    throw new Error(
      `Invalid concurrency value: ${concurrency}. Must be a positive integer or 'auto'.`,
    );
  }

  const encoding = options?.imageEncoding ?? 'png';

  if (!['avif', 'jpeg', 'png', 'webp'].includes(encoding)) {
    throw new Error(`Unsupported image encoding format: '${encoding}'`);
  }

  return { concurrency, documentInitParameters, encoding, scale };
};

/**
 * Result yielded by streaming PDF parser
 */
export interface StreamingResult<T> {
  data: T;
  pageCount: number;
  pageNumber: number;
}

export async function parsePdfFile(
  type: PROCESSING_TYPE.IMAGE,
  input: Buffer | string | Uint8Array | URL,
  options?: AfppParseOptions,
  callback?: undefined,
): Promise<Buffer[]>;
export async function parsePdfFile(
  type: PROCESSING_TYPE.TEXT,
  input: Buffer | string | Uint8Array | URL,
  options?: AfppParseOptions,
  callback?: undefined,
): Promise<string[]>;
export async function parsePdfFile<T>(
  type: PROCESSING_TYPE.MIXED,
  input: Buffer | string | Uint8Array | URL,
  options: AfppParseOptions,
  callback: PageProcessor<T>,
): Promise<T[]>;
export async function parsePdfFile<T>(
  type: PROCESSING_TYPE,
  input: Buffer | string | Uint8Array | URL,
  options?: AfppParseOptions,
  callback?: PageProcessor<T>,
): Promise<Buffer[] | string[] | T[]> {
  const { concurrency, documentInitParameters, encoding, scale } =
    await validateParameters(input, options);

  const limit = pLimit(concurrency);
  const loadingTask = getDocument(documentInitParameters);
  const pdfDocument = await loadingTask.promise;

  try {
    const { numPages } = pdfDocument;

    if (type === PROCESSING_TYPE.MIXED) {
      if (!callback || typeof callback !== 'function') {
        throw new Error(`Invalid callback type: ${typeof callback}`);
      }
      const results: T[] = Array.from({ length: numPages });

      const pageTasks = Array.from({ length: numPages }, (_, i) => {
        const pageNum = i + 1;
        return limit(async () => {
          const page = await pdfDocument.getPage(pageNum);
          const canvasFactory = pdfDocument.canvasFactory as PdfCanvasFactory;

          const result = await processPdfPageTypeMixed(
            page,
            canvasFactory,
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
    }

    if (type === PROCESSING_TYPE.TEXT) {
      const results: string[] = Array.from({ length: numPages });
      const pageTasks = Array.from({ length: numPages }, (_, i) => {
        const pageNum = i + 1;
        return limit(async () => {
          const page = await pdfDocument.getPage(pageNum);
          results[i] = await processPdfPageTypeText(page);
        });
      });

      await Promise.all(pageTasks);
      return results;
    }

    if (type === PROCESSING_TYPE.IMAGE) {
      const results: Buffer[] = Array.from({ length: numPages });
      const pageTasks = Array.from({ length: numPages }, (_, i) => {
        const pageNum = i + 1;
        return limit(async () => {
          const page = await pdfDocument.getPage(pageNum);
          const canvasFactory = pdfDocument.canvasFactory as PdfCanvasFactory;
          results[i] = await processPdfPageTypeImage(
            page,
            canvasFactory,
            pageNum,
            numPages,
            scale,
            encoding,
          );
        });
      });

      await Promise.all(pageTasks);
      return results;
    }

    throw new Error('Invalid PROCESSING_TYPE');
  } finally {
    // Clean up pdfjs resources to prevent memory leaks
    pdfDocument.cleanup();
    await pdfDocument.destroy();
    loadingTask.destroy();
  }
}

/**
 * Streaming PDF parser that yields results as pages are processed.
 * Useful for large PDFs where you want to process pages as they become available
 * rather than waiting for all pages to complete.
 *
 * @example
 * ```typescript
 * for await (const { pageNumber, data } of streamPdfFile(PROCESSING_TYPE.IMAGE, './large.pdf')) {
 *   await saveImage(data, `page-${pageNumber}.png`);
 * }
 * ```
 */
export function streamPdfFile(
  type: PROCESSING_TYPE.IMAGE,
  input: Buffer | string | Uint8Array | URL,
  options?: AfppParseOptions,
): AsyncGenerator<StreamingResult<Buffer>>;
export function streamPdfFile(
  type: PROCESSING_TYPE.TEXT,
  input: Buffer | string | Uint8Array | URL,
  options?: AfppParseOptions,
): AsyncGenerator<StreamingResult<string>>;
export async function* streamPdfFile(
  type: PROCESSING_TYPE.IMAGE | PROCESSING_TYPE.TEXT,
  input: Buffer | string | Uint8Array | URL,
  options?: AfppParseOptions,
): AsyncGenerator<StreamingResult<Buffer | string>> {
  const { documentInitParameters, encoding, scale } = await validateParameters(
    input,
    options,
  );

  const loadingTask = getDocument(documentInitParameters);
  const pdfDocument = await loadingTask.promise;

  try {
    const { numPages } = pdfDocument;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);

      if (type === PROCESSING_TYPE.IMAGE) {
        const canvasFactory = pdfDocument.canvasFactory as PdfCanvasFactory;
        const data = await processPdfPageTypeImage(
          page,
          canvasFactory,
          pageNum,
          numPages,
          scale,
          encoding,
        );
        yield { data, pageCount: numPages, pageNumber: pageNum };
      } else {
        const data = await processPdfPageTypeText(page);
        yield { data, pageCount: numPages, pageNumber: pageNum };
      }
    }
  } finally {
    pdfDocument.cleanup();
    await pdfDocument.destroy();
    loadingTask.destroy();
  }
}
