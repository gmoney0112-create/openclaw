import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import config from "./config.json";
import { CodeAnalyzer } from "./src/code-analyzer";
import { DeployManager } from "./src/deploy-manager";
import { HistoryStore } from "./src/history-store";
import { PatchApplicator } from "./src/patch-applicator";
import { PatchGenerator } from "./src/patch-generator";
import { TestRunner } from "./src/test-runner";
import type { AnalyzeRequest, DeployRequest, PatchRequest } from "./src/types";

const port = Number(process.env.PORT ?? config.port ?? 3109);
const repoRoot = resolve(__dirname, "../..");
const analyzer = new CodeAnalyzer();
const patchGenerator = new PatchGenerator();
const patchApplicator = new PatchApplicator();
const testRunner = new TestRunner();
const deployManager = new DeployManager(repoRoot);
const history = new HistoryStore(config.history_limit);
const fixturePath = existsSync(resolve(__dirname, "fixtures/broken-test.js"))
  ? resolve(__dirname, "fixtures/broken-test.js")
  : resolve(__dirname, "../fixtures/broken-test.js");

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

    if (method === "POST" && url.pathname === "/autocoder/analyze") {
      const body = await readJson<AnalyzeRequest>(request);
      const result = analyzer.analyze(body.log);
      history.add({ action: "analyze", status: "success", message: `${result.file}:${result.line}` });
      sendJson(response, 200, result);
      return;
    }

    if (method === "POST" && url.pathname === "/autocoder/patch") {
      const body = await readJson<PatchRequest>(request);
      const generated = patchGenerator.generate(body);
      const applied = patchApplicator.apply(body.file, generated.replacement);
      const testResult = await testRunner.run("node", [body.file]);
      history.add({
        action: "patch",
        status: applied && testResult.passed ? "success" : "error",
        message: generated.patch
      });
      history.add({
        action: "test",
        status: testResult.passed ? "success" : "error",
        message: testResult.passed ? "Patch test passed" : "Patch test failed"
      });
      sendJson(response, 200, {
        file: body.file,
        patch: generated.patch,
        applied,
        test: testResult
      });
      return;
    }

    if (method === "POST" && url.pathname === "/autocoder/deploy") {
      const body = await readJson<DeployRequest>(request);
      const result = await deployManager.deploy(body.description, body.approved);
      history.add({
        action: "deploy",
        status: result.deployed ? "success" : "blocked",
        message: result.message
      });
      sendJson(response, 200, result);
      return;
    }

    if (method === "GET" && url.pathname === "/autocoder/history") {
      sendJson(response, 200, { history: history.list() });
      return;
    }

    if (method === "GET" && url.pathname === "/autocoder/health") {
      sendJson(response, 200, {
        status: "ok",
        auto_deploy: String(process.env.AUTO_DEPLOY ?? config.auto_deploy_default),
        fixture: fixturePath,
        remote: (await deployManager.currentRemote()).trim()
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
  console.log(`Auto-coder listening on port ${port}`);
});

export { server };
