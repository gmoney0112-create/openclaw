import { describe, it, expect } from "vitest";
import { createMvpMusicGenerationProvider } from "./music-generation-impl.js";

describe("Music Generation Provider", () => {
  const provider = createMvpMusicGenerationProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("music-gen-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP Music Generation (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("background-music");
    expect(provider.capabilities).toContain("audio-generation");
  });

  it("should generate music from request", async () => {
    const result = await provider.generateMusic({
      genre: "ambient",
      mood: "calm",
      tempo: 100,
      durationSeconds: 180,
    });

    expect(result.assets).toBeDefined();
    expect(result.assets.length).toBeGreaterThan(0);
    expect(result.assets[0].type).toBe("audio");
  });

  it("should use provided genre", async () => {
    const result = await provider.generateMusic({
      genre: "jazz",
      mood: "upbeat",
      tempo: 120,
    });

    expect(result.assets[0].metadata.genre).toBe("jazz");
  });

  it("should use provided mood", async () => {
    const result = await provider.generateMusic({
      genre: "electronic",
      mood: "energetic",
      tempo: 140,
    });

    expect(result.assets[0].metadata.mood).toBe("energetic");
  });

  it("should use provided tempo", async () => {
    const result = await provider.generateMusic({
      genre: "pop",
      mood: "happy",
      tempo: 130,
    });

    expect(result.assets[0].metadata.tempo).toBe(130);
  });

  it("should use custom duration when provided", async () => {
    const duration = 240;
    const result = await provider.generateMusic({
      genre: "classical",
      mood: "peaceful",
      tempo: 60,
      durationSeconds: duration,
    });

    expect(result.assets[0].duration).toBe(duration);
  });

  it("should use default duration when not provided", async () => {
    const result = await provider.generateMusic({
      genre: "rock",
      mood: "intense",
      tempo: 150,
    });

    expect(result.assets[0].duration).toBe(180);
  });

  it("should generate MP3 format", async () => {
    const result = await provider.generateMusic({
      genre: "indie",
      mood: "melancholic",
      tempo: 90,
    });

    expect(result.assets[0].format).toBe("mp3");
  });

  it("should include bitrate in audio asset", async () => {
    const result = await provider.generateMusic({
      genre: "hip-hop",
      mood: "aggressive",
      tempo: 110,
    });

    expect(result.assets[0].bitrate).toBe("320k");
  });

  it("should set status to completed", async () => {
    const result = await provider.generateMusic({
      genre: "folk",
      mood: "acoustic",
      tempo: 80,
    });

    expect(result.assets[0].status).toBe("completed");
  });

  it("should create unique music IDs", async () => {
    const result1 = await provider.generateMusic({ genre: "pop", mood: "happy", tempo: 120 });
    const result2 = await provider.generateMusic({ genre: "pop", mood: "happy", tempo: 120 });

    expect(result1.assets[0].id).not.toBe(result2.assets[0].id);
  });

  it("should include valid URL", async () => {
    const result = await provider.generateMusic({
      genre: "ambient",
      mood: "relaxing",
      tempo: 70,
    });

    expect(result.assets[0].url).toContain("https://");
    expect(result.assets[0].url).toContain(".mp3");
  });

  it("should record creation timestamp", async () => {
    const result = await provider.generateMusic({
      genre: "electronic",
      mood: "uplifting",
      tempo: 130,
    });

    expect(result.assets[0].createdAt).toBeGreaterThan(0);
  });
});
