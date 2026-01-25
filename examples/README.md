# AFPP Examples

This folder contains comprehensive examples demonstrating all features and options of the AFPP library.

## Prerequisites

Before running the examples, make sure to build the library:

```bash
npm run build
```

## Running Examples

Run any example from the repository root:

```bash
npx tsx examples/01-basic-text-extraction.ts
```

## Examples Overview

| Example                                                        | Description                                               |
| -------------------------------------------------------------- | --------------------------------------------------------- |
| [01-basic-text-extraction.ts](./01-basic-text-extraction.ts)   | Simple text extraction using `pdf2string`                 |
| [02-input-types.ts](./02-input-types.ts)                       | Different input types: file path, Buffer, Uint8Array, URL |
| [03-encrypted-pdf.ts](./03-encrypted-pdf.ts)                   | Handling password-protected PDFs                          |
| [04-basic-image-rendering.ts](./04-basic-image-rendering.ts)   | Rendering PDF pages as images using `pdf2image`           |
| [05-image-encoding-formats.ts](./05-image-encoding-formats.ts) | Image formats: PNG, JPEG, WebP, AVIF                      |
| [06-concurrency.ts](./06-concurrency.ts)                       | Parallel processing with the `concurrency` option         |
| [07-scale-options.ts](./07-scale-options.ts)                   | Image resolution control with the `scale` option          |
| [08-parse-pdf-callback.ts](./08-parse-pdf-callback.ts)         | Advanced usage with `parsePdf` and custom callbacks       |
| [09-error-handling.ts](./09-error-handling.ts)                 | Error handling patterns and edge cases                    |
| [10-all-options-combined.ts](./10-all-options-combined.ts)     | Production configurations combining all options           |

## API Reference

### Functions

#### `pdf2string(input, options?): Promise<string[]>`

Extracts text content from all pages of a PDF.

```typescript
const pages = await pdf2string('document.pdf');
```

#### `pdf2image(input, options?): Promise<Buffer[]>`

Renders all PDF pages as images.

```typescript
const images = await pdf2image('document.pdf');
```

#### `parsePdf<T>(input, options, callback): Promise<T[]>`

Low-level API for custom page-by-page processing.

```typescript
const results = await parsePdf(
  'document.pdf',
  {},
  (content, pageNum, pageCount) => {
    return typeof content === 'string' ? content.length : content.byteLength;
  },
);
```

### Input Types

All functions accept the following input types:

- `string` - Local file path
- `Buffer` - Node.js Buffer containing PDF data
- `Uint8Array` - Typed array with PDF bytes
- `URL` - Remote PDF URL

### Options

| Option          | Type                                  | Default | Description                            |
| --------------- | ------------------------------------- | ------- | -------------------------------------- |
| `password`      | `string`                              | -       | Password for encrypted PDFs            |
| `concurrency`   | `number`                              | `1`     | Number of pages processed in parallel  |
| `scale`         | `number`                              | `1`     | Image rendering resolution (1.0 - 4.0) |
| `imageEncoding` | `'png' \| 'jpeg' \| 'webp' \| 'avif'` | `'png'` | Output image format                    |

## Output Directory

Examples that generate files (images, etc.) save them to the `examples/output/` directory. This directory is automatically created when running examples and is excluded from git.

## Test PDFs

The examples use test PDFs from the `test/` folder:

- `example.pdf` - Standard text-based PDF (9 pages)
- `example-encrypted.pdf` - Password-protected PDF (password: `example`)
- `example-img.pdf` - Image-heavy PDF (9 pages)
