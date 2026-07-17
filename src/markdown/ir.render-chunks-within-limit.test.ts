import { describe, expect, it } from "vitest";
import { markdownToIR, renderMarkdownIRChunksWithinLimit } from "./ir.js";

describe("renderMarkdownIRChunksWithinLimit", () => {
  it("keeps a single chunk when the rendered form fits the limit", () => {
    const ir = markdownToIR("hello world");
    const result = renderMarkdownIRChunksWithinLimit({
      ir,
      limit: 100,
      renderChunk: (chunk) => chunk.text,
      measureRendered: (rendered) => rendered.length,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.rendered).toBe("hello world");
  });

  it("re-splits a chunk whose rendered form exceeds the limit even though raw text fits", () => {
    const ir = markdownToIR("aaaaaaaaaa");
    // Rendering expands every character 5x (simulating HTML-escape-style expansion),
    // so a chunk that fits the raw-text limit can still overflow once rendered.
    const result = renderMarkdownIRChunksWithinLimit({
      ir,
      limit: 20,
      renderChunk: (chunk) => "X".repeat(chunk.text.length * 5),
      measureRendered: (rendered) => rendered.length,
    });
    expect(result.length).toBeGreaterThan(1);
    for (const { rendered } of result) {
      expect(rendered.length).toBeLessThanOrEqual(20);
    }
    // Source text must still be fully accounted for across all chunks.
    expect(result.map((r) => r.source.text).join("")).toBe("aaaaaaaaaa");
  });

  it("accepts an irreducible single-character chunk rather than looping forever", () => {
    const ir = markdownToIR("a");
    const result = renderMarkdownIRChunksWithinLimit({
      ir,
      limit: 1,
      renderChunk: () => "way too long to ever fit",
      measureRendered: (rendered) => rendered.length,
    });
    expect(result).toHaveLength(1);
  });
});
