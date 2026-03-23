import type { LLMRequest, LLMResponse, ProviderAttempt, ProviderName, RouteSelection } from "./types.js";
import { ProviderAdapters } from "./provider-adapters.js";

type Logger = (line: string) => void;

export class FallbackChain {
  private readonly adapters: ProviderAdapters;
  private readonly logger: Logger;

  public constructor(adapters: ProviderAdapters, logger: Logger = console.log) {
    this.adapters = adapters;
    this.logger = logger;
  }

  public async complete(selection: RouteSelection, request: Omit<LLMRequest, "provider" | "model">): Promise<{
    response: LLMResponse;
    attempts: ProviderAttempt[];
  }> {
    const attempts: ProviderAttempt[] = [];

    const primaryResult = await this.tryProvider(selection.provider, selection.model, request);
    attempts.push(primaryResult.attempt);
    if (primaryResult.response) {
      return { response: primaryResult.response, attempts };
    }

    const fallbackResult = await this.tryProvider(selection.fallback_provider, selection.fallback_model, request);
    attempts.push(fallbackResult.attempt);
    if (fallbackResult.response) {
      return { response: fallbackResult.response, attempts };
    }

    const error = {
      error: "Both primary and fallback providers failed.",
      primary_status: primaryResult.attempt.status,
      fallback_status: fallbackResult.attempt.status
    };
    throw Object.assign(new Error(JSON.stringify(error)), { status: 502, details: error, attempts });
  }

  private async tryProvider(
    provider: ProviderName,
    model: string,
    request: Omit<LLMRequest, "provider" | "model">
  ): Promise<{ response?: LLMResponse; attempt: ProviderAttempt }> {
    const startedAt = Date.now();
    try {
      const response = await this.adapters.get(provider).complete({
        provider,
        model,
        ...request
      });
      const attempt: ProviderAttempt = {
        provider,
        model,
        status: "ok",
        latency_ms: Date.now() - startedAt
      };
      this.logger(`[llm-router] attempt provider=${provider} model=${model} status=ok latency=${attempt.latency_ms}ms`);
      return { response, attempt };
    } catch (error) {
      const status = extractStatus(error);
      const attempt: ProviderAttempt = {
        provider,
        model,
        status,
        latency_ms: Date.now() - startedAt
      };
      this.logger(`[llm-router] attempt provider=${provider} model=${model} status=${String(status)} latency=${attempt.latency_ms}ms`);
      if (!shouldFallback(status)) {
        throw error;
      }
      return { attempt };
    }
  }
}

function extractStatus(error: unknown): number | "timeout" {
  if (error instanceof Error && error.name === "AbortError") {
    return "timeout";
  }
  if (typeof error === "object" && error !== null && "status" in error && typeof error.status === "number") {
    return error.status;
  }
  return 500;
}

function shouldFallback(status: number | "timeout"): boolean {
  return status === "timeout" || status === 429 || status === 500 || status === 503;
}
