import { readFile } from "node:fs/promises";
import path from "node:path";
import type { JiraTicket } from "../types/index.js";

const samplesDir = path.resolve("data/samples");

export async function loadJiraTicket(
  fileName = "jira-ticket.json",
): Promise<JiraTicket> {
  const filePath = path.join(samplesDir, fileName);
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as JiraTicket;
}

export async function loadCodeDiff(fileName = "code.diff"): Promise<string> {
  const filePath = path.join(samplesDir, fileName);
  return readFile(filePath, "utf-8");
}

export async function loadInternalDocs(): Promise<string[]> {
  const docsDir = path.join(samplesDir, "docs");
  const { readdir, readFile } = await import("node:fs/promises");
  const files = await readdir(docsDir);
  const markdownFiles = files.filter((file) => file.endsWith(".md"));

  return Promise.all(
    markdownFiles.map(async (file) => {
      const content = await readFile(path.join(docsDir, file), "utf-8");
      return `# ${file}\n\n${content}`;
    }),
  );
}
