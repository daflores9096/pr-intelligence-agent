import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import cliProgress from "cli-progress";
import { env } from "../config/env.js";
import { assertPineconeIndexExists } from "../config/pinecone.js";
import {
  loadInternalDocs,
  loadCodeDiff,
  loadJiraTicket,
} from "../ingestion/loadInputs.js";
import {
  persistParentStore,
  splitWithParentChild,
} from "./parentChildSplit.js";

function toDocuments(contents: string[], docType: string): Document[] {
  return contents.map(
    (content, index) =>
      new Document({
        pageContent: content,
        metadata: {
          doc_type: docType,
          source: `${docType}-${index + 1}`,
        },
      }),
  );
}

export async function buildSourceDocuments(): Promise<Document[]> {
  const [ticket, diff, docs] = await Promise.all([
    loadJiraTicket(),
    loadCodeDiff(),
    loadInternalDocs(),
  ]);

  const ticketDoc = new Document({
    pageContent: [
      `Jira: ${ticket.key}`,
      `Summary: ${ticket.summary}`,
      `Description: ${ticket.description}`,
      `Acceptance Criteria:\n- ${ticket.acceptanceCriteria.join("\n- ")}`,
      `Labels: ${ticket.labels.join(", ")}`,
      `Component: ${ticket.component}`,
    ].join("\n\n"),
    metadata: {
      doc_type: "jira_ticket",
      source: ticket.key,
      component: ticket.component,
    },
  });

  const diffDoc = new Document({
    pageContent: diff,
    metadata: {
      doc_type: "code_diff",
      source: "sample-code.diff",
      component: ticket.component,
    },
  });

  return [ticketDoc, diffDoc, ...toDocuments(docs, "internal_doc")];
}

export async function indexDocuments(): Promise<void> {
  const sourceDocuments = await buildSourceDocuments();
  const { parentDocuments, childDocuments } =
    await splitWithParentChild(sourceDocuments);

  await persistParentStore(parentDocuments);
  await assertPineconeIndexExists();

  const embeddings = new OpenAIEmbeddings({
    apiKey: env.openAiApiKey(),
    model: env.embeddingModel(),
  });

  const pinecone = new Pinecone({ apiKey: env.pineconeApiKey() });
  const pineconeIndex = pinecone.index(env.pineconeIndexName());

  console.log(
    `Indexing ${childDocuments.length} child chunks into Pinecone index "${env.pineconeIndexName()}"...`,
  );

  const progressBar = new cliProgress.SingleBar({});
  progressBar.start(childDocuments.length, 0);

  const batchSize = 100;
  for (let i = 0; i < childDocuments.length; i += batchSize) {
    const batch = childDocuments.slice(i, i + batchSize);
    await PineconeStore.fromDocuments(batch, embeddings, {
      pineconeIndex,
    });
    progressBar.increment(batch.length);
  }

  progressBar.stop();
  console.log("Indexing complete.");
}
