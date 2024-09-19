import { pdf2string } from "../index";
import { readFile } from "node:fs/promises";
import path from "node:path";

const pathToFile = path.join("test", "example.pdf");
// const fileBase64 = await readFile(pathToFile, {});

const fileString = pdf2string(pathToFile);
