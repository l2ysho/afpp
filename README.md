# afpp

![Version](https://img.shields.io/github/v/release/l2ysho/afpp)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/l2ysho/afpp/release.yml)
[![codecov](https://codecov.io/github/l2ysho/afpp/graph/badge.svg?token=2PE32I4M9K)](https://codecov.io/github/l2ysho/afpp)
![Node](https://img.shields.io/badge/node-%3E%3D%2018.x-brightgreen.svg)
![npm Downloads](https://img.shields.io/npm/dt/afpp.svg)
![Repo Size](https://img.shields.io/github/repo-size/l2ysho/afpp)
![Last Commit](https://img.shields.io/github/last-commit/l2ysho/afpp.svg)

Another f\*cking pdf parser. Because parse pdf in node.js should be easy. Live long and parse pdf. 🖖

## Why?

There are plenty of PDF-related packages for Node.js. They work… until they don’t.

Afpp was built to solve the headaches I ran into while trying to parse PDFs in Node.js:

- 📦 Do I need a package with 30+ MB just to read a PDF?
- 🧵 Why is the event loop blocked?
- 🐏 Is that a memory leak I smell?
- 🐌 Should reading a PDF really be this performance-heavy?
- 🐞 Why is everything so buggy?
- 🎨 Why does it crash because there’s no canvas in Node.js?
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

Lets get the text from the pdf. You can use various sources.

```js
const { pdf2string } = require('afpp');
const path = require('node:path');

(async function main() {
  const pathToFile = path.join('example1.pdf');

  const pdfString = await pdf2string(pathToFile);

  console.log(pdfString);
})();
```
