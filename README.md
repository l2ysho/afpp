# afpp

Another f*cking pdf parser. (alpha)

## todo

- [x] pdf2string
- [ ] pdf2img
  
## Why?

If you are parsing pdf files in nodejs and you are satisfied with your actual solution, good for you, you don't need this.

But if you’ve encountered one or more of these issues:

- package size (+30mb)
- blocking event loop
- performance issues
- buggy as shit
- not working in esm/commonjs
- old pdfjs-dist as peer dependency

then you might find this package useful.

## Prerequisites

- Node.js 18+

## Getting started

`npm install afpp`

**commonjs**:

```js
const { pdf2string } = require("afpp");
const path = require("node:path");

const pathToFile = path.join("example.pdf");

(async function start() {
  const pdfString = await pdf2string(pathToFile);
  console.log(pdfString);
})();
```

**esm**:

```js
import { pdf2string } from "afpp";
import path from "node:path";

const pathToFile = path.join("example.pdf");

(async function start() {
  const pdfString = await pdf2string(pathToFile);
  console.log(pdfString);
})();
```
