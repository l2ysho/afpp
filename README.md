# afpp

![Version](https://img.shields.io/github/v/release/l2ysho/afpp)
[![codecov](https://codecov.io/github/l2ysho/afpp/graph/badge.svg?token=2PE32I4M9K)](https://codecov.io/github/l2ysho/afpp)
![Node](https://img.shields.io/badge/node-%3E%3D%2018.x-brightgreen.svg)
![npm Downloads](https://img.shields.io/npm/dt/afpp.svg)
![Repo Size](https://img.shields.io/github/repo-size/l2ysho/afpp)
![Last Commit](https://img.shields.io/github/last-commit/l2ysho/afpp.svg)

Another f\*cking pdf parser. (alpha)

## Why?

If you are parsing pdf files in nodejs and you are satisfied with your actual solution, good for you, you don't need this.

But if you’ve encountered one or more of these issues:

- package size (+30mb)
- blocking event loop
- performance issues
- buggy as shit
- not working in esm/commonjs
- old pdfjs-dist as peer dependency
- no typescript support
- parsing of encrypted pdf files (password needed)

then you might find this package useful.

## Prerequisites

- Node.js 18+

## Getting started

`npm install afpp`

**commonjs**:

```js
const { pdf2string } = require('afpp');
const path = require('node:path');

const pathToFile = path.join('example.pdf');

(async function start() {
  const pdfString = await pdf2string(pathToFile);
  console.log(pdfString);
})();
```

**esm**:

```js
import { pdf2string } from 'afpp';
import path from 'node:path';

const pathToFile = path.join('example.pdf');

(async function start() {
  const pdfString = await pdf2string(pathToFile);
  console.log(pdfString);
})();
```
