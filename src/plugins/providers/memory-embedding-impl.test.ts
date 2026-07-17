import { describe, it, expect } from "vitest";
import { createMvpMemoryEmbeddingProvider } from "./memory-embedding-impl.js";

describe("Memory Embedding Provider", () => {
  const provider = createMvpMemoryEmbeddingProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("memory-embedding-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP Memory Embedding (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("text-embedding");
    expect(provider.capabilities).toContain("semantic-search");
  });

  it("should embed text into vector", async () => {
    const result = await provider.embedText("Machine learning is fascinating");

    expect(result.embedding).toBeDefined();
    expect(Array.isArray(result.embedding)).toBe(true);
  });

  it("should produce 384-dimensional embeddings", async () => {
    const result = await provider.embedText("Test embedding");

    expect(result.embedding.length).toBe(384);
  });

  it("should produce numeric embeddings", async () => {
    const result = await provider.embedText("Numeric test");

    result.embedding.forEach((value) => {
      expect(typeof value).toBe("number");
    });
  });

  it("should perform semantic similarity search", async () => {
    const results = await provider.semanticSearch("AI and machine learning", 5);

    expect(results.results).toBeDefined();
    expect(Array.isArray(results.results)).toBe(true);
  });

  it("should return requested number of results", async () => {
    const k = 3;
    const results = await provider.semanticSearch("technology", k);

    expect(results.results.length).toBeLessThanOrEqual(k);
  });

  it("should include similarity scores in results", async () => {
    const results = await provider.semanticSearch("business", 5);

    results.results.forEach((result) => {
      expect(result.similarity).toBeGreaterThanOrEqual(0);
      expect(result.similarity).toBeLessThanOrEqual(1);
    });
  });

  it("should include text in search results", async () => {
    const results = await provider.semanticSearch("innovation", 3);

    results.results.forEach((result) => {
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe("string");
    });
  });

  it("should include metadata in search results", async () => {
    const results = await provider.semanticSearch("strategy", 2);

    results.results.forEach((result) => {
      expect(result.metadata).toBeDefined();
    });
  });

  it("should store embeddings in memory", async () => {
    const embedding1 = await provider.embedText("First text");

    expect(embedding1.embedding).toBeDefined();
  });

  it("should produce different embeddings for different texts", async () => {
    const emb1 = await provider.embedText("The sun is bright");
    const emb2 = await provider.embedText("The moon is dark");

    expect(emb1.embedding).not.toEqual(emb2.embedding);
  });

  it("should rank results by similarity", async () => {
    const results = await provider.semanticSearch("search query", 5);

    if (results.results.length > 1) {
      for (let i = 0; i < results.results.length - 1; i++) {
        expect(results.results[i].similarity).toBeGreaterThanOrEqual(
          results.results[i + 1].similarity,
        );
      }
    }
  });

  it("should handle empty search queries", async () => {
    const results = await provider.semanticSearch("", 1);

    expect(results.results).toBeDefined();
    expect(Array.isArray(results.results)).toBe(true);
  });

  it("should handle large k values", async () => {
    const results = await provider.semanticSearch("test", 1000);

    expect(results.results).toBeDefined();
  });
});
