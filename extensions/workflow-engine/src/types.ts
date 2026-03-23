export interface WorkflowDefinition {
  name: string;
  webhook_url: string;
  description: string;
  required_fields: string[];
  timeout_ms: number;
}

export interface TriggerRequest {
  workflow_name: string;
  payload: Record<string, unknown>;
}

export interface TriggerResponse {
  execution_id: string;
  workflow_name: string;
  status: "queued" | "running" | "success" | "error";
  started_at: string;
}

export interface ExecutionResult {
  execution_id: string;
  status: "success" | "error";
  output: Record<string, unknown>;
  error_message?: string;
  duration_ms: number;
}

export interface N8nExecutionShape {
  id?: string;
  status?: string;
  finished?: boolean;
  mode?: string;
  startedAt?: string;
  stoppedAt?: string;
  data?: {
    resultData?: {
      error?: {
        message?: string;
      };
      runData?: Record<string, Array<{ data?: { main?: Array<Array<{ json?: Record<string, unknown> }>> } }>>;
    };
  };
  error?: string;
}

export interface HttpClient {
  post<T>(url: string, body: unknown, options?: { timeout?: number; headers?: Record<string, string> }): Promise<{
    status: number;
    data: T;
  }>;
  get<T>(url: string, options?: { timeout?: number; headers?: Record<string, string> }): Promise<{
    status: number;
    data: T;
  }>;
}
