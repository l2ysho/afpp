# afpp

![Version](https://img.shields.io/github/v/release/l2ysho/afpp)
[![codecov](https://codecov.io/github/l2ysho/afpp/graph/badge.svg?token=2PE32I4M9K)](https://codecov.io/github/l2ysho/afpp)
![Node](https://img.shields.io/badge/node-%3E%3D%2022.14.0-brightgreen.svg)
![npm Downloads](https://img.shields.io/npm/dt/afpp.svg)
![Repo Size](https://img.shields.io/github/repo-size/l2ysho/afpp)
![Last Commit](https://img.shields.io/github/last-commit/l2ysho/afpp.svg)

> **afpp** — A modern, dependency-light PDF parser for Node.js.
>
> Built for performance, reliability, and developer sanity.

---

## Overview

`afpp` (Another PDF Parser, Properly) is a Node.js library for extracting text and images from PDF files without heavyweight native dependencies, event-loop blocking, or fragile runtime assumptions.

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

- Zero native build dependencies
- Fully asynchronous, non-blocking architecture
- First-class TypeScript support
- Supports local files, buffers, and remote URLs
- Handles encrypted PDFs
- Configurable concurrency and rendering scale
- Minimal and auditable dependency graph

---

## Requirements

- **Node.js** >= 22.14.0

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
- `URL`

### Extract Text from a PDF

```ts
import { readFile } from 'fs/promises';
import path from 'path';
import { pdf2string } from 'afpp';

(async () => {
  const filePath = path.join('..', 'test', 'example.pdf');
  const buffer = await readFile(filePath);

  const pages = await pdf2string(buffer);
  console.log(pages); // ['Page 1 text', 'Page 2 text', ...]
})();
```

---

### Render PDF Pages as Images

```ts
import { pdf2image } from 'afpp';

(async () => {
  const url = new URL('https://pdfobject.com/pdf/sample.pdf');
  const images = await pdf2image(url);

  console.log(images); // [Buffer, Buffer, ...]
})();
```

---

### Low-Level Parsing API

For advanced use cases, `parsePdf` exposes page-level control and transformation.

```ts
import { parsePdf } from 'afpp';

(async () => {
  const response = await fetch('https://pdfobject.com/pdf/sample.pdf');
  const buffer = Buffer.from(await response.arrayBuffer());

  const result = await parsePdf(buffer, {}, (pageContent) => pageContent);
  console.log(result);
})();
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

| Option          | Type                                  | Default | Description                           |
| --------------- | ------------------------------------- | ------- | ------------------------------------- |
| `concurrency`   | `number`                              | `1`     | Number of pages processed in parallel |
| `imageEncoding` | `'png' \| 'jpeg' \| 'webp' \| 'avif'` | `'png'` | Output format for rendered images     |
| `password`      | `string`                              | —       | Password for encrypted PDFs           |
| `scale`         | `number`                              | `1`     | Rendering scale for non-text pages    |

---

## Design Principles

- **Node-first**: No browser globals or DOM assumptions
- **Explicit over implicit**: No magic configuration
- **Fail fast**: Clear errors instead of silent corruption
- **Production-oriented**: Optimized for long-running processes

---

## License

MIT © Richard Solár
