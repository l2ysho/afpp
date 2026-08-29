import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

import { parsePdf } from '#afpp/src/index.js';

describe('parsePdf', () => {
  describe('input != string, buffer, Uint8Array or URL  ', () => {
    it('promise should be rejected with specific error', async () => {
      await assert.rejects(
        // @ts-expect-error It should throw error because input is required
        parsePdf(undefined, {}, (content) => content),
        {
          message: 'Invalid source type: undefined',
          name: 'Error',
        },
      );
    });
  });

  describe('input = valid path to file as string', () => {
    it('should return valid string parsed from pdf', async () => {
      const input = path.join('test', 'example.pdf');
      const data = await parsePdf(input, { scale: 2 }, (content) => content);
      assert.equal(data.length, 9);
    });
  });

  describe('input = valid path to encrypted file as string', () => {
    it('should return valid string parsed from pdf', async () => {
      const input = path.join('test', 'example-encrypted.pdf');
      await assert.rejects(
        parsePdf(input, { scale: 2 }, (content) => content),
        {
          message: 'No password given',
          name: 'PasswordException',
        },
      );
    });
  });

  describe('input = valid pdf buffer', () => {
    it('should return valid string parsed from pdf', async () => {
      const pathToFile = path.join('test', 'example.pdf');
      const input = await readFile(pathToFile, {});
      const data = await parsePdf<Buffer | string>(
        input,
        { scale: 2 },
        (content) => content,
      );
      assert.equal(data.length, 9);
    });
  });

  describe('input = valid Uint8Array', () => {
    it('should return valid string parsed from pdf', async () => {
      const pathToFile = path.join('test', 'example.pdf');
      const fileBuffer = await readFile(pathToFile, {});
      const input = new Uint8Array(fileBuffer);
      const data = await parsePdf(input, { scale: 2 }, (content) => content);
      assert.equal(data.length, 9);
    });

    it('should return valid string parsed from pdf', async () => {
      const pathToFile = path.join('test', 'example-img.pdf');
      const fileBuffer = await readFile(pathToFile, {});
      const input = new Uint8Array(fileBuffer);
      const data = await parsePdf(input, { scale: 2 }, (content) => content);
      assert.equal(data.length, 9);
    });
    it('should return valid string parsed from encrypted pdf', async () => {
      const pathToFile = path.join('test', 'example-encrypted.pdf');
      const fileBuffer = await readFile(pathToFile, {});
      const input = new Uint8Array(fileBuffer);
      const data = await parsePdf(
        input,
        { password: 'example', scale: 2 },
        (content) => content,
      );
      assert.equal(data.length, 9);
    });
    it('should fail on invalid password for encrypted pdf', async () => {
      const pathToFile = path.join('test', 'example-encrypted.pdf');
      const fileBuffer = await readFile(pathToFile, {});
      const input = new Uint8Array(fileBuffer);
      await assert.rejects(
        parsePdf(
          input,
          { password: 'invalid', scale: 2 },
          (content) => content,
        ),
        {
          message: 'Incorrect Password',
          name: 'PasswordException',
        },
      );
    });
  });

  // TODO use example from github, permalink somehow not working Invalid PDF structure.
  describe('input = valid URL object', () => {
    it('should return valid string parsed from pdf', async () => {
      const url = new URL('https://pdfobject.com/pdf/sample.pdf');
      const data = await parsePdf(url, { scale: 2 }, (content) => content);
      assert.equal(data.length, 1);
    });
  });

  describe('options parameter is optional', () => {
    it('should work without options parameter', async () => {
      const input = path.join('test', 'example.pdf');
      const data = await parsePdf(input, (content) => content);
      assert.equal(data.length, 9);
    });
  });

  describe('concurrency = auto', () => {
    it('should process pdf with auto concurrency', async () => {
      const input = path.join('test', 'example.pdf');
      const data = await parsePdf(
        input,
        { concurrency: 'auto' },
        (content) => content,
      );
      assert.equal(data.length, 9);
    });
  });

  describe('concurrency limit', () => {
    it('should run at most `concurrency` pages at the same time', async () => {
      const input = path.join('test', 'example.pdf');
      const concurrency = 2;
      let active = 0;
      let peak = 0;

      const data = await parsePdf(input, { concurrency }, async (content) => {
        active++;
        peak = Math.max(peak, active);
        // Hold the slot so that pages processed at the same time overlap here.
        await delay(50);
        active--;
        return content;
      });

      assert.equal(data.length, 9);
      // Without the limit all nine pages start at once and the peak is 9.
      assert.equal(
        peak,
        concurrency,
        `expected at most ${concurrency} pages at a time, saw ${peak}`,
      );
    });
  });
  describe('callback validation', () => {
    it('should reject when no callback is given', async () => {
      const input = path.join('test', 'example.pdf');

      await assert.rejects(
        // @ts-expect-error testing a missing callback
        parsePdf(input, {}),
        {
          message: 'Invalid callback type: undefined',
          name: 'Error',
        },
      );
    });

    it('should reject a callback that is not a function', async () => {
      const input = path.join('test', 'example.pdf');

      await assert.rejects(
        // @ts-expect-error testing an invalid callback
        parsePdf(input, {}, 'not a function'),
        {
          message: 'Invalid callback type: string',
          name: 'Error',
        },
      );
    });
  });

  describe('page content type', () => {
    it('should hand text pages to the callback as a string', async () => {
      const input = path.join('test', 'example.pdf');

      const types = await parsePdf(input, {}, (content) =>
        Buffer.isBuffer(content) ? 'buffer' : 'string',
      );

      assert.deepEqual(
        types,
        Array.from({ length: 9 }, () => 'string'),
      );
    });

    it('should render a page without text and hand it over as a buffer', async () => {
      const input = path.join('test', 'example-img.pdf');

      const types = await parsePdf(input, {}, (content) =>
        Buffer.isBuffer(content) ? 'buffer' : 'string',
      );

      assert.deepEqual(
        types,
        Array.from({ length: 9 }, () => 'buffer'),
      );
    });
  });
});
