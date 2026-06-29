import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "./env.js";

const EMBEDDING_DIMENSIONS = 1536;

export async function listIndexNames(): Promise<string[]> {
  const pinecone = new Pinecone({ apiKey: env.pineconeApiKey() });
  const indexes = await pinecone.listIndexes();
  return (indexes.indexes ?? []).map((index) => index.name);
}

export async function ensurePineconeIndex(): Promise<void> {
  const indexName = env.pineconeIndexName();
  const pinecone = new Pinecone({ apiKey: env.pineconeApiKey() });
  const existing = await listIndexNames();

  if (existing.includes(indexName)) {
    console.log(`Pinecone index "${indexName}" already exists.`);
    return;
  }

  console.log(`Creating Pinecone index "${indexName}" (1536 dimensions)...`);
  await pinecone.createIndex({
    name: indexName,
    dimension: EMBEDDING_DIMENSIONS,
    metric: "cosine",
    spec: {
      serverless: {
        cloud: "aws",
        region: "us-east-1",
      },
    },
  });

  console.log("Waiting for index to be ready...");
  await pinecone.describeIndex(indexName);
  console.log(`Index "${indexName}" is ready.`);
}

export async function assertPineconeIndexExists(): Promise<void> {
  const indexName = env.pineconeIndexName();
  const existing = await listIndexNames();

  if (existing.includes(indexName)) {
    return;
  }

  throw new Error(
    [
      `Pinecone index "${indexName}" was not found (HTTP 404).`,
      "",
      "Fix options:",
      `  1) Create it: npm run setup:pinecone`,
      `  2) Reuse your course index: set PINECONE_INDEX_NAME=langchain-docs in .env`,
      "",
      `Indexes available in your Pinecone account: ${
        existing.length > 0 ? existing.join(", ") : "(none)"
      }`,
    ].join("\n"),
  );
}
