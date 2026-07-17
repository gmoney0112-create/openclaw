import { describe, expect, it } from "vitest";
import { resolveChannelContextVisibilityMode } from "./context-visibility.js";

describe("resolveChannelContextVisibilityMode", () => {
  it("always resolves to default (no config surface exists yet)", () => {
    expect(resolveChannelContextVisibilityMode({ cfg: {} as never, channel: "telegram" })).toBe(
      "default",
    );
    expect(
      resolveChannelContextVisibilityMode({
        cfg: {} as never,
        channel: "telegram",
        accountId: "acct1",
      }),
    ).toBe("default");
  });
});
