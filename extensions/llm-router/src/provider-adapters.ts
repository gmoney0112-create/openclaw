import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import OpenAI from "openai";
import type { LLMRequest, LLMResponse, ProviderHealth, ProviderName } from "./types.js";

export type ProviderClient = {
  complete(request: LLMRequest): Promise<LLMResponse>;
  health(): ProviderHealth;
};

const COST_TABLE: Record<ProviderName, { inputPer1k: number; outputPer1k: number }> = {
  openai: { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  anthropic: { inputPer1k: 0.003, outputPer1k: 0.015 },
  groq: { inputPer1k: 0.00005, outputPer1k: 0.0001 },
  deepseek: { inputPer1k: 0.00014, outputPer1k: 0.00028 }
};

export class ProviderAdapters {
  private readonly providers: Record<ProviderName, ProviderClient>;

  public constructor(providers?: Partial<Record<ProviderName, ProviderClient>>) {
    this.providers = {
      openai: providers?.openai ?? this.createOpenAIClient(),
      anthropic: providers?.anthropic ?? this.createAnthropicClient(),
      groq: providers?.groq ?? this.createGroqClient(),
      deepseek: providers?.deepseek ?? this.createDeepSeekClient()
    };
  }

  public get(provider: ProviderName): ProviderClient {
    return this.providers[provider];
  }

  public health(): Record<ProviderName, ProviderHealth> {
    return {
      openai: this.providers.openai.health(),
      anthropic: this.providers.anthropic.health(),
      groq: this.providers.groq.health(),
      deepseek: this.providers.deepseek.health()
    };
  }

  private createOpenAIClient(): ProviderClient {
    const apiKey = process.env.OPENAI_API_KEY;
    const client = apiKey ? new OpenAI({ apiKey }) : null;

    return {
      complete: async (request) => {
        if (!client) {
          throw Object.assign(new Error("OPENAI_API_KEY is not configured."), { status: 503 });
        }
        const startedAt = Date.now();
        const response = await client.responses.create({
          model: request.model,
          instructions: request.system_prompt,
          input: request.prompt,
          max_output_tokens: request.max_tokens,
          temperature: request.temperature
        });
        const inputTokens = response.usage?.input_tokens ?? 0;
        const outputTokens = response.usage?.output_tokens ?? 0;
        return {
          text: response.output_text,
          tokens_used: inputTokens + outputTokens,
          cost_usd: estimateCost("openai", inputTokens, outputTokens),
          provider: "openai",
          model: request.model,
          latency_ms: Date.now() - startedAt
        };
      },
      health: () => ({ configured: Boolean(apiKey), available: Boolean(apiKey) })
    };
  }

  private createAnthropicClient(): ProviderClient {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const client = apiKey ? new Anthropic({ apiKey }) : null;

    return {
      complete: async (request) => {
        if (!client) {
          throw Object.assign(new Error("ANTHROPIC_API_KEY is not configured."), { status: 503 });
        }
        const startedAt = Date.now();
        const response = await client.messages.create({
          model: request.model,
          system: request.system_prompt,
          messages: [{ role: "user", content: request.prompt }],
          max_tokens: request.max_tokens ?? 1000,
          temperature: request.temperature
        });
        const text = response.content
          .filter((item) => item.type === "text")
          .map((item) => item.text)
          .join("\n");
        const inputTokens = response.usage.input_tokens;
        const outputTokens = response.usage.output_tokens;
        return {
          text,
          tokens_used: inputTokens + outputTokens,
          cost_usd: estimateCost("anthropic", inputTokens, outputTokens),
          provider: "anthropic",
          model: request.model,
          latency_ms: Date.now() - startedAt
        };
      },
      health: () => ({ configured: Boolean(apiKey), available: Boolean(apiKey) })
    };
  }

  private createGroqClient(): ProviderClient {
    const apiKey = process.env.GROQ_API_KEY;
    const client = apiKey ? new Groq({ apiKey }) : null;

    return {
      complete: async (request) => {
        if (!client) {
          throw Object.assign(new Error("GROQ_API_KEY is not configured."), { status: 503 });
        }
        const startedAt = Date.now();
        const response = await client.chat.completions.create({
          model: request.model,
          temperature: request.temperature,
          max_completion_tokens: request.max_tokens,
          messages: [
            ...(request.system_prompt ? [{ role: "system" as const, content: request.system_prompt }] : []),
            { role: "user" as const, content: request.prompt }
          ]
        });
        const choice = response.choices[0]?.message?.content ?? "";
        const promptTokens = response.usage?.prompt_tokens ?? 0;
        const completionTokens = response.usage?.completion_tokens ?? 0;
        return {
          text: choice,
          tokens_used: promptTokens + completionTokens,
          cost_usd: estimateCost("groq", promptTokens, completionTokens),
          provider: "groq",
          model: request.model,
          latency_ms: Date.now() - startedAt
        };
      },
      health: () => ({ configured: Boolean(apiKey), available: Boolean(apiKey) })
    };
  }

  private createDeepSeekClient(): ProviderClient {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL: "https://api.deepseek.com"
        })
      : null;

    return {
      complete: async (request) => {
        if (!client) {
          throw Object.assign(new Error("DEEPSEEK_API_KEY is not configured."), { status: 503 });
        }
        const startedAt = Date.now();
        const response = await client.chat.completions.create({
          model: request.model,
          temperature: request.temperature,
          max_tokens: request.max_tokens,
          messages: [
            ...(request.system_prompt ? [{ role: "system" as const, content: request.system_prompt }] : []),
            { role: "user" as const, content: request.prompt }
          ]
        });
        const text = response.choices[0]?.message?.content ?? "";
        const promptTokens = response.usage?.prompt_tokens ?? 0;
        const completionTokens = response.usage?.completion_tokens ?? 0;
        return {
          text,
          tokens_used: promptTokens + completionTokens,
          cost_usd: estimateCost("deepseek", promptTokens, completionTokens),
          provider: "deepseek",
          model: request.model,
          latency_ms: Date.now() - startedAt
        };
      },
      health: () => ({ configured: Boolean(apiKey), available: Boolean(apiKey) })
    };
  }
}

function estimateCost(provider: ProviderName, inputTokens: number, outputTokens: number): number {
  const rates = COST_TABLE[provider];
  const inputCost = (inputTokens / 1000) * rates.inputPer1k;
  const outputCost = (outputTokens / 1000) * rates.outputPer1k;
  return Number((inputCost + outputCost).toFixed(6));
}
