import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __resetStateStoreForTests,
  __setRedisClientFactoryForTests,
  closeStateStore,
  getStateStoreHealth,
  store,
} from "./state-store.js";

describe("state-store", () => {
  afterEach(async () => {
    vi.unstubAllEnvs();
    __setRedisClientFactoryForTests(null);
    __resetStateStoreForTests();
    await closeStateStore();
  });

  it("uses in-memory fallback when REDIS_URL is not configured", async () => {
    vi.stubEnv("REDIS_URL", "");
    __resetStateStoreForTests();

    await store.set("alpha", "1", 60);
    expect(await store.get("alpha")).toBe("1");
    expect(await store.incr("counter", 60)).toBe(1);
    expect(await store.incr("counter", 60)).toBe(2);

    expect(getStateStoreHealth()).toEqual({
      redis: "disabled",
      fallback: true,
      detail: "REDIS_URL not configured",
    });
  });

  it("reports redis errors and falls back to memory when connect fails", async () => {
    vi.stubEnv("REDIS_URL", "redis://127.0.0.1:6379");
    __resetStateStoreForTests();
    __setRedisClientFactoryForTests(() => ({
      on: () => {},
      connect: async () => {
        throw new Error("connect failed");
      },
      get: async () => null,
      set: async () => "OK",
      del: async () => 0,
      incr: async () => 1,
      expire: async () => 1,
    }));

    await store.set("beta", "2", 60);
    expect(await store.get("beta")).toBe("2");

    expect(getStateStoreHealth()).toEqual({
      redis: "error",
      fallback: true,
      detail: "connect failed",
    });
  });
});
