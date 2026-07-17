import { describe, expect, it } from "vitest";
import { resolveTelegramRequestTimeoutMs } from "./request-timeouts.js";

describe("resolveTelegramRequestTimeoutMs", () => {
  it("bounds Telegram startup control-plane methods", () => {
    expect(resolveTelegramRequestTimeoutMs("deletewebhook")).toBe(15_000);
    expect(resolveTelegramRequestTimeoutMs("getme")).toBe(15_000);
    expect(resolveTelegramRequestTimeoutMs("setwebhook")).toBe(15_000);
  });

  it("keeps the longer polling timeout for getUpdates", () => {
    expect(resolveTelegramRequestTimeoutMs("getupdates")).toBe(45_000);
  });

  it("bounds media upload methods with a longer timeout", () => {
    expect(resolveTelegramRequestTimeoutMs("sendphoto")).toBe(60_000);
    expect(resolveTelegramRequestTimeoutMs("sendvideo")).toBe(60_000);
    expect(resolveTelegramRequestTimeoutMs("senddocument")).toBe(60_000);
  });

  it("falls back to a default timeout for every other known method so nothing can hang forever", () => {
    expect(resolveTelegramRequestTimeoutMs("sendmessage")).toBe(30_000);
    expect(resolveTelegramRequestTimeoutMs("editmessagetext")).toBe(30_000);
    expect(resolveTelegramRequestTimeoutMs("some-future-method")).toBe(30_000);
  });

  it("only skips timeouts when the method could not be determined", () => {
    expect(resolveTelegramRequestTimeoutMs(null)).toBeUndefined();
  });
});
