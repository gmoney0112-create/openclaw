import type { AgentTaskRecord, TaskStateStore } from "./types";

export class InMemoryTaskStateStore implements TaskStateStore {
  private readonly tasks = new Map<string, AgentTaskRecord>();

  async set(record: AgentTaskRecord): Promise<void> {
    this.tasks.set(record.taskId, record);
  }

  async get(taskId: string): Promise<AgentTaskRecord | undefined> {
    const record = this.tasks.get(taskId);
    if (!record) {
      return undefined;
    }

    if (Date.parse(record.expiresAt) < Date.now()) {
      this.tasks.delete(taskId);
      return undefined;
    }

    return record;
  }

  async count(): Promise<number> {
    return this.tasks.size;
  }

  backend(): "memory" {
    return "memory";
  }
}
