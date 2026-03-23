import { createServer, IncomingMessage, ServerResponse } from "node:http";
import config from "./config.json";
import { ResultParser } from "./src/result-parser";
import { StatusPoller } from "./src/status-poller";
import type { TriggerRequest } from "./src/types";
import { WorkflowLibrary } from "./src/workflow-library";
import { AxiosHttpClient, WorkflowTrigger } from "./src/workflow-trigger";

const port = Number(process.env.PORT ?? 3103);
const library = new WorkflowLibrary();
const httpClient = new AxiosHttpClient();
const trigger = new WorkflowTrigger(library, httpClient);
const statusPoller = new StatusPoller(library, new ResultParser(), httpClient);

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

async function isN8nReachable(): Promise<boolean> {
  try {
    const baseUrl = process.env.N8N_WEBHOOK_BASE_URL ?? config.n8n_base_url;
    const result = await httpClient.get<unknown>(baseUrl, { timeout: 3000 });
    return result.status >= 200 && result.status < 500;
  } catch {
    return false;
  }
}

const server = createServer(async (request, response) => {
  try {
    const method = request.method ?? "GET";
    const url = parseUrl(request);

    if (method === "POST" && url.pathname === "/workflow/trigger") {
      const body = await readJson<TriggerRequest>(request);
      const result = await trigger.trigger(body);
      sendJson(response, 200, result);
      return;
    }

    if (method === "POST" && url.pathname === "/workflow/trigger-and-wait") {
      const body = await readJson<TriggerRequest>(request);
      const triggerResult = await trigger.trigger(body);
      const execution = await statusPoller.poll(triggerResult.execution_id, library.getWorkflow(body.workflow_name).timeout_ms);
      sendJson(response, 200, execution);
      return;
    }

    if (method === "GET" && url.pathname.startsWith("/workflow/status/")) {
      const executionId = url.pathname.slice("/workflow/status/".length);
      const result = await statusPoller.poll(executionId);
      sendJson(response, 200, result);
      return;
    }

    if (method === "GET" && url.pathname === "/workflow/list") {
      sendJson(response, 200, library.listWorkflows());
      return;
    }

    if (method === "GET" && url.pathname === "/workflow/health") {
      sendJson(response, 200, {
        status: "ok",
        n8n_reachable: await isN8nReachable(),
        workflow_count: library.listWorkflows().length
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
  console.log(`Workflow engine listening on port ${port}`);
});

export { server, library, statusPoller, trigger };
