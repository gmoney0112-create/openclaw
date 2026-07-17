import { describe, expect, it } from "vitest";
import { evaluateSupplementalContextVisibility } from "./context-visibility.js";

describe("evaluateSupplementalContextVisibility", () => {
  it("preserves sender-allowed-only behavior for quotes and forwards", () => {
    expect(
      evaluateSupplementalContextVisibility({
        mode: "default",
        kind: "quote",
        senderAllowed: true,
      }),
    ).toEqual({ include: true });
    expect(
      evaluateSupplementalContextVisibility({
        mode: "default",
        kind: "forwarded",
        senderAllowed: false,
      }),
    ).toEqual({ include: false });
  });
});
