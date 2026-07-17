import { describe, it, expect } from "vitest";
import { createMvpMemoryEmbeddingProvider } from "./memory-embedding-impl.js";

describe("Memory Embedding Provider", () => {
  const provider = createMvpMemoryEmbeddingProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("memory-embedding-mvp-ref");
  });

  it("should have correct model", () => {
    expect(provider.model).toBe("text-embedding-3-small");
  });

  it("should embed single query text", async () => {
    const result = await provider.embedQuery("Machine learning is fascinating");

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should produce 384-dimensional embeddings", async () => {
    const result = await provider.embedQuery("Test embedding");

    expect(result.length).toBe(384);
  });

  it("should produce numeric embeddings", async () => {
    const result = await provider.embedQuery("Numeric test");

    result.forEach((value) => {
      expect(typeof value).toBe("number");
    });
  });

  it("should embed batch of texts", async () => {
    const texts = ["First text", "Second text", "Third text"];
    const results = await provider.embedBatch(texts);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(3);
  });

  it("should return correct number of embeddings in batch", async () => {
    const texts = ["Text 1", "Text 2"];
    const results = await provider.embedBatch(texts);

    expect(results.length).toBe(texts.length);
  });

  it("should produce embeddings for each batch item", async () => {
    const texts = ["A", "B", "C"];
    const results = await provider.embedBatch(texts);

    results.forEach((embedding) => {
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(384);
    });
  });

  it("should produce different embeddings for different texts", async () => {
    const emb1 = await provider.embedQuery("The sun is bright");
    const emb2 = await provider.embedQuery("The moon is dark");

    expect(emb1).not.toEqual(emb2);
  });

  it("should handle empty batch", async () => {
    const results = await provider.embedBatch([]);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it("should handle large batch", async () => {
    const texts = Array.from({ length: 100 }, (_, i) => `Text ${i}`);
    const results = await provider.embedBatch(texts);

    expect(results.length).toBe(100);
  });

  it("should produce consistent embeddings for same input", async () => {
    const text = "Consistent text";
    const emb1 = await provider.embedQuery(text);
    const emb2 = await provider.embedQuery(text);

    expect(emb1).toEqual(emb2);
  });

  it("should work with special characters", async () => {
    const result = await provider.embedQuery("Special chars: !@#$%^&*()");

    expect(result.length).toBe(384);
  });

  it("should batch embed produce numeric values", async () => {
    const texts = ["Text 1", "Text 2"];
    const results = await provider.embedBatch(texts);

    results.forEach((embedding) => {
      embedding.forEach((value) => {
        expect(typeof value).toBe("number");
      });
    });
  });
});
