import { createDedupeCache } from "../infra/dedupe.js";
import type { FileLockOptions } from "./file-lock.js";
import { withFileLock } from "./file-lock.js";
import { readJsonFileWithFallback, writeJsonFileAtomically } from "./json-store.js";

type PersistentDedupeData = Record<string, number>;

export type PersistentDedupeOptions = {
  ttlMs: number;
  memoryMaxSize: number;
  fileMaxEntries: number;
  resolveFilePath: (namespace: string) => string;
  lockOptions?: Partial<FileLockOptions>;
  onDiskError?: (error: unknown) => void;
};

export type PersistentDedupeCheckOptions = {
  namespace?: string;
  now?: number;
  onDiskError?: (error: unknown) => void;
};

export type PersistentDedupe = {
  checkAndRecord: (key: string, options?: PersistentDedupeCheckOptions) => Promise<boolean>;
  forget: (key: string, options?: PersistentDedupeCheckOptions) => Promise<void>;
  warmup: (namespace?: string, onError?: (error: unknown) => void) => Promise<number>;
  clearMemory: () => void;
  memorySize: () => number;
};

const DEFAULT_LOCK_OPTIONS: FileLockOptions = {
  retries: {
    retries: 6,
    factor: 1.35,
    minTimeout: 8,
    maxTimeout: 180,
    randomize: true,
  },
  stale: 60_000,
};

function mergeLockOptions(overrides?: Partial<FileLockOptions>): FileLockOptions {
  return {
    stale: overrides?.stale ?? DEFAULT_LOCK_OPTIONS.stale,
    retries: {
      retries: overrides?.retries?.retries ?? DEFAULT_LOCK_OPTIONS.retries.retries,
      factor: overrides?.retries?.factor ?? DEFAULT_LOCK_OPTIONS.retries.factor,
      minTimeout: overrides?.retries?.minTimeout ?? DEFAULT_LOCK_OPTIONS.retries.minTimeout,
      maxTimeout: overrides?.retries?.maxTimeout ?? DEFAULT_LOCK_OPTIONS.retries.maxTimeout,
      randomize: overrides?.retries?.randomize ?? DEFAULT_LOCK_OPTIONS.retries.randomize,
    },
  };
}

function sanitizeData(value: unknown): PersistentDedupeData {
  if (!value || typeof value !== "object") {
    return {};
  }
  const out: PersistentDedupeData = {};
  for (const [key, ts] of Object.entries(value as Record<string, unknown>)) {
    if (typeof ts === "number" && Number.isFinite(ts) && ts > 0) {
      out[key] = ts;
    }
  }
  return out;
}

function pruneData(
  data: PersistentDedupeData,
  now: number,
  ttlMs: number,
  maxEntries: number,
): void {
  if (ttlMs > 0) {
    for (const [key, ts] of Object.entries(data)) {
      if (now - ts >= ttlMs) {
        delete data[key];
      }
    }
  }

  const keys = Object.keys(data);
  if (keys.length <= maxEntries) {
    return;
  }

  keys
    .toSorted((a, b) => data[a] - data[b])
    .slice(0, keys.length - maxEntries)
    .forEach((key) => {
      delete data[key];
    });
}

/** Create a dedupe helper that combines in-memory fast checks with a lock-protected disk store. */
export function createPersistentDedupe(options: PersistentDedupeOptions): PersistentDedupe {
  const ttlMs = Math.max(0, Math.floor(options.ttlMs));
  const memoryMaxSize = Math.max(0, Math.floor(options.memoryMaxSize));
  const fileMaxEntries = Math.max(1, Math.floor(options.fileMaxEntries));
  const lockOptions = mergeLockOptions(options.lockOptions);
  const memory = createDedupeCache({ ttlMs, maxSize: memoryMaxSize });
  const inflight = new Map<string, Promise<boolean>>();

  async function checkAndRecordInner(
    key: string,
    namespace: string,
    scopedKey: string,
    now: number,
    onDiskError?: (error: unknown) => void,
  ): Promise<boolean> {
    if (memory.check(scopedKey, now)) {
      return false;
    }

    const path = options.resolveFilePath(namespace);
    try {
      const duplicate = await withFileLock(path, lockOptions, async () => {
        const { value } = await readJsonFileWithFallback<PersistentDedupeData>(path, {});
        const data = sanitizeData(value);
        const seenAt = data[key];
        const isRecent = seenAt != null && (ttlMs <= 0 || now - seenAt < ttlMs);
        if (isRecent) {
          return true;
        }
        data[key] = now;
        pruneData(data, now, ttlMs, fileMaxEntries);
        await writeJsonFileAtomically(path, data);
        return false;
      });
      return !duplicate;
    } catch (error) {
      onDiskError?.(error);
      memory.check(scopedKey, now);
      return true;
    }
  }

  async function warmup(namespace = "global", onError?: (error: unknown) => void): Promise<number> {
    const filePath = options.resolveFilePath(namespace);
    const now = Date.now();
    try {
      const { value } = await readJsonFileWithFallback<PersistentDedupeData>(filePath, {});
      const data = sanitizeData(value);
      let loaded = 0;
      for (const [key, ts] of Object.entries(data)) {
        if (ttlMs > 0 && now - ts >= ttlMs) {
          continue;
        }
        const scopedKey = `${namespace}:${key}`;
        memory.check(scopedKey, ts);
        loaded++;
      }
      return loaded;
    } catch (error) {
      onError?.(error);
      return 0;
    }
  }

  async function checkAndRecord(
    key: string,
    dedupeOptions?: PersistentDedupeCheckOptions,
  ): Promise<boolean> {
    const trimmed = key.trim();
    if (!trimmed) {
      return true;
    }
    const namespace = dedupeOptions?.namespace?.trim() || "global";
    const scopedKey = `${namespace}:${trimmed}`;
    if (inflight.has(scopedKey)) {
      return false;
    }

    const onDiskError = dedupeOptions?.onDiskError ?? options.onDiskError;
    const now = dedupeOptions?.now ?? Date.now();
    const work = checkAndRecordInner(trimmed, namespace, scopedKey, now, onDiskError);
    inflight.set(scopedKey, work);
    try {
      return await work;
    } finally {
      inflight.delete(scopedKey);
    }
  }

  async function forget(key: string, dedupeOptions?: PersistentDedupeCheckOptions): Promise<void> {
    const trimmed = key.trim();
    if (!trimmed) {
      return;
    }
    const namespace = dedupeOptions?.namespace?.trim() || "global";
    const scopedKey = `${namespace}:${trimmed}`;
    memory.delete(scopedKey);

    const onDiskError = dedupeOptions?.onDiskError ?? options.onDiskError;
    const path = options.resolveFilePath(namespace);
    try {
      await withFileLock(path, lockOptions, async () => {
        const { value } = await readJsonFileWithFallback<PersistentDedupeData>(path, {});
        const data = sanitizeData(value);
        if (!(trimmed in data)) {
          return;
        }
        delete data[trimmed];
        await writeJsonFileAtomically(path, data);
      });
    } catch (error) {
      onDiskError?.(error);
    }
  }

  return {
    checkAndRecord,
    forget,
    warmup,
    clearMemory: () => memory.clear(),
    memorySize: () => memory.size(),
  };
}

