import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';

import { getPdfMetadata } from '#afpp/src/index.js';

describe('getPdfMetadata', () => {
  describe('input != string, buffer, Uint8Array or URL', () => {
    it('promise should be rejected with specific error', async () => {
      // @ts-expect-error It should throw error because input is required
      await assert.rejects(getPdfMetadata(), {
        message: 'Invalid source type: undefined',
        name: 'Error',
      });
    });
  });

  describe('input = valid path to file as string', () => {
    it('should return pageCount and isEncrypted for non-encrypted pdf', async () => {
      const input = path.join('test', 'example.pdf');
      const metadata = await getPdfMetadata(input);
      assert.equal(metadata.pageCount, 9);
      assert.equal(metadata.isEncrypted, false);
    });
  });

  describe('input = valid pdf buffer', () => {
    it('should return metadata from buffer', async () => {
      const pathToFile = path.join('test', 'example.pdf');
      const input = await readFile(pathToFile);
      const metadata = await getPdfMetadata(input);
      assert.equal(metadata.pageCount, 9);
      assert.equal(metadata.isEncrypted, false);
    });
  });

  describe('input = valid Uint8Array', () => {
    it('should return metadata from Uint8Array', async () => {
      const pathToFile = path.join('test', 'example.pdf');
      const fileBuffer = await readFile(pathToFile);
      const input = new Uint8Array(fileBuffer);
      const metadata = await getPdfMetadata(input);
      assert.equal(metadata.pageCount, 9);
      assert.equal(metadata.isEncrypted, false);
    });
  });

  describe('input = encrypted pdf', () => {
    it('should return isEncrypted: true with correct password', async () => {
      const input = path.join('test', 'example-encrypted.pdf');
      const metadata = await getPdfMetadata(input, { password: 'example' });
      assert.equal(metadata.pageCount, 9);
      assert.equal(metadata.isEncrypted, true);
    });

    it('should throw PasswordException when no password given', async () => {
      const input = path.join('test', 'example-encrypted.pdf');
      await assert.rejects(getPdfMetadata(input), {
        message: 'No password given',
        name: 'PasswordException',
      });
    });

    it('should throw PasswordException on wrong password', async () => {
      const input = path.join('test', 'example-encrypted.pdf');
      await assert.rejects(getPdfMetadata(input, { password: 'wrong' }), {
        message: 'Incorrect Password',
        name: 'PasswordException',
      });
    });
  });

  describe('input = valid URL object', () => {
    it('should return metadata from URL', async () => {
      const url = new URL('https://pdfobject.com/pdf/sample.pdf');
      const metadata = await getPdfMetadata(url);
      assert.ok(metadata.pageCount >= 1);
      assert.equal(metadata.isEncrypted, false);
    });
  });

  describe('metadata fields', () => {
    it('optional string fields should be undefined or non-empty string (never empty string)', async () => {
      const input = path.join('test', 'example.pdf');
      const metadata = await getPdfMetadata(input);
      const optionalStringFields = [
        'title',
        'author',
        'subject',
        'creator',
        'producer',
      ] as const;
      for (const field of optionalStringFields) {
        const value = metadata[field];
        assert.ok(
          value === undefined ||
            (typeof value === 'string' && value.length > 0),
          `Field '${field}' should be undefined or non-empty string, got: ${JSON.stringify(value)}`,
        );
      }
    });

    it('optional date fields should be undefined or Date instance', async () => {
      const input = path.join('test', 'example.pdf');
      const metadata = await getPdfMetadata(input);
      const optionalDateFields = ['creationDate', 'modificationDate'] as const;
      for (const field of optionalDateFields) {
        const value = metadata[field];
        assert.ok(
          value === undefined || value instanceof Date,
          `Field '${field}' should be undefined or Date, got: ${JSON.stringify(value)}`,
        );
      }
    });
  });
});
