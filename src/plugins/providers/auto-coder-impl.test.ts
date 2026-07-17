import { describe, it, expect } from "vitest";
import { createMvpAutoCoderProvider } from "./auto-coder-impl.js";

describe("Auto-Coder Provider", () => {
  const provider = createMvpAutoCoderProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("auto-coder-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP Auto-Coder (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("bug-detection");
    expect(provider.capabilities).toContain("code-generation");
    expect(provider.capabilities).toContain("refactoring");
  });

  it("should analyze code", async () => {
    const result = await provider.analyzeCode({
      type: "performance",
      code: "example.ts",
    });

    expect(result.type).toBe("performance");
    expect(result.issues).toBeDefined();
  });

  it("should return array of issues", async () => {
    const result = await provider.analyzeCode({
      type: "bug-detection",
      code: "code.ts",
    });

    expect(Array.isArray(result.issues)).toBe(true);
  });

  it("should include issue details", async () => {
    const result = await provider.analyzeCode({
      type: "performance",
      code: "test.ts",
    });

    result.issues.forEach((issue) => {
      expect(issue.id).toBeDefined();
      expect(issue.severity).toBeDefined();
      expect(issue.type).toBeDefined();
      expect(issue.description).toBeDefined();
    });
  });

  it("should provide issue location", async () => {
    const result = await provider.analyzeCode({
      type: "performance",
      code: "app.ts",
    });

    result.issues.forEach((issue) => {
      expect(issue.location).toBeDefined();
      expect(issue.location.file).toBeDefined();
      expect(issue.location.line).toBeGreaterThan(0);
      expect(issue.location.column).toBeGreaterThan(0);
    });
  });

  it("should suggest fixes", async () => {
    const result = await provider.analyzeCode({
      type: "performance",
      code: "code.ts",
    });

    result.issues.forEach((issue) => {
      expect(issue.suggestion).toBeDefined();
    });
  });

  it("should generate fix for issue", async () => {
    const result = await provider.generateFix({
      issueId: "issue-1",
      code: "sample code",
    });

    expect(result.issueId).toBe("issue-1");
    expect(result.patch).toBeDefined();
    expect(result.explanation).toBeDefined();
  });

  it("should include patch content", async () => {
    const result = await provider.generateFix({
      issueId: "test-issue",
      code: "code to fix",
    });

    expect(result.patch).toContain("---");
    expect(result.patch).toContain("+++");
  });

  it("should validate generated patches", async () => {
    const result = await provider.validatePatch({
      patch: "test patch",
      code: "code",
    });

    expect(result.valid).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("should deploy validated patches", async () => {
    const result = await provider.deployPatch({
      patch: "valid patch",
      code: "code",
    });

    expect(result.success).toBe(true);
    expect(result.appliedAt).toBeGreaterThan(0);
  });

  it("should provide summary of analysis", async () => {
    const result = await provider.analyzeCode({
      type: "bug-detection",
      code: "analyze.ts",
    });

    expect(result.summary).toBeDefined();
    expect(typeof result.summary).toBe("string");
  });

  it("should analyze different types of issues", async () => {
    const analysisTypes = ["performance", "security", "readability"] as const;

    for (const type of analysisTypes) {
      const result = await provider.analyzeCode({
        type,
        code: "code.ts",
      });
      expect(result.type).toBe(type);
    }
  });

  it("should include patch explanation", async () => {
    const result = await provider.generateFix({
      issueId: "explained-fix",
      code: "code sample",
    });

    expect(result.explanation).toContain("Optimized");
  });
});
