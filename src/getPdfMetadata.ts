import { readFile } from 'node:fs/promises';

import {
  getDocument,
  PDFDateString,
  VerbosityLevel,
} from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api.js';

import type { AfppParseOptions } from '#afpp/src/core';

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount: number;
  isEncrypted: boolean;
}

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.length > 0) return value;
  return undefined;
};

const toOptionalDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const date = PDFDateString.toDateObject(value as string);
  return date ?? undefined;
};

export async function getPdfMetadata(
  input: Buffer | string | Uint8Array | URL,
  options?: Pick<AfppParseOptions, 'password'>,
): Promise<PdfMetadata> {
  const documentInitParameters: DocumentInitParameters = {};

  switch (true) {
    case typeof input === 'string':
      documentInitParameters.data = new Uint8Array(
        await readFile(input as string),
      );
      break;
    case Buffer.isBuffer(input):
      documentInitParameters.data = new Uint8Array(input as Buffer);
      break;
    case input instanceof Uint8Array:
      documentInitParameters.data = input as Uint8Array;
      break;
    case input instanceof URL:
      documentInitParameters.url = input as URL;
      break;
    default:
      throw new Error(`Invalid source type: ${typeof input}`);
  }

  documentInitParameters.verbosity = VerbosityLevel.ERRORS;
  documentInitParameters.disableAutoFetch = true;
  documentInitParameters.disableStream = true;
  documentInitParameters.disableRange = true;

  let isEncrypted = false;
  const loadingTask = getDocument(documentInitParameters);

  // PasswordResponses.NEED_PASSWORD = 1, INCORRECT_PASSWORD = 2
  loadingTask.onPassword = (updateCallback: Function, reason: number) => {
    isEncrypted = true;
    if (reason === 1 && options?.password) {
      updateCallback(options.password);
    } else {
      const msg = reason === 2 ? 'Incorrect Password' : 'No password given';
      const err = new Error(msg);
      err.name = 'PasswordException';
      throw err;
    }
  };

  const pdfDocument = await loadingTask.promise;

  try {
    const { numPages } = pdfDocument;
    const { info } = await pdfDocument.getMetadata();
    const record = info as Record<string, unknown>;

    return {
      title: toOptionalString(record['Title']),
      author: toOptionalString(record['Author']),
      subject: toOptionalString(record['Subject']),
      creator: toOptionalString(record['Creator']),
      producer: toOptionalString(record['Producer']),
      creationDate: toOptionalDate(record['CreationDate']),
      modificationDate: toOptionalDate(record['ModDate']),
      pageCount: numPages,
      isEncrypted,
    };
  } finally {
    pdfDocument.cleanup();
    await pdfDocument.destroy();
    loadingTask.destroy();
  }
}
