export type TaskType = "coding" | "reasoning" | "writing" | "fast" | "research" | "sales";

export type ProviderName = "openai" | "anthropic" | "groq" | "deepseek";

export type TaskClassification = {
  task_type: TaskType;
  confidence: number;
};

export type RouteConfig = {
  provider: ProviderName;
  model: string;
  fallback: ProviderName;
};

export type RouterConfig = {
  routing: Record<TaskType, RouteConfig>;
  defaults: {
    max_tokens: number;
    temperature: number;
    timeout_ms: number;
  };
};

export type RouteSelection = {
  task_type: TaskType;
  provider: ProviderName;
  model: string;
  fallback_provider: ProviderName;
  fallback_model: string;
};

export interface LLMRequest {
  provider: ProviderName;
  model: string;
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  system_prompt?: string;
}

export interface LLMResponse {
  text: string;
  tokens_used: number;
  cost_usd: number;
  provider: ProviderName;
  model: string;
  latency_ms: number;
}

export type CompletionRequest = {
  task_type?: TaskType;
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  system_prompt?: string;
};

export type ProviderAttempt = {
  provider: ProviderName;
  model: string;
  status: number | "timeout" | "ok";
  latency_ms: number;
};

export type ProviderHealth = {
  configured: boolean;
  available: boolean;
};
