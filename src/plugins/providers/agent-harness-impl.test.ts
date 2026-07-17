import { describe, it, expect } from "vitest";
import { createMvpAgentHarnessProvider } from "./agent-harness-impl.js";

describe("Agent Harness Provider", () => {
  const provider = createMvpAgentHarnessProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("agent-harness-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP Agent Harness (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("agent-execution");
    expect(provider.capabilities).toContain("session-management");
  });

  it("should create agent session", async () => {
    const result = await provider.createSession({});

    expect(result.sessionId).toBeDefined();
    expect(result.sessionFile).toBeDefined();
    expect(result.state).toBe("ready");
  });

  it("should create unique session IDs", async () => {
    const session1 = await provider.createSession({});
    const session2 = await provider.createSession({});

    expect(session1.sessionId).not.toBe(session2.sessionId);
  });

  it("should create session files", async () => {
    const result = await provider.createSession({});

    expect(result.sessionFile).toContain("/tmp/sessions/");
    expect(result.sessionFile).toContain(".json");
  });

  it("should run compact agent execution", async () => {
    const result = await provider.runCompact({});

    expect(result.done).toBe(true);
    expect(result.results).toBeDefined();
  });

  it("should return agent results", async () => {
    const result = await provider.runCompact({});

    expect(Array.isArray(result.results)).toBe(true);
    expect(result.results.length).toBeGreaterThan(0);
  });

  it("should track tokens used in execution", async () => {
    const result = await provider.runCompact({});

    const textResult = result.results.find((r) => r.type === "text");
    expect(textResult).toBeDefined();
    if (textResult && "tokensUsed" in textResult) {
      expect(textResult.tokensUsed).toBeGreaterThan(0);
    }
  });

  it("should include response text in results", async () => {
    const result = await provider.runCompact({});

    const textResult = result.results.find((r) => r.type === "text");
    expect(textResult).toBeDefined();
    if (textResult && "text" in textResult) {
      expect(typeof textResult.text).toBe("string");
    }
  });

  it("should reset agent session", async () => {
    const result = await provider.reset({});

    expect(result).toBeUndefined();
  });

  it("should set session state to ready after creation", async () => {
    const result = await provider.createSession({});

    expect(result.state).toBe("ready");
  });

  it("should handle multiple executions", async () => {
    const exec1 = await provider.runCompact({});
    const exec2 = await provider.runCompact({});

    expect(exec1.done).toBe(true);
    expect(exec2.done).toBe(true);
  });

  it("should maintain session isolation", async () => {
    const session1 = await provider.createSession({});
    const session2 = await provider.createSession({});

    expect(session1.sessionId).not.toBe(session2.sessionId);
    expect(session1.sessionFile).not.toBe(session2.sessionFile);
  });
});
