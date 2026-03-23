import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { MemoryRetriever } from "../src/memory-retriever";
import { MemoryTagger } from "../src/memory-tagger";
import { MemoryWriter } from "../src/memory-writer";
import { createVectorStore } from "../src/vector-store";
import type { EmbeddingClient } from "../src/types";

class FakeEmbeddingClient implements EmbeddingClient {
  async embed(text: string): Promise<number[]> {
    const normalized = text.toLowerCase();
    const tokens = [
      normalized.includes("ai") ? 1 : 0,
      normalized.includes("automation") ? 1 : 0,
      normalized.includes("ghl") || normalized.includes("contact") || normalized.includes("lead") ? 1 : 0,
      normalized.includes("stripe") || normalized.includes("payment") ? 1 : 0,
      normalized.includes("campaign") ? 1 : 0,
      normalized.includes("strategy") || normalized.includes("plan") ? 1 : 0
    ];

    return tokens.map((value) => Number(value));
  }
}

async function run(): Promise<void> {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_KEY;

  const vectorStore = createVectorStore();
  const embeddingClient = new FakeEmbeddingClient();
  const tagger = new MemoryTagger();
  const writer = new MemoryWriter(vectorStore, tagger, embeddingClient);
  const retriever = new MemoryRetriever(vectorStore, embeddingClient, 5, 0.2);

  const storeOne = await writer.store({ content: "business niche is AI automation" });
  assert.ok(storeOne.id, "store should return an id");
  assert.ok(
    storeOne.tags_applied.includes("general") || storeOne.tags_applied.includes("strategy") || storeOne.tags_applied.includes("product"),
    "store should return at least one useful tag"
  );

  const retrieveOne = await retriever.retrieve({ query: "what is my niche", top_k: 3, min_similarity: 0 });
  assert.ok(retrieveOne.memories.length >= 1, "retrieve should return stored memories");
  assert.ok(typeof retrieveOne.memories[0]?.similarity === "number", "memories should include similarity scores");

  const explicitTags = await writer.store({
    content: "create a contact in GHL for this lead",
    tags: ["sales", "crm"]
  });
  assert.deepEqual(explicitTags.tags_applied, ["sales", "crm"], "explicit tags should be preserved");

  assert.ok(tagger.tag("create a GHL contact for this lead").includes("crm"), "crm tag should be inferred");
  const campaignTags = tagger.tag("launch a Stripe payment link campaign");
  assert.ok(campaignTags.includes("sales"), "sales tag should be inferred");
  assert.ok(campaignTags.includes("marketing"), "marketing tag should be inferred");

  assert.equal(vectorStore.getBackendName(), "chroma", "fallback backend should be chroma");

  const server = createServer(async (request, response) => {
    if (request.url === "/memory/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({
        status: "ok",
        backend: vectorStore.getBackendName(),
        memory_count: await vectorStore.count()
      }));
      return;
    }

    response.writeHead(404).end();
  });

  server.listen(0);
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const healthResponse = await fetch(`http://127.0.0.1:${port}/memory/health`);
  const healthJson = await healthResponse.json() as { status: string };
  assert.equal(healthJson.status, "ok", "health endpoint should return ok");
  server.close();

  const deleted = await vectorStore.delete(storeOne.id ?? randomUUID());
  assert.equal(deleted, true, "stored memory should be deletable");

  console.log("memory-layer integration test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