export type ClaimableDedupeOptions = {
  ttlMs: number;
  memoryMaxSize: number;
  fileMaxEntries?: number;
  resolveFilePath?: (namespace: string) => string;
  lockOptions?: Partial<FileLockOptions>;
  onDiskError?: (error: unknown) => void;
};

export type ClaimResult = { kind: "claimed" | "duplicate" | "inflight" | "invalid" };

export type ClaimableDedupe = {
  claim: (key: string, options?: { namespace?: string; now?: number }) => Promise<ClaimResult>;
  commit: (key: string, options?: { namespace?: string }) => Promise<boolean>;
  release: (key: string, options?: { namespace?: string; error?: unknown }) => void;
  clearMemory: () => void;
  memorySize: () => number;
};

/**
 * Claim/commit/release wrapper over check-and-record dedup, so callers can
 * gate side-effecting work on a durable "have I already claimed this key"
 * check (surviving process restarts when `resolveFilePath` is set), then
 * confirm success with `commit` or free the key for retry with `release` on
 * failure.
 */
export function createClaimableDedupe(options: ClaimableDedupeOptions): ClaimableDedupe {
  const ttlMs = Math.max(0, Math.floor(options.ttlMs));
  const memoryMaxSize = Math.max(0, Math.floor(options.memoryMaxSize));
  const pendingClaims = new Set<string>();

  const persistent = options.resolveFilePath
    ? createPersistentDedupe({
        ttlMs,
        memoryMaxSize,
        fileMaxEntries: options.fileMaxEntries ?? memoryMaxSize,
        resolveFilePath: options.resolveFilePath,
        lockOptions: options.lockOptions,
        onDiskError: options.onDiskError,
      })
    : null;
  const memory = persistent ? null : createDedupeCache({ ttlMs, maxSize: memoryMaxSize });

  function scopedKey(key: string, namespace?: string): string {
    return `${namespace?.trim() || "global"}:${key}`;
  }

  async function claim(
    key: string,
    claimOptions?: { namespace?: string; now?: number },
  ): Promise<ClaimResult> {
    const trimmed = key.trim();
    if (!trimmed) {
      return { kind: "invalid" };
    }
    const scoped = scopedKey(trimmed, claimOptions?.namespace);
    if (pendingClaims.has(scoped)) {
      return { kind: "inflight" };
    }
    const isNew = persistent
      ? await persistent.checkAndRecord(trimmed, {
          namespace: claimOptions?.namespace,
          now: claimOptions?.now,
        })
      : !memory!.check(scoped, claimOptions?.now);
    if (!isNew) {
      return { kind: "duplicate" };
    }
    pendingClaims.add(scoped);
    return { kind: "claimed" };
  }

  async function commit(key: string, commitOptions?: { namespace?: string }): Promise<boolean> {
    const trimmed = key.trim();
    if (!trimmed) {
      return true;
    }
    pendingClaims.delete(scopedKey(trimmed, commitOptions?.namespace));
    return true;
  }

  function release(key: string, releaseOptions?: { namespace?: string; error?: unknown }): void {
    const trimmed = key.trim();
    if (!trimmed) {
      return;
    }
    const scoped = scopedKey(trimmed, releaseOptions?.namespace);
    pendingClaims.delete(scoped);
    if (persistent) {
      void persistent.forget(trimmed, { namespace: releaseOptions?.namespace });
    } else {
      memory!.delete(scoped);
    }
  }

  return {
    claim,
    commit,
    release,
    clearMemory: () => (persistent ? persistent.clearMemory() : memory!.clear()),
    memorySize: () => (persistent ? persistent.memorySize() : memory!.size()),
  };
}
