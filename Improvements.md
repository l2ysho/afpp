# Performance Improvements for pdf2image

This document outlines optimization opportunities for the `pdf2image` method with code examples.

## 1. Auto-tune Concurrency (3-4x improvement)

Currently, the default concurrency is `1`, meaning pages are processed sequentially. Auto-detecting based on CPU cores can provide significant speedup.

### Current Implementation

```typescript
const concurrency = options?.concurrency ?? 1;
```

### Proposed Implementation

```typescript
import { cpus } from 'node:os';

const getOptimalConcurrency = (): number => {
  const cpuCount = cpus().length;
  // Leave one core free for system operations
  return Math.max(1, cpuCount - 1);
};

const concurrency = options?.concurrency ?? getOptimalConcurrency();
```

### Usage

```typescript
// Automatic optimal concurrency (new default)
const images = await pdf2image(pdfPath);

// User can still override if needed
const images = await pdf2image(pdfPath, { concurrency: 4 });
```

---

## 2. Canvas Pooling (15-20% improvement)

Currently, a new canvas is created and destroyed for every page. Reusing canvas instances reduces allocation overhead.

### Current Implementation

```typescript
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

  await page.render({
    canvas: canvasAndContext.canvas,
    canvasContext: canvasAndContext.context,
    viewport,
  }).promise;

  const imageBuffer = await canvasAndContext.canvas.encode(encoding);
  canvasFactory.destroy(canvasAndContext);
  return imageBuffer;
};
```

### Proposed Implementation

```typescript
class CanvasPool {
  private pool: CanvasAndContext[] = [];
  private canvasFactory: PdfCanvasFactory;

  constructor(canvasFactory: PdfCanvasFactory) {
    this.canvasFactory = canvasFactory;
  }

  acquire(width: number, height: number): CanvasAndContext {
    const existing = this.pool.pop();
    if (existing) {
      this.canvasFactory.reset(existing, width, height);
      return existing;
    }
    return this.canvasFactory.create(width, height);
  }

  release(canvasAndContext: CanvasAndContext): void {
    this.pool.push(canvasAndContext);
  }

  destroy(): void {
    for (const canvas of this.pool) {
      this.canvasFactory.destroy(canvas);
    }
    this.pool = [];
  }
}

const processPdfPageTypeImage = async (
  page: PDFPageProxy,
  canvasPool: CanvasPool,
  pageNumber: number,
  pageCount: number,
  scale: number,
  encoding: ImageEncoding,
) => {
  const viewport = page.getViewport({ scale });
  const canvasAndContext = canvasPool.acquire(viewport.width, viewport.height);

  await page.render({
    canvas: canvasAndContext.canvas,
    canvasContext: canvasAndContext.context,
    viewport,
  }).promise;

  const imageBuffer = await canvasAndContext.canvas.encode(encoding);
  canvasPool.release(canvasAndContext);
  return imageBuffer;
};
```

### Usage in parsePdfFile

```typescript
if (type === PROCESSING_TYPE.IMAGE) {
  const canvasFactory = pdfDocument.canvasFactory as PdfCanvasFactory;
  const canvasPool = new CanvasPool(canvasFactory);

  const results: Buffer[] = new Array(numPages);
  const pageTasks = Array.from({ length: numPages }, (_, i) => {
    const pageNum = i + 1;
    return limit(async () => {
      const page = await pdfDocument.getPage(pageNum);
      results[i] = await processPdfPageTypeImage(
        page,
        canvasPool,
        pageNum,
        numPages,
        scale,
        encoding,
      );
    });
  });

  await Promise.all(pageTasks);
  canvasPool.destroy();
  return results;
}
```

---

## 3. Use JPEG as Default Encoding (Faster encoding)

PNG encoding is slower than JPEG. Changing the default to JPEG with reasonable quality provides faster encoding.

### Current Implementation

```typescript
const encoding = options?.imageEncoding ?? 'png';
```

### Proposed Implementation

```typescript
export interface AfppParseOptions {
  // ... existing options

  /**
   * Image encoding format when rendering pages. Defaults to 'jpeg'.
   * Supported formats: 'avif', 'jpeg', 'png', 'webp'.
   * @default 'jpeg'
   */
  imageEncoding?: ImageEncoding;

  /**
   * Quality for lossy image formats (jpeg, webp, avif). Range: 1-100.
   * Higher values mean better quality but larger file size.
   * @default 85
   */
  imageQuality?: number;
}

const encoding = options?.imageEncoding ?? 'jpeg';
const quality = options?.imageQuality ?? 85;

// In processPdfPageTypeImage:
const imageBuffer = await canvasAndContext.canvas.encode(encoding, quality);
```

### Usage

```typescript
// Fast JPEG output (new default)
const images = await pdf2image(pdfPath);

// High-quality PNG when needed
const images = await pdf2image(pdfPath, {
  imageEncoding: 'png',
});

// Compressed JPEG for smaller files
const images = await pdf2image(pdfPath, {
  imageEncoding: 'jpeg',
  imageQuality: 70,
});

// WebP for best compression
const images = await pdf2image(pdfPath, {
  imageEncoding: 'webp',
  imageQuality: 80,
});
```

---

## 4. Reduce Default Scale (Faster rendering) - IMPLEMENTED

Higher scale means larger canvas and more pixels to render. Reducing the default scale improves performance.

### Implementation

