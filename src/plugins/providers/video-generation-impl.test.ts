import { describe, it, expect } from "vitest";
import { createMvpVideoGenerationProvider } from "./video-generation-impl.js";

describe("Video Generation Provider", () => {
  const provider = createMvpVideoGenerationProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("video-gen-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP Video Generation (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("text-to-video");
    expect(provider.capabilities).toContain("script-generation");
  });

  it("should generate video from request", async () => {
    const result = await provider.generateVideo({
      prompt: "A business meeting discussion",
      durationSeconds: 120,
      style: "professional",
    });

    expect(result.assets).toBeDefined();
    expect(result.assets.length).toBeGreaterThan(0);
    expect(result.assets[0].type).toBe("video");
    expect(result.assets[0].format).toBe("mp4");
  });

  it("should include video metadata", async () => {
    const result = await provider.generateVideo({
      prompt: "Product demo video",
      durationSeconds: 60,
    });

    const asset = result.assets[0];
    expect(asset.metadata).toBeDefined();
    expect(asset.metadata?.prompt).toBeDefined();
    expect(asset.metadata?.model).toBeDefined();
  });

  it("should generate script from topic", async () => {
    const result = await provider.generateScript("AI in Business", "professional");

    expect(result.script).toBeDefined();
    expect(result.script).toContain("SCENE");
    expect(result.script).toContain("NARRATION");
    expect(result.duration).toBeGreaterThan(0);
    expect(result.scenes).toBeGreaterThan(0);
  });

  it("should include tone in script generation", async () => {
    const result = await provider.generateScript("Marketing Strategy", "casual");

    expect(result.tone).toBe("casual");
  });

  it("should create unique video IDs", async () => {
    const result1 = await provider.generateVideo({ prompt: "Video 1" });
    const result2 = await provider.generateVideo({ prompt: "Video 2" });

    expect(result1.assets[0].id).not.toBe(result2.assets[0].id);
  });

  it("should include video URL in asset", async () => {
    const result = await provider.generateVideo({ prompt: "Test video" });

    expect(result.assets[0].url).toContain("https://");
    expect(result.assets[0].url).toContain(".mp4");
  });

  it("should include thumbnail URL", async () => {
    const result = await provider.generateVideo({ prompt: "Video with thumbnail" });

    expect(result.assets[0].thumbnail).toContain("https://");
    expect(result.assets[0].thumbnail).toContain("-thumb.jpg");
  });

  it("should set video status to completed", async () => {
    const result = await provider.generateVideo({ prompt: "Test video" });

    expect(result.assets[0].status).toBe("completed");
  });

  it("should use custom duration when provided", async () => {
    const customDuration = 180;
    const result = await provider.generateVideo({
      prompt: "Long video",
      durationSeconds: customDuration,
    });

    expect(result.assets[0].duration).toBe(customDuration);
  });

  it("should use default duration when not provided", async () => {
    const result = await provider.generateVideo({ prompt: "Default duration" });

    expect(result.assets[0].duration).toBe(60);
  });

  it("should include creation timestamp", async () => {
    const result = await provider.generateVideo({ prompt: "Timestamped video" });

    expect(result.assets[0].createdAt).toBeGreaterThan(0);
  });
});
