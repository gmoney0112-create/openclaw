// MVP Implementation: Memory Embedding Provider
import type { MemoryEmbeddingProvider } from "../plugin-sdk/memory-core-host-engine-embeddings.js";

export const createMvpMemoryEmbeddingProvider = (): MemoryEmbeddingProvider => {
  return {
    id: "memory-embedding-mvp-ref",
    label: "MVP Memory Embedding (Reference)",
    capabilities: ["text-embedding", "semantic-search"],

    embedText: async (text: string) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const hash = text.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      return Array.from({ length: 384 }, (_, i) => Math.sin((hash + i) * 0.001));
    },

    searchSimilar: async (embedding: number[], topK?: number) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const limit = topK || 5;
      return Array.from({ length: limit }, (_, i) => ({
        id: `mem-${i}`,
        score: 0.95 - i * 0.1,
        text: `Memory item ${i}`,
      }));
    },
  };
};
