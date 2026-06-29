import dotenv from "dotenv";

dotenv.config();

function configureLangSmith(): void {
  const tracingEnabled = process.env.LANGCHAIN_TRACING_V2 === "true";
  const apiKey = process.env.LANGCHAIN_API_KEY?.trim();

  if (tracingEnabled && apiKey) {
    return;
  }

  process.env.LANGCHAIN_TRACING_V2 = "false";
}

configureLangSmith();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  openAiApiKey: () => requireEnv("OPENAI_API_KEY"),
  pineconeApiKey: () => requireEnv("PINECONE_API_KEY"),
  pineconeIndexName: () =>
    process.env.PINECONE_INDEX_NAME ?? "pr-intelligence-docs",
  chatModel: () => process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
  embeddingModel: () =>
    process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
  isLangSmithEnabled: () =>
    process.env.LANGCHAIN_TRACING_V2 === "true" &&
    Boolean(process.env.LANGCHAIN_API_KEY?.trim()),
  langSmithProject: () =>
    process.env.LANGCHAIN_PROJECT ?? "pr-intelligence-agent",
};
