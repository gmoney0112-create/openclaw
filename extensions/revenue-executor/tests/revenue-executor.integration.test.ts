import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer, IncomingMessage } from "node:http";
import { RevenueExecutor } from "../src/executor";
import { JsonHttpClient } from "../src/client";
import type { RevenueEndpoints } from "../src/types";

type CallRecord = {
  method: string;
  path: string;
  body: unknown;
};

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function withStubServer(
  handler: (method: string, path: string, body: unknown) => unknown
): Promise<{ baseUrl: string; calls: CallRecord[]; close: () => Promise<void> }> {
  const calls: CallRecord[] = [];
  const server = createServer(async (request, response) => {
    const method = request.method ?? "GET";
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    const body = await readJson(request);
    calls.push({ method, path, body });
    const payload = handler(method, path, body);
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(payload));
  });

  server.listen(0);
  await once(server, "listening");
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    calls,
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  };
}

async function run(): Promise<void> {
  const memory = await withStubServer((_method, path) => {
    if (path === "/memory/retrieve") {
      return { memories: [{ id: "m1", content: "Jane asked for Stripe link" }] };
    }
    if (path === "/memory/store") {
      return { id: "stored-1" };
    }
    return { status: "ok" };
  });
  const llm = await withStubServer((_method, path, body) => {
    if (path === "/llm/complete") {
      return { text: "Created link", request: body };
    }
    return { status: "ok" };
  });
  const browser = await withStubServer((_method, _path, body) => ({ status: "ok", request: body }));
  const workflow = await withStubServer((_method, _path, body) => ({ status: "ok", request: body }));
  const agent = await withStubServer(() => ({ status: "ok" }));
  const skills = await withStubServer(() => ({ status: "ok" }));
  const research = await withStubServer(() => ({ status: "ok" }));
  const os = await withStubServer(() => ({ status: "ok" }));
  const voice = await withStubServer(() => ({ status: "ok" }));
  const autocoder = await withStubServer(() => ({ status: "ok" }));

  const endpoints: RevenueEndpoints = {
    browser: browser.baseUrl,
    llm: llm.baseUrl,
    memory: memory.baseUrl,
    workflow: workflow.baseUrl,
    agent: agent.baseUrl,
    skills: skills.baseUrl,
    research: research.baseUrl,
    os: os.baseUrl,
    voice: voice.baseUrl,
    autocoder: autocoder.baseUrl
  };

  const executor = new RevenueExecutor(endpoints, new JsonHttpClient(5000), 3);

  const result = await executor.execute({
    action: "llm_complete",
    session_id: "session-1",
    payload: { prompt: "Create a Stripe payment link for Jane Smith" }
  });

  assert.equal(result.action, "llm_complete");
  assert.equal(memory.calls.length, 2);
  assert.equal(memory.calls[0]?.path, "/memory/retrieve");
  assert.equal(llm.calls[0]?.path, "/llm/complete");
  assert.equal(memory.calls[1]?.path, "/memory/store");
  assert.match(JSON.stringify(llm.calls[0]?.body), /Existing context/);

  const workflowResult = await executor.execute({
    action: "workflow_trigger",
    session_id: "session-2",
    payload: {
      workflow_name: "create_ghl_contact",
      payload: {
        email: "jane@example.com",
        name: "Jane Smith"
      }
    }
  });
  assert.equal(workflowResult.action, "workflow_trigger");
  assert.equal(workflow.calls[0]?.path, "/workflow/trigger");
  assert.equal(
    (workflow.calls[0]?.body as { workflow_name?: string } | undefined)?.workflow_name,
    "create_ghl_contact"
  );

  const browserResult = await executor.execute({
    action: "browser_action",
    session_id: "session-3",
    payload: {
      sessionId: "browser-session-1",
      action: "scrape_data",
      params: {
        selector: "#price"
      }
    }
  });
  assert.equal(browserResult.action, "browser_action");
  assert.equal(browser.calls[0]?.path, "/browser/action");
  assert.equal(
    (browser.calls[0]?.body as { sessionId?: string } | undefined)?.sessionId,
    "browser-session-1"
  );

  const health = await executor.health();
  assert.equal(health.status, "ok");
  assert.equal(health.checks.browser, "ok");
  assert.equal(health.checks.memory, "ok");

  await Promise.all([
    memory.close(),
    llm.close(),
    browser.close(),
    workflow.close(),
    agent.close(),
    skills.close(),
    research.close(),
    os.close(),
    voice.close(),
    autocoder.close()
  ]);

  console.log("revenue-executor integration test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
