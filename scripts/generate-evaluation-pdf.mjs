import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPdfLaunchOptions } from "./pdf-browser.mjs";

const require = createRequire(import.meta.url);
const { mdToPdf } = require("md-to-pdf");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const input = join(root, "docs", "Evaluation-Evidence-print.md");
const stylesheet = join(root, "docs", "tdd-pdf.css");
const output = join(root, "docs", "PR-Intelligence-Agent-Evaluation-Evidence.pdf");

console.log("Generating Evaluation Evidence PDF...");
console.log(`  Input:  ${input}`);
console.log(`  Output: ${output}`);

await mdToPdf(
  { path: input },
  {
    dest: output,
    css: stylesheet,
    pdf_options: {
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "18mm",
        bottom: "20mm",
        left: "18mm",
      },
    },
    launch_options: getPdfLaunchOptions(),
  },
);

console.log("PDF created successfully.");
console.log(output);
