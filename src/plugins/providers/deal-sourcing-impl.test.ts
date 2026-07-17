import { describe, it, expect } from "vitest";
import { createMvpDealSourcingProvider } from "./deal-sourcing-impl.js";

describe("Deal Sourcing Provider", () => {
  const provider = createMvpDealSourcingProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("deal-sourcing-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP Deal Sourcing (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("saas-deals");
    expect(provider.capabilities).toContain("business-acquisition");
  });

  it("should source deals by criteria", async () => {
    const result = await provider.sourceDeal({
      type: "saas",
      minValue: 1000000,
      maxValue: 10000000,
    });

    expect(result.deals).toBeDefined();
    expect(Array.isArray(result.deals)).toBe(true);
  });

  it("should return deals matching type", async () => {
    const result = await provider.sourceDeal({
      type: "saas",
    });

    result.deals.forEach((deal) => {
      expect(deal.type).toBe("saas");
    });
  });

  it("should include deal valuation", async () => {
    const result = await provider.sourceDeal({
      type: "business-acquisition",
    });

    result.deals.forEach((deal) => {
      expect(deal.valuation).toBeGreaterThan(0);
    });
  });

  it("should include profit potential", async () => {
    const result = await provider.sourceDeal({
      type: "saas",
    });

    result.deals.forEach((deal) => {
      expect(deal.profitPotential).toBeGreaterThanOrEqual(0);
    });
  });

  it("should provide competition level", async () => {
    const result = await provider.sourceDeal({
      type: "saas",
    });

    const validLevels = ["low", "medium", "high"];
    result.deals.forEach((deal) => {
      expect(validLevels).toContain(deal.competitionLevel);
    });
  });

  it("should include confidence score", async () => {
    const result = await provider.sourceDeal({
      type: "saas",
    });

    result.deals.forEach((deal) => {
      expect(deal.confidence).toBeGreaterThan(0);
      expect(deal.confidence).toBeLessThanOrEqual(1);
    });
  });

  it("should include deal URL", async () => {
    const result = await provider.sourceDeal({
      type: "business-acquisition",
    });

    result.deals.forEach((deal) => {
      expect(deal.url).toContain("https://");
    });
  });

  it("should include metadata with growth rate", async () => {
    const result = await provider.sourceDeal({
      type: "saas",
    });

    result.deals.forEach((deal) => {
      expect(deal.metadata).toBeDefined();
      expect(deal.metadata.growthRate).toBeDefined();
    });
  });

  it("should include churn rate in metadata", async () => {
    const result = await provider.sourceDeal({
      type: "saas",
    });

    result.deals.forEach((deal) => {
      expect(deal.metadata.churn).toBeGreaterThanOrEqual(0);
      expect(deal.metadata.churn).toBeLessThanOrEqual(1);
    });
  });

  it("should return total found count", async () => {
    const result = await provider.sourceDeal({
      type: "saas",
    });

    expect(result.totalFound).toBeGreaterThanOrEqual(result.deals.length);
  });

  it("should provide analysis", async () => {
    const result = await provider.sourceDeal({
      type: "saas",
    });

    expect(result.analysis).toBeDefined();
    expect(typeof result.analysis).toBe("string");
  });

  it("should provide recommendations", async () => {
    const result = await provider.sourceDeal({
      type: "business-acquisition",
    });

    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("should include discovery timestamp", async () => {
    const result = await provider.sourceDeal({
      type: "saas",
    });

    result.deals.forEach((deal) => {
      expect(deal.discoveredAt).toBeGreaterThan(0);
    });
  });
});
