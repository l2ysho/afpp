# afpp

![Version](https://img.shields.io/github/v/release/l2ysho/afpp)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/l2ysho/afpp/release.yml)
[![codecov](https://codecov.io/github/l2ysho/afpp/graph/badge.svg?token=2PE32I4M9K)](https://codecov.io/github/l2ysho/afpp)
![Node](https://img.shields.io/badge/node-%3E%3D%2022.14-brightgreen.svg)
![npm Downloads](https://img.shields.io/npm/dt/afpp.svg)
![Repo Size](https://img.shields.io/github/repo-size/l2ysho/afpp)
![Last Commit](https://img.shields.io/github/last-commit/l2ysho/afpp.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

Another f\*cking PDF parser. Because parsing PDFs in Node.js should be easy. Live long and parse PDFs. 🖖

## Why?

There are plenty of PDF-related packages for Node.js. They work… until they don’t.

Afpp was built to solve the headaches I ran into while trying to parse PDFs in Node.js:

- 📦 Do I need a package with 30+ MB just to read a PDF?
- 🧵 Why is the event loop blocked?
- 🐏 Is that a memory leak I smell?
- 🐌 Should reading a PDF really be this performance-heavy?
- 🐞 Why is everything so buggy?
- 🎨 Why does it complain about the lack of a canvas in Node.js?
- 🧱 Why does canvas require native C++/Python dependencies to build?
- 🪟 Why does it complain about the missing window object?
- 🪄 Why do I need ImageMagick for this?!
- 👻 What the hell is Ghostscript, and why does it keep failing?
- ❌ Where’s the TypeScript support?
- 🧓 Why are the dependencies older than my dev career?
- 🔐 Why does everything work… until I try an encrypted PDF?
- 🕯️ Why does every OS need its own special setup ritual?

## Prerequisites

- Node.js >= v22.14.0

## 📦 Installation

You can install `afpp` via npm, Yarn, or pnpm.

### npm

```bash
npm install afpp
```

### Yarn

```bash
yarn add afpp
```

### pnpm

```bash
pnpm add afpp
```

## Getting started

The `afpp` library makes it simple to extract text or images from PDF files in Node.js. Whether your PDF is stored locally, hosted online, or encrypted, `afpp` provides an easy-to-use API to handle it all. All functions have common parameters and accepts string path, buffer, or URL object.

### Get text from path

```ts
import { readFile } from 'fs/promises';
import path from 'path';

import { pdf2string } from 'afpp';

(async function main() {
  const pathToFile = path.join('..', 'test', 'example.pdf');
  const input = await readFile(pathToFile);
  const data = await pdf2string(input);

  console.log('Extracted text:', data); // ['page 1 content', 'page 2 content', ...]
})();
```

### Get image from URL

```ts
import { pdf2image } from 'afpp';

(async function main() {
  const url = new URL('https://pdfobject.com/pdf/sample.pdf');
  const arrayOfImages = await pdf2image(url);

  console.log(arrayOfImages); // [imageBuffer, imageBuffer, ...]
})();
```

### Parse pdf buffer

```ts
import { parsePdf } from 'afpp';

(async function main() {
  // Download PDF from URL
  const response = await fetch('https://pdfobject.com/pdf/sample.pdf');
  const buffer = Buffer.from(await response.arrayBuffer());

  // Parse the PDF buffer
  const result = await parsePdf(buffer, {}, (content) => content);
  console.log('Parsed PDF:', result);
})();
```

## Interface: AfppParseOptions

Common properties of all afpp functions.
Example usage

```javascript
const result = await parsePdf(buffer, {
  concurrency: 5,
  imageEncoding: 'jpeg',
  password: 'STRONG_PASS',
  scale: 4,
});
```

## Properties

### concurrency?

> `optional` **concurrency**: `number`

Concurrency level for page processing. Defaults to 1.
Higher values may improve performance but increase memory usage.

#### Default

```ts
1;
```

---

### imageEncoding?

> `optional` **imageEncoding**: [`ImageEncoding`](../type-aliases/ImageEncoding.md)

Image encoding format when rendering non-text pages. Defaults to 'png'.
Supported formats: 'avif', 'jpeg', 'png', 'webp'.

#### Default

```ts
'png';
```

---

### password?

> `optional` **password**: `string`

Password for encrypted pdf files.

---

### scale?

> `optional` **scale**: `number`

Scale of a page if content is not text (or pdf2image is used). Defaults to 2.0.
Higher values increase image resolution but also memory usage.

#### Default

```ts
2.0;
```

## License

This project is licensed under the terms of the [MIT License](./LICENSE).
