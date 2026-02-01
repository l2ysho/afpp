import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';

import { streamPdf2image, streamPdf2string } from '#afpp/src/index';

describe('streamPdf2image', () => {
  describe('input = valid path to file as string', () => {
    it('should yield all pages in order', async () => {
      const input = path.join('test', 'example.pdf');
      const pages: number[] = [];

      for await (const { data, pageCount, pageNumber } of streamPdf2image(
        input,
      )) {
        assert.equal(pageCount, 9);
        assert.ok(Buffer.isBuffer(data));
        assert.ok(data.length > 0);
        pages.push(pageNumber);
      }

      assert.deepEqual(pages, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe('input = valid path to encrypted file as string', () => {
    it('should yield all pages with correct password', async () => {
      const input = path.join('test', 'example-encrypted.pdf');
      const pages: number[] = [];

      for await (const { pageNumber } of streamPdf2image(input, {
        password: 'example',
      })) {
        pages.push(pageNumber);
      }

      assert.equal(pages.length, 9);
    });

    it('should reject without password', async () => {
      const input = path.join('test', 'example-encrypted.pdf');

      await assert.rejects(
        async () => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          for await (const _ of streamPdf2image(input)) {
            // Should not reach here
          }
        },
        {
          message: 'No password given',
          name: 'PasswordException',
        },
      );
    });
  });

  describe('input = valid pdf buffer', () => {
    it('should yield all pages from buffer', async () => {
      const pathToFile = path.join('test', 'example.pdf');
      const input = await readFile(pathToFile);
      const pages: number[] = [];

      for await (const { data, pageNumber } of streamPdf2image(input)) {
        assert.ok(Buffer.isBuffer(data));
        pages.push(pageNumber);
      }

      assert.equal(pages.length, 9);
    });
  });

  describe('input = valid Uint8Array', () => {
    it('should yield all pages from Uint8Array', async () => {
      const pathToFile = path.join('test', 'example.pdf');
      const fileBuffer = await readFile(pathToFile);
      const input = new Uint8Array(fileBuffer);
      const pages: number[] = [];

      for await (const { pageNumber } of streamPdf2image(input)) {
        pages.push(pageNumber);
      }

      assert.equal(pages.length, 9);
    });
  });

  describe('options', () => {
    it('should respect scale option', async () => {
      const input = path.join('test', 'example.pdf');
      const sizes: number[] = [];

      // Scale 1
      for await (const { data } of streamPdf2image(input, { scale: 1 })) {
        sizes.push(data.length);
        break; // Only check first page
      }

      // Scale 2 should produce larger images
      for await (const { data } of streamPdf2image(input, { scale: 2 })) {
        sizes.push(data.length);
        break;
      }

      assert.ok(sizes[1] > sizes[0], 'Scale 2 should produce larger image');
    });

    it('should respect imageEncoding option', async () => {
      const input = path.join('test', 'example.pdf');

      for await (const { data } of streamPdf2image(input, {
        imageEncoding: 'jpeg',
      })) {
        // JPEG magic bytes: 0xFF 0xD8 0xFF
        assert.equal(data[0], 0xff);
        assert.equal(data[1], 0xd8);
        break;
      }

      for await (const { data } of streamPdf2image(input, {
        imageEncoding: 'png',
      })) {
        // PNG magic bytes: 0x89 0x50 0x4E 0x47
        assert.equal(data[0], 0x89);
        assert.equal(data[1], 0x50);
        break;
      }
    });
  });

  describe('early termination', () => {
    it('should allow breaking out of loop early', async () => {
      const input = path.join('test', 'example.pdf');
      const pages: number[] = [];

      for await (const { pageNumber } of streamPdf2image(input)) {
        pages.push(pageNumber);
        if (pageNumber === 3) break;
      }

      assert.deepEqual(pages, [1, 2, 3]);
    });
  });
});

describe('streamPdf2string', () => {
  describe('input = valid path to file as string', () => {
    it('should yield all pages in order', async () => {
      const input = path.join('test', 'example.pdf');
      const pages: number[] = [];

      for await (const { data, pageCount, pageNumber } of streamPdf2string(
        input,
      )) {
        assert.equal(pageCount, 9);
        assert.equal(typeof data, 'string');
        pages.push(pageNumber);
      }

      assert.deepEqual(pages, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should yield non-empty text for text pages', async () => {
      const input = path.join('test', 'example.pdf');
      let hasText = false;

      for await (const { data } of streamPdf2string(input)) {
        if (data.length > 0) {
          hasText = true;
          break;
        }
      }

      assert.ok(hasText, 'Should have at least one page with text');
    });
  });

  describe('input = valid pdf buffer', () => {
    it('should yield all pages from buffer', async () => {
      const pathToFile = path.join('test', 'example.pdf');
      const input = await readFile(pathToFile);
      const pages: number[] = [];

      for await (const { pageNumber } of streamPdf2string(input)) {
        pages.push(pageNumber);
      }

      assert.equal(pages.length, 9);
    });
  });

  describe('input = valid Uint8Array', () => {
    it('should yield all pages from Uint8Array', async () => {
      const pathToFile = path.join('test', 'example.pdf');
      const fileBuffer = await readFile(pathToFile);
      const input = new Uint8Array(fileBuffer);
      const pages: number[] = [];

      for await (const { pageNumber } of streamPdf2string(input)) {
        pages.push(pageNumber);
      }

      assert.equal(pages.length, 9);
    });
  });

  describe('early termination', () => {
    it('should allow breaking out of loop early', async () => {
      const input = path.join('test', 'example.pdf');
      const pages: number[] = [];

      for await (const { pageNumber } of streamPdf2string(input)) {
        pages.push(pageNumber);
        if (pageNumber === 2) break;
      }

      assert.deepEqual(pages, [1, 2]);
    });
  });
});
