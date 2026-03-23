import { randomUUID } from "node:crypto";
import type { AutoCoderHistoryEntry } from "./types";

export class HistoryStore {
  private readonly items: AutoCoderHistoryEntry[] = [];

  constructor(private readonly limit: number) {}

  add(entry: Omit<AutoCoderHistoryEntry, "id" | "createdAt">): AutoCoderHistoryEntry {
    const fullEntry: AutoCoderHistoryEntry = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...entry
    };
    this.items.unshift(fullEntry);
    if (this.items.length > this.limit) {
      this.items.length = this.limit;
    }
    return fullEntry;
  }

  list(): AutoCoderHistoryEntry[] {
    return [...this.items];
  }
}
