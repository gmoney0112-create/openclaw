// MVP Implementation: Memory Embedding Provider
import type { MemoryEmbeddingProvider } from "../plugin-sdk/memory-core-host-engine-embeddings.js";

export const createMvpMemoryEmbeddingProvider = (): MemoryEmbeddingProvider => {
  return {
    id: "memory-embedding-mvp-ref",
    model: "text-embedding-3-small",

    embedQuery: async (text: string) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const hash = text.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      return Array.from({ length: 384 }, (_, i) => Math.sin((hash + i) * 0.001));
    },

    embedBatch: async (texts: string[]) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return texts.map((text) => {
        const hash = text.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        return Array.from({ length: 384 }, (_, i) => Math.sin((hash + i) * 0.001));
      });
    },
  };
};
