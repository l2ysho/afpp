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
    it('should read every field from the pdf info dictionary', async () => {
      const input = path.join('test', 'example.pdf');
      const metadata = await getPdfMetadata(input);

      assert.equal(metadata.title, 'example');
      assert.equal(metadata.creator, 'Pages');
      assert.equal(
        metadata.producer,
        'macOS Version 14.6.1 (Build 23G93) Quartz PDFContext',
      );
      assert.deepEqual(
        metadata.creationDate,
        new Date('2024-09-18T12:20:51.000Z'),
      );
      assert.deepEqual(
        metadata.modificationDate,
        new Date('2024-09-18T12:20:51.000Z'),
      );
      // example.pdf carries no Author and no Subject.
      assert.equal(metadata.author, undefined);
      assert.equal(metadata.subject, undefined);
    });

    /**
     * example-metadata.pdf is a hand written one page pdf. Its info dictionary
     * holds an empty `/Title`, an unparsable `/ModDate` and the two fields that
     * example.pdf leaves out, so it covers what the other fixtures cannot.
     */
    it('should drop an empty string field and keep the rest', async () => {
      const input = path.join('test', 'example-metadata.pdf');
      const metadata = await getPdfMetadata(input);

      assert.equal(metadata.title, undefined);
      assert.equal(metadata.author, 'Ada Lovelace');
      assert.equal(metadata.subject, 'Mutation testing fixture');
      assert.equal(metadata.creator, 'afpp test suite');
      assert.equal(metadata.producer, 'afpp test suite');
      assert.deepEqual(
        metadata.creationDate,
        new Date('2024-01-01T00:00:00.000Z'),
      );
      assert.equal(metadata.pageCount, 1);
      assert.equal(metadata.isEncrypted, false);
    });

    it('should drop a date the pdf spells wrong', async () => {
      const input = path.join('test', 'example-metadata.pdf');
      const metadata = await getPdfMetadata(input);

      assert.equal(metadata.modificationDate, undefined);
    });
  });
});
