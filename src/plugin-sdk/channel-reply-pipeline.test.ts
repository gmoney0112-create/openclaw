import { describe, expect, it, vi } from "vitest";
import type { ReplyPayload } from "../auto-reply/types.js";

// The real file re-exports the entire channel-runtime.js facade (`export *`),
// which pulls in the full channel-plugin graph — irrelevant to this unit's
// own merge logic and prone to a pre-existing circular-import ordering issue
// under Vitest's module transform (reproducible by importing channel-runtime.js
// alone, with none of this file's own code involved). Stub it out here.
vi.mock("./channel-runtime.js", () => ({}));

vi.mock("../channels/reply-prefix.js", () => ({
  createReplyPrefixOptions: vi.fn(() => ({
    responsePrefix: "prefix",
    enableSlackInteractiveReplies: false,
    responsePrefixContextProvider: () => ({ identityName: "bot" }),
    onModelSelected: vi.fn(),
  })),
  createReplyPrefixContext: vi.fn(),
}));

vi.mock("../channels/typing.js", () => ({
  createTypingCallbacks: vi.fn((params: { start: () => Promise<void> }) => ({
    onReplyStart: params.start,
  })),
}));

import { createChannelReplyPipeline } from "./channel-reply-pipeline.js";

describe("createChannelReplyPipeline", () => {
  const cfg = {} as never;

  it("bundles reply-prefix options without typing callbacks when typing is omitted", () => {
    const result = createChannelReplyPipeline({
      cfg,
      agentId: "default",
      channel: "telegram",
      accountId: "acct1",
    });
    expect(result.responsePrefix).toBe("prefix");
    expect(typeof result.onModelSelected).toBe("function");
    expect(result.typingCallbacks).toBeUndefined();
  });

  it("builds typing callbacks when a typing config is provided", async () => {
    let started = false;
    const result = createChannelReplyPipeline({
      cfg,
      agentId: "default",
      channel: "telegram",
      accountId: "acct1",
      typing: {
        start: async () => {
          started = true;
        },
        onStartError: () => {},
      },
    });
    expect(result.typingCallbacks).toBeDefined();
    await result.typingCallbacks?.onReplyStart();
    expect(started).toBe(true);
  });

  it("passes transformReplyPayload through unchanged", () => {
    const transform = (payload: ReplyPayload) => payload;
    const result = createChannelReplyPipeline({
      cfg,
      agentId: "default",
      channel: "slack",
      transformReplyPayload: transform,
    });
    expect(result.transformReplyPayload).toBe(transform);
  });
});
