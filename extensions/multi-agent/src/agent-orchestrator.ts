import { randomUUID } from "node:crypto";
import type { AgentTaskRecord, Department, DepartmentAgent, DispatchResponse, TaskStateStore } from "./types";

const ROUTE_RULES: Array<{ department: Department; keywords: string[] }> = [
  { department: "marketing", keywords: ["marketing", "campaign", "funnel", "ad", "landing page", "sales funnel"] },
  { department: "sales", keywords: ["crm", "contact", "opportunity", "stripe", "payment", "close", "lead"] },
  { department: "research", keywords: ["research", "competitor", "search", "find", "report", "market"] },
  { department: "ops", keywords: ["deploy", "workflow", "script", "file", "railway", "automation"] },
  { department: "support", keywords: ["reply", "support", "faq", "ticket", "customer issue", "escalate"] }
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesKeyword(normalized: string, keyword: string): boolean {
  if (keyword.includes(" ")) {
    return normalized.includes(keyword);
  }

  const pattern = new RegExp(`\\b${escapeRegex(keyword)}\\b`);
  return pattern.test(normalized);
}

export class AgentOrchestrator {
  constructor(
    private readonly agents: Record<Department, DepartmentAgent>,
    private readonly stateStore: TaskStateStore,
    private readonly retryLimit: number,
    private readonly ttlMs: number
  ) {}

  classifyDepartment(command: string): Department {
    const normalized = command.toLowerCase();
    const match = ROUTE_RULES.find((rule) => rule.keywords.some((keyword) => matchesKeyword(normalized, keyword)));
    return match?.department ?? "ops";
  }

  async dispatch(command: string): Promise<DispatchResponse> {
    const department = this.classifyDepartment(command);
    const taskId = randomUUID();
    const now = new Date();
    const record: AgentTaskRecord = {
      taskId,
      command,
      department,
      status: "queued",
      retries: 0,
      maxRetries: this.retryLimit,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + this.ttlMs).toISOString()
    };

    await this.stateStore.set(record);
    void this.run(taskId);

    return {
      taskId,
      department,
      status: "queued"
    };
  }

  async getStatus(taskId: string): Promise<AgentTaskRecord | undefined> {
    return this.stateStore.get(taskId);
  }

  private async run(taskId: string): Promise<void> {
    const record = await this.stateStore.get(taskId);
    if (!record) {
      return;
    }

    let current = { ...record };
    while (current.retries < current.maxRetries) {
      try {
        current = {
          ...current,
          status: "running",
          updatedAt: new Date().toISOString()
        };
        await this.stateStore.set(current);

        const result = await this.agents[current.department].execute(current.command);
        current = {
          ...current,
          status: "success",
          result,
          updatedAt: new Date().toISOString()
        };
        await this.stateStore.set(current);
        return;
      } catch (error) {
        current = {
          ...current,
          retries: current.retries + 1,
          error: error instanceof Error ? error.message : "Unknown error",
          updatedAt: new Date().toISOString()
        };
        await this.stateStore.set(current);
      }
    }

    current = {
      ...current,
      status: "error",
      updatedAt: new Date().toISOString()
    };
    await this.stateStore.set(current);
  }
}
