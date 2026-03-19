import { describe, expect, it } from "vitest";
import { guardOutputToolCall } from "./output-guard.js";

describe("output guard", () => {
  it("blocks dangerous payloads", () => {
    expect(
      guardOutputToolCall({
        toolName: "exec",
        args: { command: "eval(alert(1))" },
        schema: { type: "object", properties: { command: { type: "string" } } },
      }),
    ).toEqual({
      valid: false,
      reason: "dangerous_payload",
    });
  });

  it("blocks invalid schema arguments", () => {
    const result = guardOutputToolCall({
      toolName: "read",
      args: {},
      schema: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
        additionalProperties: false,
      },
    });
    expect(result.valid).toBe(false);
  });

  it("allows valid tool calls", () => {
    expect(
      guardOutputToolCall({
        toolName: "read",
        args: { path: "/tmp/file.txt" },
        schema: {
          type: "object",
          properties: { path: { type: "string" } },
          required: ["path"],
          additionalProperties: false,
        },
      }),
    ).toEqual({ valid: true });
  });
});
