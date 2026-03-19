import { describe, expect, it } from "vitest";
import { scrubPiiValue } from "./pii-scrub.js";

describe("pii scrubber", () => {
  it("redacts nested email and phone values", () => {
    expect(
      scrubPiiValue({
        message: "email test@example.com",
        nested: { phone: "Call 555-123-4567" },
      }),
    ).toEqual({
      message: "email [REDACTED]",
      nested: { phone: "Call [REDACTED]" },
    });
  });
});
