type Window = { count: number; resetAt: number };

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 20;
const MAX_TRACKED = 2000;

const windows = new Map<string, Window>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = windows.get(key);

  if (!entry || now >= entry.resetAt) {
    // Evict oldest entries when the map grows too large
    if (!entry && windows.size >= MAX_TRACKED) {
      const oldest = [...windows.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt)[0];
      if (oldest) windows.delete(oldest[0]);
    }
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > MAX_REQUESTS;
}
