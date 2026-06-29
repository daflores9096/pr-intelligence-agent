import "../config/env.js";
import { ensurePineconeIndex } from "../config/pinecone.js";

try {
  await ensurePineconeIndex();
} catch (error) {
  console.error("Pinecone setup failed:", error);
  process.exit(1);
}
