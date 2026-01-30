/* eslint-disable no-console */

import { rmSync } from 'node:fs';
import { join } from 'node:path';

const dirs = ['afpp/output', 'pdf2pic/output', 'pdf-parse/output'];

for (const dir of dirs) {
  rmSync(join(__dirname, dir), { force: true, recursive: true });
}

console.log('Benchmark output cleaned.');
