import { getDocument, PDFDateString } from 'pdfjs-dist/legacy/build/pdf.mjs';

import type { AfppParseOptions } from '#afpp/src/core.js';
import { resolveInput } from '#afpp/src/resolveInput.js';

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
  const documentInitParameters = await resolveInput(input);

  let isEncrypted = false;
  const loadingTask = getDocument(documentInitParameters);

  // PasswordResponses.NEED_PASSWORD = 1, INCORRECT_PASSWORD = 2
  loadingTask.onPassword = (
    updateCallback: (password: string) => void,
    reason: number,
  ) => {
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
    await pdfDocument.cleanup();
    await loadingTask.destroy();
  }
}
