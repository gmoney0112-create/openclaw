import { describe, expect, it } from "vitest";
import { hasConfiguredSecretInputValue } from "./runtime-shared.js";

describe("hasConfiguredSecretInputValue", () => {
  it("is true for a non-empty string value", () => {
    expect(hasConfiguredSecretInputValue("abc123")).toBe(true);
  });

  it("is false for an empty or whitespace-only string", () => {
    expect(hasConfiguredSecretInputValue("")).toBe(false);
    expect(hasConfiguredSecretInputValue("   ")).toBe(false);
  });

  it("is false for undefined/null", () => {
    expect(hasConfiguredSecretInputValue(undefined)).toBe(false);
    expect(hasConfiguredSecretInputValue(null)).toBe(false);
  });

  it("is true for a resolvable secret ref object", () => {
    expect(
      hasConfiguredSecretInputValue({ source: "env", provider: "default", id: "TG_TOKEN" }),
    ).toBe(true);
  });

  it("is true for a legacy secret ref shape coerced via defaults", () => {
    expect(hasConfiguredSecretInputValue({ source: "env", id: "TG_TOKEN" }, { env: "vault" })).toBe(
      true,
    );
  });
});
