import { describe, it, expect } from "vitest";
import { createMvpTranscriptionProvider } from "./transcription-impl.js";

describe("Transcription Provider", () => {
  const provider = createMvpTranscriptionProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("transcription-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP Transcription (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("speech-to-text");
    expect(provider.capabilities).toContain("real-time-streaming");
  });

  it("should transcribe audio buffer", async () => {
    const audioBuffer = new ArrayBuffer(8);
    const result = await provider.transcribe(audioBuffer);

    expect(result.text).toBeDefined();
    expect(typeof result.text).toBe("string");
  });

  it("should include confidence score", async () => {
    const audioBuffer = new ArrayBuffer(16);
    const result = await provider.transcribe(audioBuffer);

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("should include language in result", async () => {
    const audioBuffer = new ArrayBuffer(32);
    const result = await provider.transcribe(audioBuffer);

    expect(result.language).toBeDefined();
    expect(result.language).toBe("en");
  });

  it("should include duration", async () => {
    const audioBuffer = new ArrayBuffer(64);
    const result = await provider.transcribe(audioBuffer);

    expect(result.duration).toBeGreaterThan(0);
  });

  it("should start live transcription session", async () => {
    const result = await provider.startLiveTranscription();

    expect(result.sessionId).toBeDefined();
    expect(result.status).toBe("active");
  });

  it("should create unique session IDs", async () => {
    const session1 = await provider.startLiveTranscription();
    const session2 = await provider.startLiveTranscription();

    expect(session1.sessionId).not.toBe(session2.sessionId);
  });

  it("should stop live transcription", async () => {
    const startResult = await provider.startLiveTranscription();
    const stopResult = await provider.stopLiveTranscription(startResult.sessionId);

    expect(stopResult.sessionId).toBe(startResult.sessionId);
    expect(stopResult.finalTranscript).toBeDefined();
  });

  it("should include final transcript in stop result", async () => {
    const session = await provider.startLiveTranscription();
    const result = await provider.stopLiveTranscription(session.sessionId);

    expect(result.finalTranscript).toBeDefined();
    expect(typeof result.finalTranscript).toBe("string");
  });

  it("should include word count in transcription", async () => {
    const session = await provider.startLiveTranscription();
    const result = await provider.stopLiveTranscription(session.sessionId);

    expect(result.wordCount).toBeGreaterThanOrEqual(0);
  });

  it("should include duration in transcription result", async () => {
    const session = await provider.startLiveTranscription();
    const result = await provider.stopLiveTranscription(session.sessionId);

    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("should handle multiple concurrent sessions", async () => {
    const session1 = await provider.startLiveTranscription();
    const session2 = await provider.startLiveTranscription();

    expect(session1.sessionId).not.toBe(session2.sessionId);
  });

  it("should return transcript text from transcribe", async () => {
    const audioBuffer = new ArrayBuffer(128);
    const result = await provider.transcribe(audioBuffer);

    expect(result.text.length).toBeGreaterThan(0);
  });
});
