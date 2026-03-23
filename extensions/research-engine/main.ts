import { createServer, IncomingMessage, ServerResponse } from "node:http";
import config from "./config.json";
import { ResearchOrchestrator } from "./src/research-orchestrator";
import type { ResearchRequest } from "./src/types";

const port = Number(process.env.PORT ?? config.port ?? 3106);
const orchestrator = new ResearchOrchestrator();

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

    if (method === "POST" && url.pathname === "/research/run") {
      const body = await readJson<ResearchRequest>(request);
      if (!body.topic) {
        sendJson(response, 400, { error: "topic is required" });
        return;
      }
      const result = await orchestrator.run(body);
      sendJson(response, 200, result);
      return;
    }

    if (method === "GET" && url.pathname === "/research/health") {
      sendJson(response, 200, {
        status: "ok",
        providers: ["tavily", "searxng"],
        browser_cluster_url: process.env.BROWSER_CLUSTER_URL ?? null,
        llm_router_url: process.env.LLM_ROUTER_URL ?? null
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
  console.log(`Research engine listening on port ${port}`);
});

export { orchestrator, server };
