export type Department = "marketing" | "sales" | "research" | "ops" | "support";

export interface DispatchRequest {
  command: string;
}

export interface DispatchResponse {
  taskId: string;
  department: Department;
  status: "queued" | "running" | "success" | "error";
}

export interface AgentTaskRecord {
  taskId: string;
  command: string;
  department: Department;
  status: "queued" | "running" | "success" | "error";
  retries: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
  result?: AgentExecutionResult;
  error?: string;
  expiresAt: string;
}

export interface AgentExecutionResult {
  summary: string;
  tool_used: string;
  details: Record<string, unknown>;
}

export interface DepartmentAgent {
  readonly department: Department;
  readonly tools: string[];
  execute(command: string): Promise<AgentExecutionResult>;
}

export interface TaskStateStore {
  set(record: AgentTaskRecord): Promise<void>;
  get(taskId: string): Promise<AgentTaskRecord | undefined>;
  count(): Promise<number>;
  backend(): "memory" | "redis";
}
