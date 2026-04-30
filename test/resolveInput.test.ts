import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';

import { resolveInput } from '#afpp/src/resolveInput';

describe('resolveInput', () => {
  describe('invalid input', () => {
    it('should throw for undefined', async () => {
      await assert.rejects(
        // @ts-expect-error testing invalid input
        resolveInput(undefined),
        { message: 'Invalid source type: undefined', name: 'Error' },
      );
    });
  });

  describe('string path', () => {
    it('should read file and return data as Uint8Array', async () => {
      const input = path.join('test', 'example.pdf');
      const params = await resolveInput(input);
      assert.ok(params.data instanceof Uint8Array);
      assert.ok(params.data.length > 0);
    });
  });

  describe('Buffer', () => {
    it('should convert Buffer to Uint8Array in data', async () => {
      const buf = await readFile(path.join('test', 'example.pdf'));
      const params = await resolveInput(buf);
      assert.ok(params.data instanceof Uint8Array);
      assert.deepStrictEqual(params.data, new Uint8Array(buf));
    });
  });

  describe('Uint8Array', () => {
    it('should pass Uint8Array through as data', async () => {
      const buf = await readFile(path.join('test', 'example.pdf'));
      const input = new Uint8Array(buf);
      const params = await resolveInput(input);
      assert.strictEqual(params.data, input);
    });
  });

  describe('URL', () => {
    it('should set url field and not disable streaming flags', async () => {
      const url = new URL('https://pdfobject.com/pdf/sample.pdf');
      const params = await resolveInput(url);
      assert.strictEqual(params.url, url);
      assert.strictEqual(params.data, undefined);
      assert.strictEqual(params.disableAutoFetch, undefined);
      assert.strictEqual(params.disableStream, undefined);
      assert.strictEqual(params.disableRange, undefined);
    });
  });

  describe('pdfjs flags', () => {
    it('should set performance flags on all input types', async () => {
      const input = path.join('test', 'example.pdf');
      const params = await resolveInput(input);
      assert.strictEqual(params.disableAutoFetch, true);
      assert.strictEqual(params.disableStream, true);
      assert.strictEqual(params.disableRange, true);
    });
  });
});
