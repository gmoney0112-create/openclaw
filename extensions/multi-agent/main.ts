import { createServer, IncomingMessage, ServerResponse } from "node:http";
import config from "./config.json";
import { AgentOrchestrator } from "./src/agent-orchestrator";
import { createDepartmentAgents } from "./src/department-agents";
import { InMemoryTaskStateStore } from "./src/state-store";
import type { DispatchRequest } from "./src/types";

const port = Number(process.env.PORT ?? config.port ?? 3104);
const stateStore = new InMemoryTaskStateStore();
const orchestrator = new AgentOrchestrator(
  createDepartmentAgents(),
  stateStore,
  config.retry_limit,
  config.task_ttl_ms
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

    if (method === "POST" && url.pathname === "/agent/dispatch") {
      const body = await readJson<DispatchRequest>(request);
      if (!body.command) {
        sendJson(response, 400, { error: "command is required" });
        return;
      }
      const result = await orchestrator.dispatch(body.command);
      sendJson(response, 200, result);
      return;
    }

    if (method === "GET" && url.pathname.startsWith("/agent/status/")) {
      const taskId = url.pathname.slice("/agent/status/".length);
      const task = await orchestrator.getStatus(taskId);
      if (!task) {
        sendJson(response, 404, { error: "Task not found" });
        return;
      }
      sendJson(response, 200, task);
      return;
    }

    if (method === "GET" && url.pathname === "/agent/health") {
      sendJson(response, 200, {
        status: "ok",
        state_backend: stateStore.backend(),
        task_count: await stateStore.count(),
        departments: Object.keys(config.departments)
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
  console.log(`Multi-agent listening on port ${port}`);
});

export { orchestrator, server, stateStore };
