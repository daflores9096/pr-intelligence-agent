import { existsSync } from "node:fs";

const candidates = [
  process.env.CHROME_PATH,
  process.env.EDGE_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

export function getBrowserExecutablePath() {
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

export function getPdfLaunchOptions() {
  const executablePath = getBrowserExecutablePath();

  if (!executablePath) {
    throw new Error(
      [
        "No Chrome/Edge browser found for PDF generation.",
        "Install Google Chrome or Microsoft Edge, or set CHROME_PATH in your environment.",
      ].join(" "),
    );
  }

  return {
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };
}
