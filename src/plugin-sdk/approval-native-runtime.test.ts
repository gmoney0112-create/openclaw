import { describe, expect, it } from "vitest";
import { buildChannelApprovalNativeTargetKey } from "./approval-native-runtime.js";

describe("buildChannelApprovalNativeTargetKey", () => {
  it("includes the thread id when present", () => {
    expect(buildChannelApprovalNativeTargetKey({ to: "123", threadId: 45 })).toBe("123:45");
  });

  it("falls back to just the target when there is no thread", () => {
    expect(buildChannelApprovalNativeTargetKey({ to: "123" })).toBe("123");
    expect(buildChannelApprovalNativeTargetKey({ to: "123", threadId: null })).toBe("123");
  });
});
