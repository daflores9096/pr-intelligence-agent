import type { PrDescription } from "../types/index.js";
import type { EvalCase } from "./cases.js";

export type EvalCheck = {
  name: string;
  passed: boolean;
  details: string;
};

export type EvalCaseResult = {
  caseId: string;
  caseName: string;
  passed: boolean;
  checks: EvalCheck[];
  output: PrDescription;
};

function includesAny(haystack: string, needles: string[]): string[] {
  const lower = haystack.toLowerCase();
  return needles.filter((needle) => lower.includes(needle.toLowerCase()));
}

export function scorePrOutput(
  evalCase: EvalCase,
  output: PrDescription,
): EvalCaseResult {
  const serialized = JSON.stringify(output);
  const markdown = [
    output.title,
    output.summary,
    output.changes.join(" "),
    output.testPlan.join(" "),
    output.risks.join(" "),
    output.rolloutNotes,
  ].join(" ");

  const checks: EvalCheck[] = [
    {
      name: "has-title",
      passed: output.title.trim().length > 0,
      details: "PR title must not be empty.",
    },
    {
      name: "has-summary",
      passed: output.summary.trim().length > 20,
      details: "Summary should be descriptive (20+ chars).",
    },
    {
      name: "has-changes",
      passed: output.changes.length > 0,
      details: "At least one change item is required.",
    },
    {
      name: "test-plan-size",
      passed: output.testPlan.length >= evalCase.minTestPlanItems,
      details: `Expected >= ${evalCase.minTestPlanItems} test plan items.`,
    },
  ];

  const requiredHits = includesAny(markdown, evalCase.mustInclude);
  checks.push({
    name: "must-include-keywords",
    passed: requiredHits.length === evalCase.mustInclude.length,
    details:
      requiredHits.length === evalCase.mustInclude.length
        ? "All required keywords found."
        : `Missing keywords: ${evalCase.mustInclude
            .filter((item) => !requiredHits.includes(item))
            .join(", ")}`,
  });

  const forbiddenHits = includesAny(markdown, evalCase.mustNotInclude);
  checks.push({
    name: "must-not-include-forbidden",
    passed: forbiddenHits.length === 0,
    details:
      forbiddenHits.length === 0
        ? "No forbidden content detected."
        : `Forbidden content found: ${forbiddenHits.join(", ")}`,
  });

  if (evalCase.id === "baseline-happy-path") {
    const criteriaHits = evalCase.input.ticket.acceptanceCriteria.filter(
      (criterion) => {
        const tokens = criterion
          .toLowerCase()
          .split(/\s+/)
          .filter((token) => token.length > 4);
        const testPlanText = output.testPlan.join(" ").toLowerCase();
        return tokens.some((token) => testPlanText.includes(token));
      },
    );

    checks.push({
      name: "acceptance-criteria-coverage",
      passed:
        criteriaHits.length >=
        Math.ceil(evalCase.input.ticket.acceptanceCriteria.length * 0.75),
      details: `Matched ${criteriaHits.length}/${evalCase.input.ticket.acceptanceCriteria.length} acceptance criteria in test plan.`,
    });
  }

  return {
    caseId: evalCase.id,
    caseName: evalCase.name,
    passed: checks.every((check) => check.passed),
    checks,
    output,
  };
}

export function summarizeResults(results: EvalCaseResult[]) {
  const passed = results.filter((result) => result.passed).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    passRate: results.length === 0 ? 0 : passed / results.length,
  };
}
