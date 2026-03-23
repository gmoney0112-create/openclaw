import { createServer, IncomingMessage, ServerResponse } from "node:http";
import config from "./config.json";
import { JsonHttpClient } from "./src/client";
import { RevenueExecutor } from "./src/executor";
import type { RevenueEndpoints, RevenueExecuteRequest } from "./src/types";

const port = Number(process.env.PORT ?? config.port ?? 3110);

const endpoints: RevenueEndpoints = {
  browser: process.env.BROWSER_CLUSTER_URL ?? "http://localhost:3100",
  llm: process.env.LLM_ROUTER_URL ?? "http://localhost:3101",
  memory: process.env.MEMORY_LAYER_URL ?? "http://localhost:3102",
  workflow: process.env.WORKFLOW_ENGINE_URL ?? "http://localhost:3103",
  agent: process.env.MULTI_AGENT_URL ?? "http://localhost:3104",
  skills: process.env.SKILL_LOADER_URL ?? "http://localhost:3105",
  research: process.env.RESEARCH_ENGINE_URL ?? "http://localhost:3106",
  os: process.env.OS_CONTROLLER_URL ?? "http://localhost:3107",
  voice: process.env.VOICE_OPERATOR_URL ?? "http://localhost:3108",
  autocoder: process.env.AUTO_CODER_URL ?? "http://localhost:3109"
};

const executor = new RevenueExecutor(
  endpoints,
  new JsonHttpClient(Number(process.env.REVENUE_TIMEOUT_MS ?? config.timeout_ms ?? 10000)),
  Number(process.env.REVENUE_MEMORY_TOP_K ?? config.memory_top_k ?? 5)
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

    if (method === "POST" && url.pathname === "/revenue/execute") {
      const body = await readJson<RevenueExecuteRequest>(request);
      if (!body.action) {
        sendJson(response, 400, { error: "action is required" });
        return;
      }
      const result = await executor.execute(body);
      sendJson(response, 200, result);
      return;
    }

    if (method === "GET" && url.pathname === "/revenue/actions") {
      sendJson(response, 200, {
        actions: RevenueExecutor.supportedActions()
      });
      return;
    }

    if (method === "GET" && url.pathname === "/revenue/health") {
      sendJson(response, 200, await executor.health());
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendJson(response, 500, { error: message });
  }
});

server.listen(port, () => {
  console.log(`Revenue executor listening on port ${port}`);
});

export { executor, server };
