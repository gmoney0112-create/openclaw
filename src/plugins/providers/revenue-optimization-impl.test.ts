import { describe, it, expect, beforeEach } from "vitest";
import { createMvpRevenueOptimizationProvider } from "./revenue-optimization-impl.js";

describe("MVP Revenue Optimization Provider", () => {
  let provider: ReturnType<typeof createMvpRevenueOptimizationProvider>;

  beforeEach(() => {
    provider = createMvpRevenueOptimizationProvider();
  });

  it("should have correct metadata", () => {
    expect(provider.id).toBe("revenue-optimization-mvp-ref");
    expect(provider.label).toContain("Revenue Optimization");
    expect(provider.capabilities).toContain("metric-analysis");
  });

  it("should analyze revenue with complete metrics", async () => {
    const result = await provider.analyzeRevenue({
      metrics: ["mrr", "arr", "ltv", "cac"],
      includeForecasts: true,
    });

    expect(result.metrics.mrr).toBeGreaterThan(0);
    expect(result.metrics.arr).toBeGreaterThan(0);
    expect(result.metrics.ltv).toBeGreaterThan(0);
    expect(result.metrics.cac).toBeGreaterThan(0);
  });

  it("should provide revenue trends", async () => {
    const result = await provider.analyzeRevenue({});

    expect(result.trends).toBeDefined();
    expect(Array.isArray(result.trends)).toBe(true);
    expect(result.trends.length).toBeGreaterThan(0);

    result.trends.forEach((trend) => {
      expect(trend.metric).toBeDefined();
      expect(["up", "down", "stable"]).toContain(trend.trend);
      expect(trend.confidence).toBeGreaterThanOrEqual(0);
      expect(trend.confidence).toBeLessThanOrEqual(1);
    });
  });

  it("should identify revenue bottlenecks", async () => {
    const result = await provider.analyzeRevenue({
      includeBottlenecks: true,
    });

    expect(result.bottlenecks).toBeDefined();
    expect(Array.isArray(result.bottlenecks)).toBe(true);

    result.bottlenecks.forEach((bottleneck) => {
      expect(bottleneck.issue).toBeDefined();
      expect(["low", "medium", "high"]).toContain(bottleneck.severity);
      expect(bottleneck.recommendations).toBeDefined();
      expect(Array.isArray(bottleneck.recommendations)).toBe(true);
    });
  });

  it("should provide revenue forecasts", async () => {
    const result = await provider.analyzeRevenue({
      includeForecasts: true,
    });

    expect(result.forecast).toBeDefined();
    expect(result.forecast?.projectedMRR).toBeGreaterThan(0);
    expect(result.forecast?.projectedARR).toBeGreaterThan(0);
    expect(result.forecast?.timeframe).toBeGreaterThan(0);
  });

  it("should forecast revenue for multiple months", async () => {
    const metrics = {
      mrr: 45000,
      arr: 540000,
      ltv: 8500,
      cac: 1200,
      churn: 0.05,
    };

    const forecast = await provider.forecastRevenue(metrics, 90);

    expect(forecast.projected.mrr).toBeDefined();
    expect(forecast.confidence).toBeGreaterThanOrEqual(0);
    expect(forecast.confidence).toBeLessThanOrEqual(1);

    // Revenue should grow over time with forecasts
    if (metrics.mrr && forecast.projected.mrr) {
      expect(forecast.projected.mrr).toBeGreaterThanOrEqual(metrics.mrr * 0.9);
    }
  });

  it("should identify business bottlenecks", async () => {
    const bottlenecks = await provider.identifyBottlenecks({
      metrics: ["mrr", "arr"],
    });

    expect(Array.isArray(bottlenecks)).toBe(true);
    expect(bottlenecks.length).toBeGreaterThan(0);

    bottlenecks.forEach((b) => {
      expect(b.issue).toBeDefined();
      expect(b.severity).toBeDefined();
      expect(b.recommendations).toBeDefined();
    });
  });

  it("should recommend pricing adjustments", async () => {
    const recommendation = await provider.recommendPricing(99, {});

    expect(recommendation.recommendedPrice).toBeGreaterThan(0);
    expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
    expect(recommendation.confidence).toBeLessThanOrEqual(1);
    expect(recommendation.rationale).toBeDefined();
  });

  it("should analyze price impact on conversion", async () => {
    const recommendation = await provider.recommendPricing(99, {});

    expect(recommendation.expectedImpact).toBeDefined();
    expect(recommendation.expectedImpact?.conversionChange).toBeDefined();
    expect(recommendation.expectedImpact?.revenueChange).toBeDefined();
  });

  it("should provide cost optimization suggestions", async () => {
    const result = await provider.optimizeCosts(100000, {});

    expect(result.optimizations).toBeDefined();
    expect(Array.isArray(result.optimizations)).toBe(true);
    expect(result.optimizations.length).toBeGreaterThan(0);
    expect(result.estimatedSavings).toBeGreaterThan(0);
    expect(result.estimatedSavings).toBeLessThanOrEqual(100000);
  });

  it("should provide optimization opportunities", async () => {
    const result = await provider.analyzeRevenue({});

    expect(result.optimizationOpportunities).toBeDefined();
    expect(Array.isArray(result.optimizationOpportunities)).toBe(true);
  });

  it("should provide actionable recommendations", async () => {
    const result = await provider.analyzeRevenue({});

    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("should calculate CAC to LTV ratio", async () => {
    const result = await provider.analyzeRevenue({});

    if (result.metrics.cac && result.metrics.ltv) {
      const ratio = result.metrics.cac / result.metrics.ltv;
      expect(ratio).toBeGreaterThan(0);
      expect(ratio).toBeLessThan(1); // Healthy ratio
    }
  });

  it("should identify churn issues", async () => {
    const result = await provider.analyzeRevenue({});

    if (result.metrics.churn) {
      expect(result.metrics.churn).toBeGreaterThanOrEqual(0);
      expect(result.metrics.churn).toBeLessThanOrEqual(1);
    }
  });

  it("should return timestamp for all results", async () => {
    const result = await provider.analyzeRevenue({});

    expect(result.timestamp).toBeGreaterThan(0);
    expect(result.timestamp).toBeLessThanOrEqual(Date.now());
  });
});
