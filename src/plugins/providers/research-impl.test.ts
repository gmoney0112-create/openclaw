import { describe, it, expect } from "vitest";
import { createMvpResearchProvider } from "./research-impl.js";

describe("Research Provider", () => {
  const provider = createMvpResearchProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("research-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP Research (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("market-research");
    expect(provider.capabilities).toContain("competitor-analysis");
    expect(provider.capabilities).toContain("trend-analysis");
  });

  it("should perform research query", async () => {
    const result = await provider.research({
      topic: "AI in Business",
      depth: "comprehensive",
    });

    expect(result.query).toBeDefined();
    expect(result.findings).toBeDefined();
  });

  it("should return array of findings", async () => {
    const result = await provider.research({
      topic: "Machine Learning",
      depth: "detailed",
    });

    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it("should include finding source", async () => {
    const result = await provider.research({
      topic: "Data Science",
      depth: "comprehensive",
    });

    result.findings.forEach((finding) => {
      expect(finding.source).toBeDefined();
      expect(typeof finding.source).toBe("string");
    });
  });

  it("should include finding title", async () => {
    const result = await provider.research({
      topic: "Technology Trends",
      depth: "detailed",
    });

    result.findings.forEach((finding) => {
      expect(finding.title).toBeDefined();
      expect(typeof finding.title).toBe("string");
    });
  });

  it("should include finding summary", async () => {
    const result = await provider.research({
      topic: "Market Analysis",
      depth: "comprehensive",
    });

    result.findings.forEach((finding) => {
      expect(finding.summary).toBeDefined();
      expect(finding.summary).toContain("research findings");
    });
  });

  it("should include confidence score", async () => {
    const result = await provider.research({
      topic: "Competitive Analysis",
      depth: "detailed",
    });

    result.findings.forEach((finding) => {
      expect(finding.confidence).toBeGreaterThanOrEqual(0);
      expect(finding.confidence).toBeLessThanOrEqual(1);
    });
  });

  it("should include URL for findings", async () => {
    const result = await provider.research({
      topic: "Industry Research",
      depth: "comprehensive",
    });

    result.findings.forEach((finding) => {
      expect(finding.url).toContain("https://");
    });
  });

  it("should include timestamp", async () => {
    const result = await provider.research({
      topic: "Current Trends",
      depth: "detailed",
    });

    expect(result.timestamp).toBeGreaterThan(0);
  });

  it("should provide analysis summary", async () => {
    const result = await provider.research({
      topic: "Strategic Analysis",
      depth: "comprehensive",
    });

    expect(result.analysis).toBeDefined();
    expect(typeof result.analysis).toBe("string");
  });

  it("should preserve query in result", async () => {
    const query = { topic: "Test Topic", depth: "detailed" as const };
    const result = await provider.research(query);

    expect(result.query).toEqual(query);
  });

  it("should include research timestamp", async () => {
    const beforeTime = Date.now();
    const result = await provider.research({
      topic: "Time Test",
      depth: "comprehensive",
    });
    const afterTime = Date.now();

    expect(result.timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(result.timestamp).toBeLessThanOrEqual(afterTime + 100);
  });
});
