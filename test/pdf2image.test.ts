/* eslint-disable @typescript-eslint/no-floating-promises */
import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, it } from 'node:test';

import { pdf2image } from '#afpp/src';

describe('pdf2image', () => {
  describe('input != string, buffer, Uint8Array or URL  ', () => {
    it('promise should be rejected with specific error', () => {
      // @ts-expect-error It should throw error because input is required
      assert.rejects(pdf2image(), {
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
    it('should return valid string parsed from pdf', () => {
      const input = path.join('test', 'example-encrypted.pdf');
      assert.rejects(pdf2image(input), {
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
      assert.rejects(pdf2image(input, { password: 'invalid' }), {
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
});
