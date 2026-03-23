import { createServer, IncomingMessage, ServerResponse } from "node:http";
import config from "./config.json";
import { MemoryRetriever } from "./src/memory-retriever";
import { MemoryTagger } from "./src/memory-tagger";
import { OpenAIEmbeddingClient, MemoryWriter } from "./src/memory-writer";
import { createVectorStore } from "./src/vector-store";
import type { RetrieveRequest, StoreRequest } from "./src/types";

const port = Number(process.env.PORT ?? config.port ?? 3102);
const vectorStore = createVectorStore();
const embeddingClient = new OpenAIEmbeddingClient(config.embedding.model);
const memoryWriter = new MemoryWriter(vectorStore, new MemoryTagger(), embeddingClient);
const memoryRetriever = new MemoryRetriever(
  vectorStore,
  embeddingClient,
  config.defaults.top_k,
  config.defaults.min_similarity
);

async function readJson<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? (JSON.parse(raw) as T) : ({} as T);
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

function parseUrl(request: IncomingMessage): URL {
  return new URL(request.url ?? "/", `http://${request.headers.host ?? `localhost:${port}`}`);
}

const server = createServer(async (request, response) => {
  try {
    const method = request.method ?? "GET";
    const url = parseUrl(request);

    if (method === "POST" && url.pathname === "/memory/store") {
      const body = await readJson<StoreRequest>(request);
      const result = await memoryWriter.store(body);
      sendJson(response, 200, result);
      return;
    }

    if (method === "POST" && url.pathname === "/memory/retrieve") {
      const body = await readJson<RetrieveRequest>(request);
      const result = await memoryRetriever.retrieve(body);
      sendJson(response, 200, result);
      return;
    }

    if (method === "GET" && url.pathname === "/memory/list") {
      const tag = url.searchParams.get("tag") ?? undefined;
      const limit = Number(url.searchParams.get("limit") ?? "20");
      const memories = await vectorStore.list(tag, limit);
      sendJson(response, 200, { memories, count: memories.length });
      return;
    }

    if (method === "DELETE" && url.pathname.startsWith("/memory/")) {
      const id = url.pathname.slice("/memory/".length);
      const deleted = await vectorStore.delete(id);
      sendJson(response, 200, { deleted });
      return;
    }

    if (method === "GET" && url.pathname === "/memory/health") {
      sendJson(response, 200, {
        status: "ok",
        backend: vectorStore.getBackendName(),
        memory_count: await vectorStore.count()
      });
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendJson(response, 500, { error: message });
  }
});

server.listen(port, () => {
  console.log(`Memory layer listening on port ${port}`);
});

export { server, memoryRetriever, memoryWriter, vectorStore };
