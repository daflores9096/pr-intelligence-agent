import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { mdToPdf } = require("md-to-pdf");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const input = join(root, "docs", "TDD-print.md");
const stylesheet = join(root, "docs", "tdd-pdf.css");
const output = join(root, "docs", "PR-Intelligence-Agent-TDD.pdf");

console.log("Generating PDF...");
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
    launch_options: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  },
);

console.log("PDF created successfully.");
console.log(output);
