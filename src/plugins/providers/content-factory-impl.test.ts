import { describe, it, expect } from "vitest";
import { createMvpContentFactoryProvider } from "./content-factory-impl.js";

describe("Content Factory Provider", () => {
  const provider = createMvpContentFactoryProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("content-factory-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP Content Factory (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("blog-generation");
    expect(provider.capabilities).toContain("social-content");
    expect(provider.capabilities).toContain("video-scripting");
  });

  it("should generate content from brief", async () => {
    const brief = {
      topic: "Machine Learning",
      audience: "Developers",
      tone: "technical",
    };

    const content = await provider.generateContent(brief);

    expect(content.id).toBeDefined();
    expect(content.title).toContain("Machine Learning");
    expect(content.body).toBeDefined();
  });

  it("should include generated timestamp", async () => {
    const brief = {
      topic: "AI",
      audience: "Business Leaders",
    };

    const content = await provider.generateContent(brief);

    expect(content.generatedAt).toBeGreaterThan(0);
  });

  it("should optimize content for SEO", async () => {
    const content = {
      id: "content-1",
      type: "blog" as const,
      title: "SEO Test",
      body: "Content for SEO optimization",
      generatedAt: Date.now(),
    };

    const seo = await provider.optimizeForSEO(content);

    expect(seo.keywords).toBeDefined();
    expect(Array.isArray(seo.keywords)).toBe(true);
    expect(seo.readability).toBeGreaterThanOrEqual(0);
    expect(seo.score).toBeGreaterThanOrEqual(0);
  });

  it("should include SEO suggestions", async () => {
    const content = {
      id: "content-2",
      type: "blog" as const,
      title: "Test Content",
      body: "Content body",
      generatedAt: Date.now(),
    };

    const seo = await provider.optimizeForSEO(content);

    expect(seo.suggestions).toBeDefined();
    expect(Array.isArray(seo.suggestions)).toBe(true);
  });

  it("should generate content variations", async () => {
    const content = {
      id: "content-3",
      type: "social" as const,
      title: "Original Content",
      body: "Original body",
      generatedAt: Date.now(),
    };

    const variations = await provider.generateVariations(content, 3);

    expect(variations.length).toBe(3);
  });

  it("should maintain parent ID in variations", async () => {
    const content = {
      id: "parent-content",
      type: "blog" as const,
      title: "Parent",
      body: "Body",
      generatedAt: Date.now(),
    };

    const variations = await provider.generateVariations(content, 2);

    variations.forEach((v) => {
      expect(v.parentId).toBe("parent-content");
    });
  });

  it("should schedule posts", async () => {
    const contents = [
      {
        id: "c1",
        type: "social" as const,
        title: "Post 1",
        body: "Content 1",
        generatedAt: Date.now(),
      },
      {
        id: "c2",
        type: "social" as const,
        title: "Post 2",
        body: "Content 2",
        generatedAt: Date.now(),
      },
    ];

    const result = await provider.schedulePosts(contents, { frequency: "daily" });

    expect(result.scheduled).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it("should analyze content performance", async () => {
    const metrics = await provider.analyzePerformance("content-id");

    expect(metrics.views).toBeGreaterThanOrEqual(0);
    expect(metrics.clicks).toBeGreaterThanOrEqual(0);
    expect(metrics.engagement).toBeGreaterThanOrEqual(0);
    expect(metrics.timestamp).toBeGreaterThan(0);
  });

  it("should batch generate content", async () => {
    const briefs = [{ topic: "AI" }, { topic: "Machine Learning" }, { topic: "Deep Learning" }];

    const contents = await provider.batchGenerate(briefs);

    expect(contents.length).toBe(3);
    contents.forEach((c) => {
      expect(c.id).toBeDefined();
      expect(c.generatedAt).toBeGreaterThan(0);
    });
  });

  it("should include hashtags in generated content", async () => {
    const brief = {
      topic: "Social Media Marketing",
      audience: "Marketers",
    };

    const content = await provider.generateContent(brief);

    expect(content.hashtags).toBeDefined();
  });

  it("should set SEO score", async () => {
    const brief = {
      topic: "Content Marketing",
    };

    const content = await provider.generateContent(brief);

    expect(content.seoScore).toBeGreaterThanOrEqual(0);
    expect(content.seoScore).toBeLessThanOrEqual(100);
  });

  it("should handle different content types", async () => {
    const briefBlog = { topic: "Blog Topic", format: "blog" };
    const briefVideo = { topic: "Video Topic", format: "video" };

    const blog = await provider.generateContent(briefBlog);
    const video = await provider.generateContent(briefVideo);

    expect(blog.type).toBe("blog");
    expect(video.type).toBe("video");
  });
});
