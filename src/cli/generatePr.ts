import "../config/env.js";
import {
  generatePrDescription,
  renderPrMarkdown,
} from "../chains/prDescriptionChain.js";
import { loadCodeDiff, loadJiraTicket } from "../ingestion/loadInputs.js";

const ticket = await loadJiraTicket();
const diff = await loadCodeDiff();

console.log(`Generating PR description for ${ticket.key}...\n`);

const pr = await generatePrDescription({
  ticket,
  diff,
});

console.log(renderPrMarkdown(pr));
