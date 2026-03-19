import Redis from "ioredis";
import { createSubsystemLogger } from "../logging/subsystem.js";

const log = createSubsystemLogger("state-store");

type RedisClientLike = {
  connect?: () => Promise<void>;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, mode: "EX", ttlSec: number) => Promise<unknown>;
  del: (key: string) => Promise<number>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, ttlSec: number) => Promise<number>;
  quit?: () => Promise<void>;
  disconnect?: () => void;
};

type MemoryEntry = {
  value: string;
  expiresAt: number | null;
};

type StoreHealth = {
  redis: "ok" | "error" | "disabled";
  fallback: boolean;
  detail?: string;
};

const memoryStore = new Map<string, MemoryEntry>();

let redisClient: RedisClientLike | null = null;
let redisConnectPromise: Promise<RedisClientLike | null> | null = null;
let redisHealth: StoreHealth = {
  redis: process.env.REDIS_URL ? "error" : "disabled",
  fallback: true,
  detail: process.env.REDIS_URL ? "not connected" : "REDIS_URL not configured",
};
let lastWarnedError: string | null = null;
let createRedisClient: ((url: string) => RedisClientLike) | null = (url: string) =>
  new Redis(url, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  });

function cleanupExpiredMemoryEntry(key: string, now = Date.now()): MemoryEntry | null {
  const entry = memoryStore.get(key) ?? null;
  if (!entry) {
    return null;
  }
  if (entry.expiresAt !== null && entry.expiresAt <= now) {
    memoryStore.delete(key);
    return null;
  }
  return entry;
}

function logFallbackWarn(message: string, meta?: Record<string, unknown>) {
  if (lastWarnedError === message) {
    return;
  }
  lastWarnedError = message;
  log.warn(message, meta);
}

function setRedisHealth(next: StoreHealth) {
  redisHealth = next;
  if (next.redis === "ok") {
    lastWarnedError = null;
  }
}

async function ensureRedisClient(): Promise<RedisClientLike | null> {
  if (!process.env.REDIS_URL) {
    setRedisHealth({
      redis: "disabled",
      fallback: true,
      detail: "REDIS_URL not configured",
    });
    return null;
  }
  if (!createRedisClient) {
    return null;
  }
  if (redisClient) {
    return redisClient;
  }
  if (!redisConnectPromise) {
    redisConnectPromise = (async () => {
      const client = createRedisClient?.(process.env.REDIS_URL as string) ?? null;
      if (!client) {
        return null;
      }
      client.on("ready", () => {
        setRedisHealth({ redis: "ok", fallback: false });
      });
      client.on("error", (err) => {
        const detail = err instanceof Error ? err.message : String(err);
        setRedisHealth({ redis: "error", fallback: true, detail });
        logFallbackWarn(`Redis unavailable; using in-memory fallback. ${detail}`);
      });
      try {
        if (typeof client.connect === "function") {
          await client.connect();
        }
        redisClient = client;
        setRedisHealth({ redis: "ok", fallback: false });
        return client;
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        setRedisHealth({ redis: "error", fallback: true, detail });
        logFallbackWarn(`Redis unavailable; using in-memory fallback. ${detail}`);
        return null;
      } finally {
        redisConnectPromise = null;
      }
    })();
  }
  return await redisConnectPromise;
}

function setMemoryValue(key: string, value: string, ttlSec?: number): void {
  const expiresAt =
    typeof ttlSec === "number" && Number.isFinite(ttlSec) && ttlSec > 0
      ? Date.now() + ttlSec * 1000
      : null;
  memoryStore.set(key, { value, expiresAt });
}

async function withRedisFallback<T>(
  operation: (client: RedisClientLike) => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  const client = await ensureRedisClient();
  if (!client) {
    return await fallback();
  }
  try {
    const result = await operation(client);
    if (redisHealth.redis !== "ok" || redisHealth.fallback) {
      setRedisHealth({ redis: "ok", fallback: false });
    }
    return result;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    setRedisHealth({ redis: "error", fallback: true, detail });
    logFallbackWarn(`Redis operation failed; using in-memory fallback. ${detail}`);
    return await fallback();
  }
}

export const store = {
  async get(key: string): Promise<string | null> {
    return await withRedisFallback(
      async (client) => await client.get(key),
      () => cleanupExpiredMemoryEntry(key)?.value ?? null,
    );
  },

  async set(key: string, value: string, ttlSec = 300): Promise<void> {
    await withRedisFallback(
      async (client) => {
        await client.set(key, value, "EX", ttlSec);
      },
      () => {
        setMemoryValue(key, value, ttlSec);
      },
    );
  },

  async del(key: string): Promise<void> {
    await withRedisFallback(
      async (client) => {
        await client.del(key);
      },
      () => {
        memoryStore.delete(key);
      },
    );
  },

  async incr(key: string, ttlSec = 60): Promise<number> {
    return await withRedisFallback(
      async (client) => {
        const value = await client.incr(key);
        if (value === 1) {
          await client.expire(key, ttlSec);
        }
        return value;
      },
      () => {
        const current = cleanupExpiredMemoryEntry(key);
        const next = Number.parseInt(current?.value ?? "0", 10) + 1;
        setMemoryValue(key, String(next), ttlSec);
        return next;
      },
    );
  },
};

export function getStateStoreHealth(): StoreHealth {
  return { ...redisHealth };
}

export async function closeStateStore(): Promise<void> {
  const client = redisClient;
  redisClient = null;
  redisConnectPromise = null;
  if (!client) {
    return;
  }
  try {
    if (typeof client.quit === "function") {
      await client.quit();
    } else if (typeof client.disconnect === "function") {
      client.disconnect();
    }
  } catch {
    if (typeof client.disconnect === "function") {
      client.disconnect();
    }
  }
}

export function __resetStateStoreForTests(): void {
  memoryStore.clear();
  redisClient = null;
  redisConnectPromise = null;
  lastWarnedError = null;
  createRedisClient = (url: string) =>
    new Redis(url, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
  redisHealth = {
    redis: process.env.REDIS_URL ? "error" : "disabled",
    fallback: true,
    detail: process.env.REDIS_URL ? "not connected" : "REDIS_URL not configured",
  };
}

export function __setRedisClientFactoryForTests(
  factory: ((url: string) => RedisClientLike) | null,
): void {
  createRedisClient = factory;
  redisClient = null;
  redisConnectPromise = null;
}