The default scale has been changed from `2.0` to `1`:

```typescript
/**
 * Scale of a page when rendering to image. Defaults to 1.
 * - 0.5: Fast, suitable for thumbnails (~36 DPI)
 * - 1: Default, good for screen display (~72 DPI)
 * - 2: High quality, good for printing (~144 DPI)
 * - 3+: Very high quality, large files
 * @default 1
 */
scale?: number;

const scale = options?.scale ?? 1;
```

### Usage

```typescript
// Default quality/speed
const images = await pdf2image(pdfPath);

// Fast thumbnails
const thumbnails = await pdf2image(pdfPath, { scale: 0.5 });

// High quality for printing
const printImages = await pdf2image(pdfPath, { scale: 3 });
```

---

## 5. Stream Processing (Memory optimization)

For large PDFs, holding all images in memory can be problematic. A streaming API allows processing pages as they become available.

### Current Implementation

```typescript
export const pdf2image = async (
  input: Buffer | string | Uint8Array | URL,
  options?: AfppParseOptions,
): Promise<Buffer[]> => parsePdfFile(PROCESSING_TYPE.IMAGE, input, options);
```

### Proposed Implementation

```typescript
export interface Pdf2ImageStreamOptions extends AfppParseOptions {
  /**
   * Callback invoked when a page is rendered.
   * Allows processing/saving pages immediately without holding all in memory.
   */
  onPage?: (
    image: Buffer,
    pageNumber: number,
    totalPages: number,
  ) => void | Promise<void>;
}

export async function* pdf2imageStream(
  input: Buffer | string | Uint8Array | URL,
  options?: AfppParseOptions,
): AsyncGenerator<{ image: Buffer; pageNumber: number; totalPages: number }> {
  const { concurrency, documentInitParameters, encoding, scale } =
    await validateParameters(input, options);

  const loadingTask = getDocument(documentInitParameters);
  const pdfDocument = await loadingTask.promise;
  const { numPages } = pdfDocument;
  const canvasFactory = pdfDocument.canvasFactory as PdfCanvasFactory;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const image = await processPdfPageTypeImage(
      page,
      canvasFactory,
      pageNum,
      numPages,
      scale,
      encoding,
    );

    yield { image, pageNumber: pageNum, totalPages: numPages };
  }

  await pdfDocument.destroy();
}

// Alternative: callback-based for parallel processing
export const pdf2imageWithCallback = async (
  input: Buffer | string | Uint8Array | URL,
  options: Pdf2ImageStreamOptions,
): Promise<void> => {
  const { concurrency, documentInitParameters, encoding, scale } =
    await validateParameters(input, options);

  const limit = pLimit(concurrency);
  const loadingTask = getDocument(documentInitParameters);
  const pdfDocument = await loadingTask.promise;
  const { numPages } = pdfDocument;
  const canvasFactory = pdfDocument.canvasFactory as PdfCanvasFactory;

  const pageTasks = Array.from({ length: numPages }, (_, i) => {
    const pageNum = i + 1;
    return limit(async () => {
      const page = await pdfDocument.getPage(pageNum);
      const image = await processPdfPageTypeImage(
        page,
        canvasFactory,
        pageNum,
        numPages,
        scale,
        encoding,
      );

      if (options.onPage) {
        await options.onPage(image, pageNum, numPages);
      }
    });
  });

  await Promise.all(pageTasks);
  await pdfDocument.destroy();
};
```

### Usage

```typescript
import { writeFile } from 'node:fs/promises';

// AsyncGenerator - sequential, memory efficient
for await (const { image, pageNumber, totalPages } of pdf2imageStream(
  pdfPath,
)) {
  await writeFile(`page-${pageNumber}.jpg`, image);
  console.log(`Processed ${pageNumber}/${totalPages}`);
}

// Callback-based - parallel processing with immediate output
await pdf2imageWithCallback(pdfPath, {
  concurrency: 4,
  onPage: async (image, pageNumber, totalPages) => {
    await writeFile(`page-${pageNumber}.jpg`, image);
    console.log(`Saved page ${pageNumber}/${totalPages}`);
  },
});

// Progress tracking
let processed = 0;
await pdf2imageWithCallback(largePdf, {
  onPage: (image, pageNumber, totalPages) => {
    processed++;
    const percent = Math.round((processed / totalPages) * 100);
    console.log(`Progress: ${percent}%`);
  },
});
```

---

## Summary

| Improvement           | Impact         | Complexity | Breaking Change      | Status      |
| --------------------- | -------------- | ---------- | -------------------- | ----------- |
| Auto-tune Concurrency | 3-4x speedup   | Low        | No (better default)  | Pending     |
| Canvas Pooling        | 15-20% speedup | Medium     | No                   | Pending     |
| JPEG Default          | 20-30% speedup | Low        | Yes (output format)  | Pending     |
| Reduce Scale          | 30-50% speedup | Low        | Yes (output quality) | Implemented |
| Stream Processing     | Memory savings | Medium     | No (new API)         | Pending     |

### Recommended Implementation Order

1. **Auto-tune Concurrency** - Biggest impact, no breaking changes
2. **Canvas Pooling** - Good improvement, internal change only
3. **Add imageQuality option** - New feature, no breaking change
4. **Stream Processing API** - New feature for large PDFs
5. **Consider JPEG/scale defaults** - Breaking changes, major version bump
