import { readFile } from "node:fs/promises";
import path from "node:path";

import { createCanvas } from "canvas";

import type {
  TextContent,
  TextItem,
  TextMarkedContent,
} from "pdfjs-dist/types/src/display/api.js";
import { PDFPageProxy } from "pdfjs-dist/types/web/interfaces";

const parsePdfFileBuffer = async (data: Uint8Array, options?: ParseOptions) => {
  return import("pdfjs-dist/legacy/build/pdf.mjs").then(async (pdfjsLib) => {
    const loadingTask = pdfjsLib.getDocument({
      data,
      password: options?.password,
    });

    const pdfDocument = await loadingTask.promise;

    const { numPages } = pdfDocument;
    const pageContents: string[] = new Array(numPages);
    const pagePromises: Promise<void | PDFPageProxy>[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum += 1) {
      pagePromises.push(
        pdfDocument.getPage(pageNum).then(async (page) => {
          const textContent = await page.getTextContent({
            includeMarkedContent: false,
          });
          // ? Type assertion of items to TextItem[] should be safe because {includeMarkedContent: false}
          const items = textContent.items as TextItem[];
          if (items.length === 0) {
            console.log("empty page");
            pageContents[pageNum - 1] = "";
          } else {
            const pageText = items.map((item) => item.str || "").join(" ");
            pageContents[pageNum - 1] = pageText;
          }
        })
      );
    }
    await Promise.all(pagePromises);
    return pageContents;
  });
};

type ParseOptions = {
  password?: string;
};

const pdf2string = async (
  source: string | Buffer | Uint8Array,
  options?: ParseOptions
) => {
  if (typeof source === "string") {
    const fileBase64 = await readFile(source, {});
    const data = new Uint8Array(fileBase64);
    return parsePdfFileBuffer(data, options);
  }
  if (Buffer.isBuffer(source)) {
    const fileBase64 = await readFile(source, {});
    const data = new Uint8Array(fileBase64);
    return parsePdfFileBuffer(data, options);
  }
  if (source instanceof Uint8Array) {
    return parsePdfFileBuffer(source, options);
  }
  throw new Error(`Invalid source type: ${typeof source}`);
};

export { pdf2string };
