// MVP Implementation: Agent Harness Provider
import type { AgentHarness } from "../plugin-sdk/agent-harness.js";

export const createMvpAgentHarnessProvider = (): AgentHarness => {
  return {
    id: "agent-harness-mvp-ref",
    label: "MVP Agent Harness (Reference)",
    capabilities: ["agent-execution", "session-management"],

    createSession: async (_params) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return {
        sessionId: `session-${Date.now()}`,
        sessionFile: `/tmp/sessions/${Date.now()}.json`,
        state: "ready",
      };
    },

    runCompact: async (_params) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        done: true,
        results: [
          {
            type: "text",
            text: "Agent response generated successfully.",
            tokensUsed: 256,
          },
        ],
      };
    },

    reset: async (_params) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    },
  };
};
