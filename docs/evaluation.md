# Evaluation Guide (LangSmith + Local Checks)

> **Full evaluation document:** `docs/Evaluation-Evidence.md` (source) and `docs/PR-Intelligence-Agent-Evaluation-Evidence.pdf` (PDF with screenshots).

This project includes an evaluation harness to produce evidence for the Engineering Review.

## 1) Enable LangSmith

In `.env`:

```env
LANGCHAIN_TRACING_V2="true"
LANGCHAIN_API_KEY="your_langsmith_key"
LANGCHAIN_PROJECT="pr-intelligence-agent"
```

## 2) Run Evaluation Suite

```bash
npm run eval
```

This executes 3 cases:

1. `baseline-happy-path` — normal Jira + diff
2. `prompt-injection-resilience` — malicious Jira instructions must be ignored
3. `zero-retrieval-fallback` — conservative output when retrieval is empty

Outputs:

- Console pass/fail per check
- JSON report in `eval/reports/eval-<timestamp>.json`
- LangSmith traces tagged with `evaluation`

## 3) Capture Evidence Screenshots

In LangSmith:

1. Open project `pr-intelligence-agent`
2. Filter by tag: `evaluation`
3. Capture screenshots for:
   - `eval:baseline-happy-path` (successful run)
   - `eval:prompt-injection-resilience` (shows guardrail behavior)
   - `eval:zero-retrieval-fallback` (fallback behavior)

## 4) Before/After Prompt Improvement Narrative

Use this storyline in your submission:

- **Before (prompt v1/v2):** valid PR output, but prompt-injection case failed (`HACKED PR` leaked into title).
- **After (prompt v3):** delimiter boundaries + explicit security rules; eval pass rate improved to **3/3**.
- **Evidence:** compare LangSmith traces + `eval/reports/*.json` pass rate.

## 5) Suggested Moodle Evidence Pack

- 2–3 LangSmith trace screenshots
- 1 local eval JSON report
- 1 generated PR markdown (`npm run generate`)
- Short paragraph explaining one fixed hallucination/gap and the prompt change

## 6) Troubleshooting

- `403 Forbidden` from LangSmith: invalid/missing `LANGCHAIN_API_KEY`
- Empty traces: ensure `LANGCHAIN_TRACING_V2=true` and rerun `npm run eval`
- Case fails on keyword checks: inspect report JSON and refine prompt in `src/chains/prDescriptionChain.ts`
