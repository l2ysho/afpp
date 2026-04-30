import { readFile } from 'node:fs/promises';

import { VerbosityLevel } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api.js';

export async function resolveInput(
  input: Buffer | string | Uint8Array | URL,
): Promise<DocumentInitParameters> {
  const params: DocumentInitParameters = {};

  switch (true) {
    case typeof input === 'string':
      params.data = new Uint8Array(await readFile(input));
      break;
    case Buffer.isBuffer(input):
      params.data = new Uint8Array(input);
      break;
    case input instanceof Uint8Array:
      params.data = input;
      break;
    case input instanceof URL:
      params.url = input;
      break;
    default:
      throw new Error(`Invalid source type: ${typeof input}`);
  }

  params.verbosity = VerbosityLevel.ERRORS;
  if (params.data !== undefined) {
    // Only disable streaming/range when we have full data in memory; URL inputs rely on HTTP range requests
    params.disableAutoFetch = true;
    params.disableStream = true;
    params.disableRange = true;
  }

  return params;
}
