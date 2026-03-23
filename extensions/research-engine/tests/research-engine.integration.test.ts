import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { ResearchOrchestrator } from "../src/research-orchestrator";

async function run(): Promise<void> {
  const orchestrator = new ResearchOrchestrator();
  const report = await orchestrator.run({
    topic: "profitable digital product niches in 2025",
    depth: "quick",
    output: "full"
  });

  assert.match(report.executive_summary, /credible demand/i);
  assert.ok(report.key_findings.length >= 3);
  assert.ok(report.opportunities.length >= 3);
  assert.ok(report.citations.length >= 3);

  const server = createServer((request, response) => {
    if (request.url === "/research/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({
        status: "ok",
        providers: ["tavily", "searxng"]
      }));
      return;
    }

    response.writeHead(404).end();
  });

  server.listen(0);
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const healthResponse = await fetch(`http://127.0.0.1:${port}/research/health`);
  const health = await healthResponse.json() as { status: string };
  assert.equal(health.status, "ok");
  server.close();

  console.log("research-engine integration test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
