import { availableParallelism } from 'node:os';

import {
  Canvas,
  CanvasRenderingContext2D,
  createCanvas,
} from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type {
  PDFPageProxy,
  TextItem,
} from 'pdfjs-dist/types/src/display/api.js';

import { resolveInput } from '#afpp/src/resolveInput.js';

function pLimit(concurrency: number) {
  const queue: Array<() => void> = [];
  let active = 0;
  const next = () => {
    if (active < concurrency && queue.length > 0) {
      active++;
      queue.shift()!();
    }
  };
  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      queue.push(() => {
        fn()
          .then(resolve, reject)
          .finally(() => {
            active--;
            next();
          });
      });
      next();
    });
}

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
   * Maximum size, in pixels (width × height), of a rendered page canvas and of
   * an embedded image. Rendering a page larger than this rejects with an error,
   * and embedded images larger than this are skipped, so a crafted PDF cannot
   * make the process allocate unbounded memory. Defaults to 2^27 (~134M pixels,
   * ~512 MiB per canvas), which fits an A3 page at scale 10.
   * @default 134217728
   */
  maxCanvasPixels?: number;

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

const DEFAULT_MAX_CANVAS_PIXELS = 2 ** 27;

interface CanvasAndContext {
  canvas: Canvas;
  context: CanvasRenderingContext2D;
}

export type ImageEncoding = 'avif' | 'jpeg' | 'png' | 'webp';

export type PageProcessor<T> = (
  content: Buffer | string,
  pageNumber: number,
  pageCount: number,
) => Promise<T> | T;

interface PdfCanvasFactory {
  create(width: number, height: number): CanvasAndContext;
  destroy(canvasAndContext: CanvasAndContext): void;
  reset(
    canvasAndContext: CanvasAndContext,
    width: number,
    height: number,
  ): void;
}

class PooledCanvasFactory implements PdfCanvasFactory {
  private readonly pool: CanvasAndContext[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  create(width: number, height: number): CanvasAndContext {
    const existing = this.pool.pop();
    if (existing) {
      this.reset(existing, width, height);
      return existing;
    }
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    return { canvas, context };
  }

  reset(
    canvasAndContext: CanvasAndContext,
    width: number,
    height: number,
  ): void {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
    // Resizing implicitly clears the canvas in @napi-rs/canvas
  }

  destroy(canvasAndContext: CanvasAndContext): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(canvasAndContext);
    }
    // Otherwise let it GC — pool is at capacity
  }
}

const extractText = (items: TextItem[]): string => {
  const parts: string[] = [];
  for (const item of items) {
    if (item.str) parts.push(item.str);
  }
  return parts.join(' ');
};

const getPageViewport = (
  page: PDFPageProxy,
  scale: number,
  maxCanvasPixels: number,
) => {
  const viewport = page.getViewport({ scale });
  const pixels = Math.ceil(viewport.width) * Math.ceil(viewport.height);

  if (pixels > maxCanvasPixels) {
    throw new Error(
      `Page ${page.pageNumber} is too large to render: ${Math.ceil(viewport.width)}x${Math.ceil(viewport.height)} pixels exceeds maxCanvasPixels (${maxCanvasPixels}).`,
    );
  }

  return viewport;
};

const processPdfPageTypeMixed = async <T>(
  page: PDFPageProxy,
  canvasFactory: PdfCanvasFactory,
  pageNumber: number,
  pageCount: number,
  scale: number,
  encoding: ImageEncoding,
  maxCanvasPixels: number,
  callback: PageProcessor<T>,
): Promise<T> => {
  const textContent = await page.getTextContent({
    includeMarkedContent: false,
  });
  const items = textContent.items as TextItem[];

  if (items.length === 0) {
    const viewport = getPageViewport(page, scale, maxCanvasPixels);

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
  maxCanvasPixels: number,
) => {
  const viewport = getPageViewport(page, scale, maxCanvasPixels);

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
  const documentInitParameters = await resolveInput(input);

  documentInitParameters.password = options?.password;

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

  const maxCanvasPixels = options?.maxCanvasPixels ?? DEFAULT_MAX_CANVAS_PIXELS;

  if (!Number.isSafeInteger(maxCanvasPixels) || maxCanvasPixels < 1) {
    throw new Error(
      `Invalid maxCanvasPixels value: ${maxCanvasPixels}. Must be a positive integer.`,
    );
  }

  // pdf.js decodes embedded images at full size before drawing them, so cap those too
  documentInitParameters.maxImageSize = maxCanvasPixels;

  return {
    concurrency,
    documentInitParameters,
    encoding,
    maxCanvasPixels,
    scale,
  };
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
  const {
    concurrency,
    documentInitParameters,
    encoding,
    maxCanvasPixels,
    scale,
  } = await validateParameters(input, options);

  const pooledFactory =
    type !== PROCESSING_TYPE.TEXT
      ? new PooledCanvasFactory(concurrency)
      : undefined;
  if (pooledFactory) {
    // @ts-expect-error - PooledCanvasFactory is structurally compatible with pdfjs BaseCanvasFactory
    documentInitParameters.canvasFactory = pooledFactory;
  }

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
          const canvasFactory =
            pooledFactory ?? (pdfDocument.canvasFactory as PdfCanvasFactory);

          const result = await processPdfPageTypeMixed(
            page,
            canvasFactory,
            pageNum,
            numPages,
            scale,
            encoding,
            maxCanvasPixels,
            callback,
          );
          results[i] = result;
          page.cleanup();
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
          page.cleanup();
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
          const canvasFactory =
            pooledFactory ?? (pdfDocument.canvasFactory as PdfCanvasFactory);
          results[i] = await processPdfPageTypeImage(
            page,
            canvasFactory,
            pageNum,
            numPages,
            scale,
            encoding,
            maxCanvasPixels,
          );
          page.cleanup();
        });
      });

      await Promise.all(pageTasks);
      return results;
    }

    throw new Error('Invalid PROCESSING_TYPE');
  } finally {
    // Clean up pdfjs resources to prevent memory leaks
    await pdfDocument.cleanup();
    await loadingTask.destroy();
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
  const { documentInitParameters, encoding, maxCanvasPixels, scale } =
    await validateParameters(input, options);

  const pooledFactory =
    type === PROCESSING_TYPE.IMAGE ? new PooledCanvasFactory(1) : undefined;
  if (pooledFactory) {
    // @ts-expect-error - PooledCanvasFactory is structurally compatible with pdfjs BaseCanvasFactory
    documentInitParameters.canvasFactory = pooledFactory;
  }

  const loadingTask = getDocument(documentInitParameters);
  const pdfDocument = await loadingTask.promise;

  try {
    const { numPages } = pdfDocument;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);

      if (type === PROCESSING_TYPE.IMAGE) {
        const canvasFactory =
          pooledFactory ?? (pdfDocument.canvasFactory as PdfCanvasFactory);
        const data = await processPdfPageTypeImage(
          page,
          canvasFactory,
          pageNum,
          numPages,
          scale,
          encoding,
          maxCanvasPixels,
        );
        yield { data, pageCount: numPages, pageNumber: pageNum };
      } else {
        const data = await processPdfPageTypeText(page);
        yield { data, pageCount: numPages, pageNumber: pageNum };
      }

      page.cleanup();
    }
  } finally {
    await pdfDocument.cleanup();
    await loadingTask.destroy();
  }
}
