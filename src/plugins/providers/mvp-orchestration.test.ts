import { describe, it, expect } from "vitest";
import { runMvpBusinessWorkflow, checkMvpProviderHealth } from "./mvp-orchestration.js";

describe("MVP Business Workflow Orchestration", () => {
  it("should complete full business workflow end-to-end", async () => {
    const result = await runMvpBusinessWorkflow();

    expect(result.loopId).toBeDefined();
    expect(result.leadResults).toBeDefined();
    expect(result.campaignResults).toBeDefined();
    expect(result.revenueAnalysis).toBeDefined();
    expect(result.finalReport).toBeDefined();
  });

  it("should generate leads in workflow", async () => {
    const result = await runMvpBusinessWorkflow();

    expect(result.leadResults.leads).toBeDefined();
    expect(Array.isArray(result.leadResults.leads)).toBe(true);
    expect(result.leadResults.leads.length).toBeGreaterThan(0);
  });

  it("should launch sales campaigns from generated leads", async () => {
    const result = await runMvpBusinessWorkflow();

    expect(result.campaignResults.campaignId).toBeDefined();
    expect(result.campaignResults.messagesSent).toBeGreaterThan(0);
  });

  it("should analyze revenue impact", async () => {
    const result = await runMvpBusinessWorkflow();

    expect(result.revenueAnalysis.metrics.mrr).toBeGreaterThan(0);
    expect(result.revenueAnalysis.metrics.arr).toBeGreaterThan(0);
    expect(result.revenueAnalysis.bottlenecks.length).toBeGreaterThan(0);
  });

  it("should orchestrate complete business loop", async () => {
    const result = await runMvpBusinessWorkflow();

    expect(result.finalReport.loopId).toBeDefined();
    expect(result.finalReport.completions).toBeGreaterThan(0);
    expect(result.finalReport.learnings.length).toBeGreaterThan(0);
  });

  it("should track goal progress through workflow", async () => {
    const result = await runMvpBusinessWorkflow();

    expect(Object.keys(result.finalReport.goalProgress).length).toBeGreaterThan(0);
  });

  it("should provide business insights from workflow", async () => {
    const result = await runMvpBusinessWorkflow();

    expect(result.finalReport.learnings).toBeDefined();
    expect(Array.isArray(result.finalReport.learnings)).toBe(true);
    expect(result.finalReport.learnings.length).toBeGreaterThan(0);
  });
});

describe("MVP Provider Health Check", () => {
  it("should verify all 4 providers are operational", async () => {
    const health = await checkMvpProviderHealth();

    expect(Object.keys(health).length).toBe(4);
    expect(health["Lead Generation"]).toBeDefined();
    expect(health["Sales Automation"]).toBeDefined();
    expect(health["Revenue Optimization"]).toBeDefined();
    expect(health["Business Loop"]).toBeDefined();
  });

  it("should have correct provider metadata", async () => {
    const health = await checkMvpProviderHealth();

    Object.values(health).forEach((provider) => {
      expect(provider.id).toBeDefined();
      expect(provider.label).toBeDefined();
      expect(Array.isArray(provider.capabilities)).toBe(true);
      expect(provider.capabilities.length).toBeGreaterThan(0);
    });
  });

  it("should confirm lead generation capabilities", async () => {
    const health = await checkMvpProviderHealth();
    const leadGen = health["Lead Generation"];

    expect(leadGen.capabilities).toContain("email-finder");
  });

  it("should confirm sales automation capabilities", async () => {
    const health = await checkMvpProviderHealth();
    const sales = health["Sales Automation"];

    expect(sales.capabilities).toContain("cold-email");
  });

  it("should confirm revenue optimization capabilities", async () => {
    const health = await checkMvpProviderHealth();
    const revenue = health["Revenue Optimization"];

    expect(revenue.capabilities).toContain("metric-analysis");
  });

  it("should confirm business loop capabilities", async () => {
    const health = await checkMvpProviderHealth();
    const loop = health["Business Loop"];

    expect(loop.capabilities).toContain("goal-management");
  });
});
