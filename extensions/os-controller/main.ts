import { createServer, IncomingMessage, ServerResponse } from "node:http";
import config from "./config.json";
import { FileManager } from "./src/file-manager";
import { ProcessRunner } from "./src/process-runner";
import { SafetyGuard } from "./src/safety";
import { ScreenController } from "./src/screen-controller";
import { ScriptEngine } from "./src/script-engine";
import type { FileRequest, ProcessRequest, ScreenRequest, ScriptRequest } from "./src/types";

const port = Number(process.env.PORT ?? config.port ?? 3107);
const safety = new SafetyGuard(config.allowedDirectories, config.allowedApps);
const fileManager = new FileManager(safety);
const processRunner = new ProcessRunner(safety);
const screenController = new ScreenController();
const scriptEngine = new ScriptEngine();

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

    if (method === "POST" && url.pathname === "/os/file") {
      const body = await readJson<FileRequest>(request);
      sendJson(response, 200, await fileManager.handle(body));
      return;
    }

    if (method === "POST" && url.pathname === "/os/process") {
      const body = await readJson<ProcessRequest>(request);
      sendJson(response, 200, await processRunner.handle(body));
      return;
    }

    if (method === "POST" && url.pathname === "/os/screen") {
      const body = await readJson<ScreenRequest>(request);
      sendJson(response, 200, await screenController.handle(body));
      return;
    }

    if (method === "POST" && url.pathname === "/os/script") {
      const body = await readJson<ScriptRequest>(request);
      sendJson(response, 200, await scriptEngine.run(body));
      return;
    }

    if (method === "GET" && url.pathname === "/os/health") {
      sendJson(response, 200, {
        status: "ok",
        allowedDirectories: config.allowedDirectories,
        allowedApps: config.allowedApps
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
  console.log(`OS controller listening on port ${port}`);
});

export { server };
