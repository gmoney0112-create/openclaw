import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import type { LLMRequest, LLMResponse, ProviderHealth, ProviderName } from "../src/types.js";
import { startServer } from "../main.js";

class MockProviderClient {
  public readonly provider: ProviderName;
  private readonly responder: (request: LLMRequest) => Promise<LLMResponse>;

  public constructor(provider: ProviderName, responder: (request: LLMRequest) => Promise<LLMResponse>) {
    this.provider = provider;
    this.responder = responder;
  }

  public complete(request: LLMRequest): Promise<LLMResponse> {
    return this.responder(request);
  }

  public health(): ProviderHealth {
    return { configured: true, available: true };
  }
}

function responseFor(provider: ProviderName, model: string, text: string): LLMResponse {
  return {
    text,
    tokens_used: 42,
    cost_usd: 0.001,
    provider,
    model,
    latency_ms: 12
  };
}

async function main() {
  const port = 3111;
  process.env.LLM_ROUTER_PORT = String(port);

  const { server } = await startServer({
    port,
    providerOverrides: {
      openai: new MockProviderClient("openai", async (request) =>
        responseFor("openai", request.model, "openai-response")
      ),
      anthropic: new MockProviderClient("anthropic", async (request) =>
        responseFor("anthropic", request.model, "anthropic-response")
      ),
      groq: new MockProviderClient("groq", async (request) => responseFor("groq", request.model, "groq-response")),
      deepseek: new MockProviderClient("deepseek", async (request) => {
        if (request.prompt.includes("force-fallback")) {
          throw Object.assign(new Error("rate limited"), { status: 429 });
        }
        return responseFor("deepseek", request.model, "deepseek-response");
      })
    },
    logger: () => {}
  });

  try {
    const coding = await fetch(`http://127.0.0.1:${port}/llm/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_type: "coding", prompt: "write a for loop" })
    }).then((value) => value.json() as Promise<Record<string, unknown>>);
    assert.equal(coding.selected_provider, "openai");

    const reasoning = await fetch(`http://127.0.0.1:${port}/llm/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_type: "reasoning", prompt: "analyze this strategy" })
    }).then((value) => value.json() as Promise<Record<string, unknown>>);
    assert.equal(reasoning.selected_provider, "deepseek");

    const writing = await fetch(`http://127.0.0.1:${port}/llm/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_type: "writing", prompt: "write a sales email" })
    }).then((value) => value.json() as Promise<Record<string, unknown>>);
    assert.equal(writing.selected_provider, "anthropic");

    const classified = await fetch(`http://127.0.0.1:${port}/llm/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "debug this TypeScript error" })
    }).then((value) => value.json() as Promise<Record<string, unknown>>);
    assert.equal(classified.task_type, "coding");

    const fallback = await fetch(`http://127.0.0.1:${port}/llm/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_type: "reasoning", prompt: "force-fallback analyze this strategy" })
    }).then((value) => value.json() as Promise<Record<string, unknown>>);
    assert.notEqual(fallback.selected_provider, "deepseek");
    assert.equal(fallback.selected_provider, "openai");

    const health = await fetch(`http://127.0.0.1:${port}/llm/health`).then((value) =>
      value.json() as Promise<Record<string, unknown>>
    );
    assert.equal(health.status, "ok");

    await delay(10);
    console.log("llm-router integration test passed");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

await main();
