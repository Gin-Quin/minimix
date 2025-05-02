import fs from "node:fs";
import { gzipSizeSync } from "gzip-size";

const content = fs.readFileSync("library/index.js");

console.log(`${gzipSizeSync(content)} bytes`);
