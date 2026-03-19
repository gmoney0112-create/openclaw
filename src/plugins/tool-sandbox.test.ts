import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runInSandbox } from "./tool-sandbox.js";

const workerPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "test-fixtures",
  "tool-sandbox-fixture-worker.ts",
);

describe("runInSandbox", () => {
  it("does not inherit parent process env", async () => {
    process.env.GHL_API_KEY = "top-secret";

    const result = await runInSandbox<
      { allowedHosts?: string[]; payload: { mode: "env" } },
      { details?: { gha?: string | null } }
    >({
      workerPath,
      payload: { payload: { mode: "env" } },
    });

    expect(result.details?.gha).toBeNull();
  });

  it("blocks outbound hosts outside the allowlist", async () => {
    await expect(
      runInSandbox<
        { allowedHosts?: string[]; payload: { mode: "http-block" } },
        unknown
      >({
        workerPath,
        payload: {
          allowedHosts: ["api.stripe.com"],
          payload: { mode: "http-block" },
        },
      }),
    ).rejects.toMatchObject({ code: "ECONNREFUSED" });
  });

  it("times out hung workers without crashing the parent", async () => {
    await expect(
      runInSandbox<
        { allowedHosts?: string[]; payload: { mode: "timeout" } },
        unknown
      >({
        workerPath,
        timeoutMs: 100,
        payload: { payload: { mode: "timeout" } },
      }),
    ).rejects.toMatchObject({ code: "ETIMEDOUT" });
  });
});
