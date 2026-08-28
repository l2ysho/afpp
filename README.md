# afpp

![Version](https://img.shields.io/github/v/release/l2ysho/afpp)
[![codecov](https://codecov.io/github/l2ysho/afpp/graph/badge.svg?token=2PE32I4M9K)](https://codecov.io/github/l2ysho/afpp)
[![Mutation score](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fl2ysho%2Fafpp%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/l2ysho/afpp/main)
![Node](https://img.shields.io/badge/node-%3E%3D%2022.14.0-brightgreen.svg)
![npm Downloads](https://img.shields.io/npm/dt/afpp.svg)
![Repo Size](https://img.shields.io/github/repo-size/l2ysho/afpp)
![Last Commit](https://img.shields.io/github/last-commit/l2ysho/afpp.svg)

> **afpp** — A modern, dependency-light PDF parser for Node.js.
>
> Built for performance, reliability, and developer sanity.

---

## Overview

`afpp` (Another PDF Parser, Properly) is a Node.js library for extracting text and images from PDF files without manual native build steps, event-loop blocking, or fragile runtime assumptions.

The project was created to address recurring problems encountered with existing PDF tooling in the Node.js ecosystem:

- Excessive bundle sizes and transitive dependencies
- Native build steps (canvas, ImageMagick, Ghostscript)
- Browser-specific assumptions (`window`, DOM, canvas)
- Poor TypeScript support
- Unreliable handling of encrypted PDFs
- Performance and memory inefficiencies

`afpp` focuses on **predictable behavior**, **explicit APIs**, and **production-ready defaults**.

---

## Key Features

- No manual build step required for text extraction; image rendering requires the optional peer dep `@napi-rs/canvas` (prebuilt native binaries, no compile step)
- Fully asynchronous, non-blocking architecture
- First-class TypeScript support
- Supports local files, buffers, and remote URLs
- Handles encrypted PDFs
- Configurable concurrency and rendering scale
- Minimal and auditable dependency graph

---

## Requirements

- **Node.js** >= 22.14.0

> **v3 breaking change:** `afpp` is now ESM-only. Replace any `require('afpp')` calls with `import ... from 'afpp'`.

---

## Installation

Install using your preferred package manager:

```bash
npm install afpp
# or
yarn add afpp
# or
pnpm add afpp
```

---

## Quick Start

All parsing functions accept the same input types:

- `string` (file path)
- `Buffer`
- `Uint8Array`
- `URL`

### Extract Text from a PDF

```ts
import { pdf2string } from 'afpp';

const pages = await pdf2string('./document.pdf');
console.log(pages); // ['Page 1 text', 'Page 2 text', ...]
```

---

### Render PDF Pages as Images

```ts
import { pdf2image } from 'afpp';

const url = new URL('https://pdfobject.com/pdf/sample.pdf');
const images = await pdf2image(url);

console.log(images); // [Buffer, Buffer, ...]
```

---

### Streaming API (Large PDFs)

For large PDFs, use streaming functions to process pages incrementally without loading all results into memory:

```ts
import { writeFile } from 'fs/promises';

import { streamPdf2image, streamPdf2string } from 'afpp';

// Stream images - process each page as it's rendered
for await (const { pageNumber, pageCount, data } of streamPdf2image(
  './large.pdf',
)) {
  await writeFile(`page-${pageNumber}.png`, data);
  console.log(`Processed ${pageNumber}/${pageCount}`);
}

// Stream text - process each page as it's extracted
for await (const { pageNumber, data } of streamPdf2string('./large.pdf')) {
  console.log(`Page ${pageNumber}: ${data.substring(0, 100)}...`);
}
```

**Benefits:**

- Lower peak memory usage
- Faster time-to-first-result
- Built-in progress tracking via `pageNumber` and `pageCount`

---

### Extract PDF Metadata

```ts
import { getPdfMetadata } from 'afpp';

const metadata = await getPdfMetadata('./document.pdf');
console.log(metadata.pageCount); // e.g. 9
console.log(metadata.isEncrypted); // false
console.log(metadata.title); // 'My Document' or undefined
console.log(metadata.creationDate); // Date object or undefined

// Encrypted PDF
const meta = await getPdfMetadata('./secure.pdf', { password: 'secret' });
console.log(meta.isEncrypted); // true
```

---

### Low-Level Parsing API

For advanced use cases, `parsePdf` exposes page-level control and transformation.

```ts
import { parsePdf } from 'afpp';

const response = await fetch('https://pdfobject.com/pdf/sample.pdf');
const buffer = Buffer.from(await response.arrayBuffer());

const result = await parsePdf(buffer, {}, (pageContent) => pageContent);
console.log(result);
```

---

## Configuration

All public APIs accept a shared options object.

```ts
const result = await parsePdf(buffer, {
  concurrency: 5,
  imageEncoding: 'jpeg',
  password: 'STRONG_PASS',
  scale: 4,
});
```

### AfppParseOptions

| Option          | Type                                  | Default | Description                                                                        |
| --------------- | ------------------------------------- | ------- | ---------------------------------------------------------------------------------- |
| `concurrency`   | `number \| 'auto'`                    | `1`     | Number of pages processed in parallel. Use `'auto'` for CPU-based scaling.         |
| `imageEncoding` | `'png' \| 'jpeg' \| 'webp' \| 'avif'` | `'png'` | Output format for rendered images                                                  |
| `password`      | `string`                              | —       | Password for encrypted PDFs                                                        |
| `scale`         | `number`                              | `1.0`   | Rendering scale. Valid range: 0.1–10. (1.0 = 72 DPI, 2.0 = 144 DPI, 3.0 = 216 DPI) |

### PdfMetadata

Returned by `getPdfMetadata`. All fields except `pageCount` and `isEncrypted` are optional — absent metadata fields are `undefined`, never empty strings.

| Field              | Type      | Description                                      |
| ------------------ | --------- | ------------------------------------------------ |
| `pageCount`        | `number`  | Total number of pages                            |
| `isEncrypted`      | `boolean` | Whether the document required a password to open |
| `title`            | `string?` | Document title                                   |
| `author`           | `string?` | Document author                                  |
| `subject`          | `string?` | Document subject                                 |
| `creator`          | `string?` | Application that created the document            |
| `producer`         | `string?` | PDF producer application                         |
| `creationDate`     | `Date?`   | Document creation date                           |
| `modificationDate` | `Date?`   | Document last modification date                  |

---

## Design Principles

- **Node-first**: No browser globals or DOM assumptions
- **Explicit over implicit**: No magic configuration
- **Fail fast**: Clear errors instead of silent corruption
- **Production-oriented**: Optimized for long-running processes

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and pull request guidelines.

---

## License

MIT © Richard Solár
