import { describe, it, expect } from "vitest";
import { createMvpVoiceInterfaceProvider } from "./voice-impl.js";

describe("Voice Interface Provider", () => {
  const provider = createMvpVoiceInterfaceProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("voice-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP Voice Interface (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("speech-recognition");
    expect(provider.capabilities).toContain("text-to-speech");
  });

  it("should start listening", async () => {
    const sessionId = await provider.startListening();

    expect(typeof sessionId).toBe("string");
    expect(sessionId.length).toBeGreaterThan(0);
  });

  it("should generate unique session IDs", async () => {
    const sessionId1 = await provider.startListening();
    const sessionId2 = await provider.startListening();

    expect(sessionId1).not.toBe(sessionId2);
  });

  it("should accept optional session ID", async () => {
    const providedId = "custom-session-123";
    const sessionId = await provider.startListening(providedId);

    expect(sessionId).toBe(providedId);
  });

  it("should stop listening and return transcript", async () => {
    const sessionId = await provider.startListening();
    const result = await provider.stopListening(sessionId);

    expect(result.transcript).toBeDefined();
    expect(typeof result.transcript).toBe("string");
  });

  it("should include confidence in transcript", async () => {
    const sessionId = await provider.startListening();
    const result = await provider.stopListening(sessionId);

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("should speak text", async () => {
    const sessionId = await provider.startListening();
    await provider.speak(sessionId, "Hello world");

    const session = await provider.getSession(sessionId);
    expect(session).toBeDefined();
  });

  it("should handle multi-word text for speaking", async () => {
    const sessionId = await provider.startListening();
    const longText = "This is a longer message with multiple words";
    await provider.speak(sessionId, longText);

    const session = await provider.getSession(sessionId);
    expect(session).toBeDefined();
  });

  it("should get session state", async () => {
    const sessionId = await provider.startListening();
    const session = await provider.getSession(sessionId);

    expect(session.isListening).toBe(true);
    expect(session.isSpeaking).toBe(false);
  });

  it("should set language for session", async () => {
    const sessionId = await provider.startListening();
    const result = await provider.setLanguage(sessionId, "es");

    expect(result).toBe(true);
  });

  it("should return false for non-existent session", async () => {
    const result = await provider.stopListening("non-existent-session");

    expect(result.transcript).toBe("");
    expect(result.confidence).toBe(0);
  });

  it("should return default session for non-existent ID", async () => {
    const session = await provider.getSession("non-existent");

    expect(session.isListening).toBe(false);
    expect(session.isSpeaking).toBe(false);
    expect(session.transcript).toBe("");
  });

  it("should maintain session state across operations", async () => {
    const sessionId = await provider.startListening();
    await provider.speak(sessionId, "test message");
    const session = await provider.getSession(sessionId);

    expect(session).toBeDefined();
  });

  it("should handle multiple concurrent sessions", async () => {
    const session1 = await provider.startListening();
    const session2 = await provider.startListening();
    const session3 = await provider.startListening();

    expect(session1).not.toBe(session2);
    expect(session2).not.toBe(session3);
  });
});
