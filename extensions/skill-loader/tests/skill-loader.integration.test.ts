import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { resolve } from "node:path";
import { SkillRegistry } from "../src/skill-registry";
import { SkillRunner } from "../src/skill-runner";

async function run(): Promise<void> {
  const skillsDir = resolve(__dirname, "../../skills");
  const registry = new SkillRegistry(skillsDir);
  const records = registry.load();
  assert.equal(records.length, 4, "four skills should be discovered");

  const runner = new SkillRunner(registry);
  const seoResult = await runner.run({
    skill_name: "seo-analyzer",
    tool_name: "analyze",
    params: { url: "https://mysite.com" }
  });
  assert.equal(seoResult.skill, "seo-analyzer");
  assert.equal(typeof seoResult.result.score, "number");

  const leadResult = await runner.run({
    skill_name: "lead-scraper",
    tool_name: "scrape",
    params: { niche: "real estate", location: "San Antonio" }
  });
  assert.equal(Array.isArray(leadResult.result.leads), true);

  const server = createServer((request, response) => {
    if (request.url === "/skills/catalog") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(registry.list().map((record) => record.manifest)));
      return;
    }

    response.writeHead(404).end();
  });

  server.listen(0);
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const catalogResponse = await fetch(`http://127.0.0.1:${port}/skills/catalog`);
  const catalog = await catalogResponse.json() as Array<unknown>;
  assert.equal(catalog.length, 4);
  server.close();

  console.log("skill-loader integration test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
