import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const PARENT_CHUNK_SIZE = 2000;
const CHILD_CHUNK_SIZE = 400;
const PARENT_STORE_PATH = path.resolve("data/index/parent-store.json");

export type ParentChildChunks = {
  parentDocuments: Document[];
  childDocuments: Document[];
};

export async function splitWithParentChild(
  documents: Document[],
): Promise<ParentChildChunks> {
  const parentSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: PARENT_CHUNK_SIZE,
    chunkOverlap: 200,
  });

  const childSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHILD_CHUNK_SIZE,
    chunkOverlap: 50,
  });

  const parentDocuments: Document[] = [];
  const childDocuments: Document[] = [];

  for (const document of documents) {
    const parentId = randomUUID();
    const parents = await parentSplitter.splitDocuments([
      {
        ...document,
        metadata: {
          ...document.metadata,
          parent_id: parentId,
        },
      },
    ]);

    for (const parent of parents) {
      const parentDocId = randomUUID();
      parentDocuments.push(
        new Document({
          pageContent: parent.pageContent,
          metadata: {
            ...parent.metadata,
            parent_doc_id: parentDocId,
            doc_type: document.metadata.doc_type ?? "internal_doc",
          },
        }),
      );

      const children = await childSplitter.splitDocuments([
        new Document({
          pageContent: parent.pageContent,
          metadata: {
            ...parent.metadata,
            parent_doc_id: parentDocId,
            doc_type: document.metadata.doc_type ?? "internal_doc",
          },
        }),
      ]);

      childDocuments.push(...children);
    }
  }

  return { parentDocuments, childDocuments };
}

export async function persistParentStore(
  parentDocuments: Document[],
): Promise<void> {
  await mkdir(path.dirname(PARENT_STORE_PATH), { recursive: true });
  await writeFile(
    PARENT_STORE_PATH,
    JSON.stringify(
      parentDocuments.map((doc) => ({
        pageContent: doc.pageContent,
        metadata: doc.metadata,
      })),
      null,
      2,
    ),
    "utf-8",
  );
}

export async function loadParentStore(): Promise<Map<string, Document>> {
  const { readFile } = await import("node:fs/promises");
  const raw = await readFile(PARENT_STORE_PATH, "utf-8");
  const parsed = JSON.parse(raw) as Array<{
    pageContent: string;
    metadata: Record<string, unknown>;
  }>;

  const map = new Map<string, Document>();
  for (const item of parsed) {
    const parentDocId = String(item.metadata.parent_doc_id ?? "");
    if (parentDocId) {
      map.set(parentDocId, new Document(item));
    }
  }

  return map;
}
