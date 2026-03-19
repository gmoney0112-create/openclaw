import { store } from "./state-store.js";

const KEYS = {
  circuitBreaker: "gov:circuitBreakerState",
  budget: "gov:budgetUsedDollars",
  concurrency: "gov:concurrencyActive",
} as const;

export const govState = {
  async getCircuitBreaker<T = unknown>(): Promise<T | null> {
    const raw = await store.get(KEYS.circuitBreaker);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  },

  async setCircuitBreaker(value: unknown, ttlSec = 3600): Promise<void> {
    await store.set(KEYS.circuitBreaker, JSON.stringify(value), ttlSec);
  },

  async getBudget(): Promise<number> {
    const raw = await store.get(KEYS.budget);
    const parsed = Number.parseFloat(raw ?? "0");
    return Number.isFinite(parsed) ? parsed : 0;
  },

  async addBudget(delta: number, ttlSec = 86400): Promise<number> {
    const next = (await this.getBudget()) + delta;
    await store.set(KEYS.budget, String(next), ttlSec);
    return next;
  },

  async getConcurrency(): Promise<number> {
    const raw = await store.get(KEYS.concurrency);
    const parsed = Number.parseInt(raw ?? "0", 10);
    return Number.isFinite(parsed) ? parsed : 0;
  },

  async setConcurrency(value: number, ttlSec = 300): Promise<void> {
    await store.set(KEYS.concurrency, String(Math.max(0, Math.floor(value))), ttlSec);
  },
};
