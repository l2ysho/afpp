import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export const PDF_PATH = join(__dirname, '../test/example.pdf');
export const ENCRYPTED_PDF_PATH = join(
  __dirname,
  '../test/example-encrypted.pdf',
);
export const IMAGE_PDF_PATH = join(__dirname, '../test/example-img.pdf');
export const OUTPUT_DIR = join(__dirname, 'output');
export const PASSWORD = 'example';

export async function ensureOutputDir(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
}

export function outputPath(filename: string): string {
  return join(OUTPUT_DIR, filename);
}
