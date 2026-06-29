import "../config/env.js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PROMPT_VERSION, generatePrDescription } from "../chains/prDescriptionChain.js";
import { env } from "../config/env.js";
import { evalCases } from "../eval/cases.js";
import { scorePrOutput, summarizeResults } from "../eval/scorePr.js";
import { loadCodeDiff, loadJiraTicket } from "../ingestion/loadInputs.js";

const reportDir = path.resolve("eval/reports");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

async function run() {
  if (!env.isLangSmithEnabled()) {
    console.warn(
      "LangSmith tracing is disabled. Set LANGCHAIN_TRACING_V2=true and LANGCHAIN_API_KEY in .env to capture traces.",
    );
  } else {
    console.log(
      `LangSmith tracing enabled for project "${env.langSmithProject()}".`,
    );
  }

  const [defaultTicket, defaultDiff] = await Promise.all([
    loadJiraTicket(),
    loadCodeDiff(),
  ]);

  const results = [];
  for (const evalCase of evalCases) {
    const input = {
      ...evalCase.input,
      ticket: evalCase.input.ticket ?? defaultTicket,
      diff: evalCase.input.diff ?? defaultDiff,
    };

    console.log(`\nRunning case: ${evalCase.id} — ${evalCase.name}`);
    const output = await generatePrDescription(input, {
      runName: `eval:${evalCase.id}`,
      tags: ["evaluation", evalCase.id, "pr-intelligence-agent"],
      metadata: {
        evalCaseId: evalCase.id,
        promptVersion: PROMPT_VERSION,
        ticketKey: input.ticket.key,
      },
    });

    const scored = scorePrOutput(evalCase, output);
    results.push(scored);

    console.log(scored.passed ? "PASS" : "FAIL");
    for (const check of scored.checks) {
      console.log(`  [${check.passed ? "x" : " "}] ${check.name}: ${check.details}`);
    }
  }

  const summary = summarizeResults(results);
  const report = {
    generatedAt: new Date().toISOString(),
    langSmithProject: env.langSmithProject(),
    langSmithEnabled: env.isLangSmithEnabled(),
    promptVersion: PROMPT_VERSION,
    summary,
    results,
  };

  await mkdir(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `eval-${timestamp}.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log("\nEvaluation summary");
  console.log(`  Passed: ${summary.passed}/${summary.total}`);
  console.log(`  Report: ${reportPath}`);
  console.log(
    "\nNext: open LangSmith → project",
    `"${env.langSmithProject()}"`,
    "→ filter tags: evaluation",
  );
}

run().catch((error) => {
  console.error("Evaluation failed:", error);
  process.exit(1);
});
