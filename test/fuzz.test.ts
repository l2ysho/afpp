import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';

import fc from 'fast-check';

import { pdf2string } from '#afpp/src/index.js';

const parseOrReject = async (bytes: Uint8Array) => {
  try {
    await pdf2string(bytes);
  } catch (error) {
    assert.ok(error instanceof Error);
  }
};

describe('pdf2string fuzz', () => {
  it(
    'resolves or rejects with an Error on arbitrary bytes',
    { timeout: 60_000 },
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.uint8Array({ maxLength: 4096 }), parseOrReject),
        { numRuns: 100 },
      );
    },
  );

  it(
    'resolves or rejects with an Error on a corrupted valid pdf',
    { timeout: 60_000 },
    async () => {
      const pdf = await readFile(path.join(import.meta.dirname, 'example.pdf'));

      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              offset: fc.nat({ max: pdf.length - 1 }),
              value: fc.integer({ min: 0, max: 255 }),
            }),
            { minLength: 1, maxLength: 32 },
          ),
          async (patches) => {
            const bytes = new Uint8Array(pdf);
            for (const { offset, value } of patches) bytes[offset] = value;
            await parseOrReject(bytes);
          },
        ),
        { numRuns: 50 },
      );
    },
  );
});
