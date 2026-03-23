import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { FallbackChain } from "./src/fallback-chain.js";
import { ModelSelector } from "./src/model-selector.js";
import { ProviderAdapters, type ProviderClient } from "./src/provider-adapters.js";
import { TaskClassifier } from "./src/task-classifier.js";
import type {
  CompletionRequest,
  ProviderHealth,
  ProviderName,
  RouteSelection,
  RouterConfig,
  TaskType
} from "./src/types.js";

function configPath(): string {
  return process.env.LLM_ROUTER_CONFIG ? resolve(process.env.LLM_ROUTER_CONFIG) : resolve(process.cwd(), "config.json");
}

function loadConfig(): RouterConfig {
  const raw = readFileSync(configPath(), "utf8");
  return JSON.parse(raw) as RouterConfig;
}

function saveConfig(config: RouterConfig): void {
  writeFileSync(configPath(), `${JSON.stringify(config, null, 2)}\n`, "utf8");
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

function createRuntime(params?: {
  providerOverrides?: Partial<Record<ProviderName, ProviderClient>>;
  logger?: (line: string) => void;
}) {
  const classifier = new TaskClassifier();
  const adapters = new ProviderAdapters(params?.providerOverrides);
  const logger = params?.logger ?? console.log;

  return {
    getConfig: () => loadConfig(),
    getSelector: () => new ModelSelector(loadConfig()),
    classifier,
    adapters,
    fallbackChain: new FallbackChain(adapters, logger),
    logger
  };
}

export function createAppServer(params?: {
  providerOverrides?: Partial<Record<ProviderName, ProviderClient>>;
  logger?: (line: string) => void;
}) {
  const runtime = createRuntime(params);

  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://localhost");

      if (request.method === "GET" && url.pathname === "/llm/health") {
        send(response, 200, {
          status: "ok",
          providers: runtime.adapters.health()
        });
        return;
      }

      if (request.method === "GET" && url.pathname === "/llm/routing") {
        send(response, 200, runtime.getConfig());
        return;
      }

      if (request.method === "POST" && url.pathname === "/llm/routing/update") {
        const body = await readJson<{ task_type: TaskType; provider: ProviderName; model: string }>(request);
        const config = runtime.getConfig();
        const route = config.routing[body.task_type];
        if (!route) {
          send(response, 400, { error: `Unknown task type: ${body.task_type}` });
          return;
        }
        config.routing[body.task_type] = {
          ...route,
          provider: body.provider,
          model: body.model
        };
        saveConfig(config);
        send(response, 200, { status: "ok", routing: config.routing[body.task_type] });
        return;
      }

      if (request.method === "POST" && url.pathname === "/llm/complete") {
        const body = await readJson<CompletionRequest>(request);
        if (typeof body.prompt !== "string" || body.prompt.trim().length === 0) {
          send(response, 400, { error: "prompt is required" });
          return;
        }

        const config = runtime.getConfig();
        const classification = body.task_type
          ? { task_type: body.task_type, confidence: 1 }
          : await runtime.classifier.classify(body.prompt);
        const selection = runtime.getSelector().select(classification.task_type);
        const result = await runtime.fallbackChain.complete(selection, {
          prompt: body.prompt,
          max_tokens: body.max_tokens ?? config.defaults.max_tokens,
          temperature: body.temperature ?? config.defaults.temperature,
          system_prompt: body.system_prompt
        });

        runtime.logger(
          `[llm-router] task_type=${classification.task_type} provider=${result.response.provider} model=${result.response.model} tokens=${result.response.tokens_used} cost=$${result.response.cost_usd.toFixed(4)} latency=${result.response.latency_ms}ms`
        );

        send(response, 200, {
          task_type: classification.task_type,
          confidence: classification.confidence,
          selected_provider: result.response.provider,
          selected_model: result.response.model,
          attempts: result.attempts,
          ...result.response
        });
        return;
      }

      send(response, 404, { error: "Not found" });
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
          ? error.status
          : 500;
      const message = error instanceof Error ? error.message : String(error);
      send(response, status, { error: message });
    }
  });
}

export async function startServer(params?: {
  port?: number;
  providerOverrides?: Partial<Record<ProviderName, ProviderClient>>;
  logger?: (line: string) => void;
}) {
  const config = loadConfig();
  const port = params?.port ?? Number(process.env.LLM_ROUTER_PORT ?? 3101);
  const server = createAppServer(params);

  await new Promise<void>((resolvePromise) => {
    server.listen(port, () => resolvePromise());
  });

  process.on("SIGINT", () => server.close());
  process.on("SIGTERM", () => server.close());

  return {
    server,
    port,
    config
  };
}

function isDirectExecution(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  const entryUrl = pathToFileURL(resolve(entry)).href;
  return import.meta.url.toLowerCase() === entryUrl.toLowerCase();
}

if (isDirectExecution()) {
  const { port } = await startServer();
  console.log(`llm-router listening on :${port}`);
}
