import { describe, it, expect } from "vitest";
import { createMvpGrowthHackingProvider } from "./growth-hacking-impl.js";

describe("Growth Hacking Provider", () => {
  const provider = createMvpGrowthHackingProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("growth-hacking-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP Growth Hacking (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("viral-posting");
    expect(provider.capabilities).toContain("engagement-automation");
    expect(provider.capabilities).toContain("trend-monitoring");
  });

  it("should generate growth content", async () => {
    const config = {
      channels: ["twitter", "linkedin"],
      strategies: ["engagement"],
      dailyPostsPerChannel: 1,
    };

    const content = await provider.generateContent(config);

    expect(Array.isArray(content)).toBe(true);
    expect(content.length).toBeGreaterThan(0);
  });

  it("should generate content per channel", async () => {
    const config = {
      channels: ["twitter", "instagram", "tiktok"],
      strategies: ["viral-content"],
      dailyPostsPerChannel: 2,
    };

    const content = await provider.generateContent(config);

    expect(content.length).toBe(6); // 3 channels * 2 posts
  });

  it("should include channel in content", async () => {
    const config = {
      channels: ["twitter"],
      strategies: ["engagement"],
    };

    const content = await provider.generateContent(config);

    content.forEach((c) => {
      expect(c.channel).toBe("twitter");
    });
  });

  it("should publish content", async () => {
    const content = {
      id: "test-content",
      channel: "twitter" as const,
      strategy: "engagement" as const,
      content: "Test content",
      hashtags: ["test"],
      status: "draft" as const,
    };

    const result = await provider.publishContent(content);

    expect(result.published).toBe(true);
    expect(result.url).toContain("https://");
  });

  it("should monitor metrics for channels", async () => {
    const channels = ["twitter", "linkedin", "instagram"];
    const metrics = await provider.monitorMetrics(channels);

    expect(metrics.length).toBe(3);
    metrics.forEach((m) => {
      expect(m.followers).toBeGreaterThan(0);
      expect(m.engagement).toBeGreaterThanOrEqual(0);
      expect(m.reach).toBeGreaterThan(0);
    });
  });

  it("should analyze competitors", async () => {
    const competitors = ["competitor1", "competitor2"];
    const analysis = await provider.analyzeCompetitors(competitors);

    expect(analysis.content).toBeDefined();
    expect(analysis.opportunities).toBeDefined();
    expect(Array.isArray(analysis.opportunities)).toBe(true);
  });

  it("should identify trends", async () => {
    const result = await provider.identifyTrends();

    expect(result.trends).toBeDefined();
    expect(Array.isArray(result.trends)).toBe(true);
    expect(result.opportunities).toBeDefined();
    expect(Array.isArray(result.opportunities)).toBe(true);
  });

  it("should run full campaign", async () => {
    const config = {
      channels: ["twitter", "tiktok"],
      strategies: ["viral-content"],
      dailyPostsPerChannel: 1,
    };

    const result = await provider.runCampaign(config);

    expect(result.campaignId).toBeDefined();
    expect(result.contentGenerated).toBeGreaterThan(0);
    expect(result.contentPublished).toBeGreaterThan(0);
  });

  it("should track campaign metrics", async () => {
    const config = {
      channels: ["twitter"],
      strategies: ["engagement"],
    };

    const result = await provider.runCampaign(config);

    expect(result.metrics.length).toBeGreaterThan(0);
    result.metrics.forEach((m) => {
      expect(m.followers).toBeGreaterThan(0);
      expect(m.engagement).toBeGreaterThan(0);
    });
  });

  it("should identify top performing content", async () => {
    const config = {
      channels: ["twitter", "linkedin"],
      strategies: ["viral-content"],
    };

    const result = await provider.runCampaign(config);

    expect(result.topPerformingContent).toBeDefined();
    expect(Array.isArray(result.topPerformingContent)).toBe(true);
  });

  it("should provide campaign recommendations", async () => {
    const config = {
      channels: ["tiktok"],
      strategies: ["engagement"],
    };

    const result = await provider.runCampaign(config);

    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("should include hashtags in content", async () => {
    const config = {
      channels: ["instagram"],
      strategies: ["viral-content"],
    };

    const content = await provider.generateContent(config);

    content.forEach((c) => {
      expect(c.hashtags).toBeDefined();
      expect(Array.isArray(c.hashtags)).toBe(true);
    });
  });
});
