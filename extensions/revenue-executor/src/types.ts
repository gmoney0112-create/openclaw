export type RevenueAction =
  | "llm_complete"
  | "workflow_trigger"
  | "agent_dispatch"
  | "skills_run"
  | "research_run"
  | "browser_action"
  | "os_process"
  | "voice_transcribe"
  | "autocoder_analyze";

export interface RevenueExecuteRequest {
  action: RevenueAction;
  session_id?: string;
  context?: string;
  payload?: Record<string, unknown>;
}

export interface RevenueEndpoints {
  browser: string;
  llm: string;
  memory: string;
  workflow: string;
  agent: string;
  skills: string;
  research: string;
  os: string;
  voice: string;
  autocoder: string;
}

export interface RevenueExecutionResult {
  action: RevenueAction;
  session_id?: string;
  memory_before: unknown;
  dispatched_to: string;
  dispatched_path: string;
  dispatched_payload: Record<string, unknown>;
  action_result: unknown;
  memory_after: unknown;
}

export interface RevenueServiceHealth {
  status: "ok";
  endpoints: RevenueEndpoints;
  checks: Record<string, "ok" | "error">;
}

export interface HttpClient {
  get<T>(baseUrl: string, path: string): Promise<T>;
  post<T>(baseUrl: string, path: string, body: unknown): Promise<T>;
}
