import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { startServer } from "../main.js";

const targetUrl = process.env.TEST_TARGET_URL ?? "https://www.google.com";
const port = Number(process.env.BROWSER_CLUSTER_TEST_PORT ?? 3110);
process.env.BROWSER_CLUSTER_PORT = String(port);
process.env.NODE_OPTIONS ??= "--max-old-space-size=768";

async function main() {
  const { server, pool } = await startServer();

  try {
    const openResults = await Promise.all(
      Array.from({ length: 5 }, async (_, index) => {
        const response = await fetch(`http://127.0.0.1:${port}/browser/open`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: `test-${index + 1}`,
            url: targetUrl
          })
        });

        const json = (await response.json()) as { ok: boolean; sessionId: string };
        assert.equal(response.status, 200);
        assert.equal(json.ok, true);
        return json.sessionId;
      })
    );

    await delay(1000);

    const screenshotResults = await Promise.all(
      openResults.map(async (sessionId) => {
        const response = await fetch(`http://127.0.0.1:${port}/browser/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            action: "screenshot",
            params: {}
          })
        });

        const json = (await response.json()) as {
          ok: boolean;
          result: { mimeType: string; data: string };
        };
        assert.equal(response.status, 200);
        assert.equal(json.ok, true);
        assert.equal(json.result.mimeType, "image/png");
        assert.ok(json.result.data.length > 1000);
      })
    );

    await Promise.all(screenshotResults);

    const healthResponse = await fetch(`http://127.0.0.1:${port}/browser/health`);
    const health = (await healthResponse.json()) as {
      ok: boolean;
      pool: { activeSessions: number; maxInstances: number };
    };

    assert.equal(health.ok, true);
    assert.equal(health.pool.activeSessions, 5);
    assert.equal(health.pool.maxInstances >= 5, true);

    console.log("browser-cluster integration test passed");
  } finally {
    await pool.shutdown();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

await main();
