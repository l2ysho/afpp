import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';

import { pdf2image } from '#afpp/src/index.js';

describe('pdf2image', () => {
  describe('input != string, buffer, Uint8Array or URL  ', () => {
    it('promise should be rejected with specific error', async () => {
      // @ts-expect-error It should throw error because input is required
      await assert.rejects(pdf2image(), {
        message: 'Invalid source type: undefined',
        name: 'Error',
      });
    });
  });

  describe('input = valid path to file as string', () => {
    it('should return valid string parsed from pdf', async () => {
      const input = path.join('test', 'example.pdf');
      const data = await pdf2image(input);
      assert.equal(data.length, 9);
    });
  });

  describe('input = valid path to encrypted file as string', () => {
    it('should return valid string parsed from pdf', async () => {
      const input = path.join('test', 'example-encrypted.pdf');
      await assert.rejects(pdf2image(input), {
        message: 'No password given',
        name: 'PasswordException',
      });
    });
  });

  describe('input = valid pdf buffer', () => {
    it('should return valid string parsed from pdf', async () => {
      const pathToFile = path.join('test', 'example.pdf');
      const input = await readFile(pathToFile, {});
      const data = await pdf2image(input);
      assert.equal(data.length, 9);
    });
  });

  describe('input = valid Uint8Array', () => {
    it('should return valid string parsed from pdf', async () => {
      const pathToFile = path.join('test', 'example.pdf');
      const fileBuffer = await readFile(pathToFile, {});
      const input = new Uint8Array(fileBuffer);
      const data = await pdf2image(input);
      assert.equal(data.length, 9);
    });
    it('should return valid string parsed from encrypted pdf', async () => {
      const pathToFile = path.join('test', 'example-encrypted.pdf');
      const fileBuffer = await readFile(pathToFile, {});
      const input = new Uint8Array(fileBuffer);
      const data = await pdf2image(input, { password: 'example' });
      assert.equal(data.length, 9);
    });
    it('should fail on invalid password for encrypted pdf', async () => {
      const pathToFile = path.join('test', 'example-encrypted.pdf');
      const fileBuffer = await readFile(pathToFile, {});
      const input = new Uint8Array(fileBuffer);
      await assert.rejects(pdf2image(input, { password: 'invalid' }), {
        message: 'Incorrect Password',
        name: 'PasswordException',
      });
    });
  });

  // TODO use example from github, permalink somehow not working Invalid PDF structure.
  describe('input = valid URL object', () => {
    it('should return valid string parsed from pdf', async () => {
      const url = new URL('https://pdfobject.com/pdf/sample.pdf');
      const data = await pdf2image(url);
      assert.equal(data.length, 1);
    });
  });

  describe('scale validation', () => {
    it('should reject scale above 10', async () => {
      const input = path.join('test', 'example.pdf');
      await assert.rejects(pdf2image(input, { scale: 100 }), {
        message:
          'Invalid scale value: 100. Must be a number between 0.1 and 10.',
        name: 'Error',
      });
    });

    it('should reject scale below 0.1', async () => {
      const input = path.join('test', 'example.pdf');
      await assert.rejects(pdf2image(input, { scale: 0.01 }), {
        message:
          'Invalid scale value: 0.01. Must be a number between 0.1 and 10.',
        name: 'Error',
      });
    });

    it('should reject scale of 0', async () => {
      const input = path.join('test', 'example.pdf');
      await assert.rejects(pdf2image(input, { scale: 0 }), {
        message: 'Invalid scale value: 0. Must be a number between 0.1 and 10.',
        name: 'Error',
      });
    });

    it('should reject negative scale', async () => {
      const input = path.join('test', 'example.pdf');
      await assert.rejects(pdf2image(input, { scale: -1 }), {
        message:
          'Invalid scale value: -1. Must be a number between 0.1 and 10.',
        name: 'Error',
      });
    });

    it('should reject NaN scale', async () => {
      const input = path.join('test', 'example.pdf');
      await assert.rejects(pdf2image(input, { scale: NaN }), {
        message:
          'Invalid scale value: NaN. Must be a number between 0.1 and 10.',
        name: 'Error',
      });
    });
  });

  describe('concurrency = auto', () => {
    it('should process pdf with auto concurrency', async () => {
      const input = path.join('test', 'example.pdf');
      const data = await pdf2image(input, { concurrency: 'auto' });
      assert.equal(data.length, 9);
    });
  });

  describe('concurrency validation', () => {
    it('should reject concurrency of 0', async () => {
      const input = path.join('test', 'example.pdf');
      await assert.rejects(pdf2image(input, { concurrency: 0 }), {
        message:
          "Invalid concurrency value: 0. Must be a positive integer or 'auto'.",
        name: 'Error',
      });
    });

    it('should reject negative concurrency', async () => {
      const input = path.join('test', 'example.pdf');
      await assert.rejects(pdf2image(input, { concurrency: -1 }), {
        message:
          "Invalid concurrency value: -1. Must be a positive integer or 'auto'.",
        name: 'Error',
      });
    });

    it('should reject non-integer concurrency', async () => {
      const input = path.join('test', 'example.pdf');
      await assert.rejects(pdf2image(input, { concurrency: 1.5 }), {
        message:
          "Invalid concurrency value: 1.5. Must be a positive integer or 'auto'.",
        name: 'Error',
      });
    });
  });

  describe('imageEncoding validation', () => {
    it('should reject unsupported encoding', async () => {
      const input = path.join('test', 'example.pdf');
      await assert.rejects(
        // @ts-expect-error testing invalid value
        pdf2image(input, { imageEncoding: 'bmp' }),
        {
          message: "Unsupported image encoding format: 'bmp'",
          name: 'Error',
        },
      );
    });
  });

  describe('imageEncoding formats', () => {
    it('should produce avif output', async () => {
      const input = path.join('test', 'example.pdf');
      const data = await pdf2image(input, { imageEncoding: 'avif' });
      assert.equal(data.length, 9);
      // AVIF starts with ftyp box: bytes 4-7 are 0x66 0x74 0x79 0x70 ('ftyp')
      assert.equal(data[0]![4], 0x66);
      assert.equal(data[0]![5], 0x74);
    });

    it('should produce webp output', async () => {
      const input = path.join('test', 'example.pdf');
      const data = await pdf2image(input, { imageEncoding: 'webp' });
      assert.equal(data.length, 9);
      // WebP: starts with RIFF (0x52 0x49 0x46 0x46)
      assert.equal(data[0]![0], 0x52);
      assert.equal(data[0]![1], 0x49);
    });
  });
});
