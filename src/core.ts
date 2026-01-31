export enum PROCESSING_TYPE {
  IMAGE = 'IMAGE',
  MIXED = 'MIXED',
  TEXT = 'TEXT',
}

import { readFile } from 'node:fs/promises';

import { Canvas, CanvasRenderingContext2D } from '@napi-rs/canvas';
import pLimit from 'p-limit';
import { getDocument, VerbosityLevel } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type {
  DocumentInitParameters,
  TextItem,
} from 'pdfjs-dist/types/src/display/api.js';
import { PDFPageProxy } from 'pdfjs-dist/types/web/interfaces';

export interface AfppParseOptions {
  /**
   * Concurrency level for page processing. Defaults to 1.
   * Higher values may improve performance but increase memory usage.
   * @default 1
   */
  concurrency?: number;
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

  let pageText = '';
  for (const item of items) {
    if (item.str) {
      if (pageText) pageText += ' ';
      pageText += item.str;
    }
  }
  return callback(pageText, pageNumber, pageCount);
};

const processPdfPageTypeText = async (page: PDFPageProxy) => {
  const textContent = await page.getTextContent({
    includeMarkedContent: false,
  });
  const items = textContent.items as TextItem[];

  if (items.length === 0) {
    return '';
  } else {
    let pageText = '';
    for (const item of items) {
      if (item.str) {
        if (pageText) pageText += ' ';
        pageText += item.str;
      }
    }
    return pageText;
  }
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
  const concurrency = options?.concurrency ?? 1;
  const encoding = options?.imageEncoding ?? 'png';

  if (!['avif', 'jpeg', 'png', 'webp'].includes(encoding)) {
    throw new Error(`Unsupported image encoding format: '${encoding}'`);
  }

  return { concurrency, documentInitParameters, encoding, scale };
};

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
      const results: T[] = new Array(numPages);

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
      const results: string[] = new Array(numPages);
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
      const results: Buffer[] = new Array(numPages);
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
