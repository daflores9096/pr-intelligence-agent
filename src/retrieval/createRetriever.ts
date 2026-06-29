import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { ContextualCompressionRetriever } from "@langchain/classic/retrievers/contextual_compression";
import { LLMChainExtractor } from "@langchain/classic/retrievers/document_compressors/chain_extract";
import { ChatOpenAI } from "@langchain/openai";
import { env } from "../config/env.js";
import { loadParentStore } from "../indexing/parentChildSplit.js";

async function createBaseRetriever() {
  const embeddings = new OpenAIEmbeddings({
    apiKey: env.openAiApiKey(),
    model: env.embeddingModel(),
  });

  const pinecone = new Pinecone({ apiKey: env.pineconeApiKey() });
  const pineconeIndex = pinecone.index(env.pineconeIndexName());

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
  });

  return vectorStore.asRetriever({
    k: 8,
    searchType: "similarity",
  });
}

export async function createParentDocumentRetriever() {
  const baseRetriever = await createBaseRetriever();
  const parentStore = await loadParentStore();

  const llm = new ChatOpenAI({
    apiKey: env.openAiApiKey(),
    model: env.chatModel(),
    temperature: 0,
  });

  const compressor = LLMChainExtractor.fromLLM(llm);
  const compressionRetriever = new ContextualCompressionRetriever({
    baseCompressor: compressor,
    baseRetriever,
  });

  return {
    async getRelevantDocuments(query: string): Promise<Document[]> {
      const childDocs = await compressionRetriever.invoke(query);

      if (childDocs.length === 0) {
        return [];
      }

      const parentDocs = new Map<string, Document>();
      for (const child of childDocs) {
        const parentDocId = String(child.metadata.parent_doc_id ?? "");
        const parent = parentStore.get(parentDocId);
        if (parent && !parentDocs.has(parentDocId)) {
          parentDocs.set(parentDocId, parent);
        }
      }

      if (parentDocs.size === 0) {
        return childDocs;
      }

      return [...parentDocs.values()];
    },
  };
}
