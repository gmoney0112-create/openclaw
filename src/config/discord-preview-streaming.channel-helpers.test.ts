import { describe, expect, it } from "vitest";
import {
  resolveChannelPreviewStreamMode,
  resolveChannelStreamingBlockEnabled,
} from "./discord-preview-streaming.js";

describe("resolveChannelPreviewStreamMode", () => {
  it("falls back to the caller-supplied default when nothing is configured", () => {
    expect(resolveChannelPreviewStreamMode(undefined, "partial")).toBe("partial");
    expect(resolveChannelPreviewStreamMode({}, "off")).toBe("off");
  });

  it("prefers an explicit streaming boolean", () => {
    expect(resolveChannelPreviewStreamMode({ streaming: true }, "off")).toBe("partial");
    expect(resolveChannelPreviewStreamMode({ streaming: false }, "partial")).toBe("off");
  });

  it("maps legacy streamMode values", () => {
    expect(resolveChannelPreviewStreamMode({ streamMode: "block" }, "partial")).toBe("block");
  });

  it("maps the unified progress mode to partial", () => {
    expect(resolveChannelPreviewStreamMode({ streaming: "progress" }, "off")).toBe("partial");
  });
});

describe("resolveChannelStreamingBlockEnabled", () => {
  it("returns the explicit boolean when configured", () => {
    expect(resolveChannelStreamingBlockEnabled({ blockStreaming: true })).toBe(true);
    expect(resolveChannelStreamingBlockEnabled({ blockStreaming: false })).toBe(false);
  });

  it("returns undefined when unconfigured", () => {
    expect(resolveChannelStreamingBlockEnabled({})).toBeUndefined();
    expect(resolveChannelStreamingBlockEnabled(undefined)).toBeUndefined();
  });
});
