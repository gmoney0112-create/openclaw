import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BrowserPoolManager } from "./src/browser-pool-manager.js";
import type { BrowserActionRequest, BrowserClusterConfig, BrowserScrapeRequest, OpenSessionRequest } from "./src/types.js";

function loadConfig(): BrowserClusterConfig {
  const configPath = process.env.BROWSER_CLUSTER_CONFIG
    ? resolve(process.env.BROWSER_CLUSTER_CONFIG)
    : resolve(process.cwd(), "config.json");
  const raw = readFileSync(configPath, "utf8");
  const config = JSON.parse(raw) as BrowserClusterConfig;

  return {
    ...config,
    port: Number(process.env.BROWSER_CLUSTER_PORT ?? config.port ?? 3100)
  };
}

async function readJson<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {} as T;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

function send(response: ServerResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

export function createAppServer(pool: BrowserPoolManager) {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://localhost");

      if (request.method === "GET" && url.pathname === "/browser/health") {
        send(response, 200, {
          ok: true,
          pool: pool.getHealth(),
          nodeOptions: process.env.NODE_OPTIONS ?? null
        });
        return;
      }

      if (request.method === "POST" && url.pathname === "/browser/open") {
        const body = await readJson<OpenSessionRequest>(request);
        const result = await pool.openSession(body.sessionId, body.url);
        send(response, 200, { ok: true, ...result });
        return;
      }

      if (request.method === "POST" && url.pathname === "/browser/action") {
        const body = await readJson<BrowserActionRequest>(request);
        const result = await pool.runAction(body);
        send(response, 200, { ok: true, result });
        return;
      }

      if (request.method === "POST" && url.pathname === "/browser/scrape") {
        const body = await readJson<BrowserScrapeRequest>(request);
        const result = await pool.scrape(body);
        send(response, 200, { ok: true, result });
        return;
      }

      if (request.method === "DELETE" && url.pathname.startsWith("/browser/session/")) {
        const sessionId = decodeURIComponent(url.pathname.replace("/browser/session/", ""));
        const result = await pool.deleteSession(sessionId);
        send(response, 200, { ok: true, ...result });
        return;
      }

      send(response, 404, { ok: false, error: "Not found" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      send(response, 500, { ok: false, error: message });
    }
  });
}

export async function startServer() {
  const config = loadConfig();
  const pool = new BrowserPoolManager(config);
  const server = createAppServer(pool);

  await new Promise<void>((resolvePromise) => {
    server.listen(config.port, () => resolvePromise());
  });

  const shutdown = async () => {
    server.close();
    await pool.shutdown();
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  return { server, pool, config };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  const { config } = await startServer();
  console.log(`browser-cluster listening on :${config.port}`);
}
