import type { HttpClient } from "./types";

function withPath(baseUrl: string, path: string): string {
  const trimmed = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${trimmed}${path}`;
}

export class JsonHttpClient implements HttpClient {
  constructor(private readonly timeoutMs: number) {}

  async get<T>(baseUrl: string, path: string): Promise<T> {
    return this.request<T>(withPath(baseUrl, path), "GET");
  }

  async post<T>(baseUrl: string, path: string, body: unknown): Promise<T> {
    return this.request<T>(withPath(baseUrl, path), "POST", body);
  }

  private async request<T>(url: string, method: "GET" | "POST", body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal
      });
      const text = await response.text();
      const parsed = text ? (JSON.parse(text) as T) : ({} as T);

      if (!response.ok) {
        const message =
          typeof parsed === "object" && parsed !== null && "error" in parsed
            ? String((parsed as { error: unknown }).error)
            : `${method} ${url} failed with ${response.status}`;
        throw new Error(message);
      }

      return parsed;
    } finally {
      clearTimeout(timer);
    }
  }
}
