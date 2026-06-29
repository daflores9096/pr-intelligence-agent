import "../config/env.js";
import { indexDocuments } from "../indexing/vectorize.js";

try {
  await indexDocuments();
} catch (error) {
  console.error("Indexing failed:", error);
  process.exit(1);
}
