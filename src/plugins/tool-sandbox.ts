import { fork } from "node:child_process";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

type SandboxResultMessage<TResult> = {
  type: "result";
  payload: TResult;
};

type SandboxUpdateMessage = {
  type: "update";
  payload: unknown;
};

type SandboxErrorMessage = {
  type: "error";
  error: {
    message: string;
    stack?: string;
    name?: string;
    code?: string;
  };
};

type SandboxChildMessage<TResult> =
  | SandboxResultMessage<TResult>
  | SandboxUpdateMessage
  | SandboxErrorMessage;

export type SandboxRunParams<TPayload, TResult> = {
  workerPath: string;
  payload: TPayload;
  timeoutMs?: number;
  onUpdate?: (payload: unknown) => void;
};

export type SandboxWirePayload<TPayload> = {
  payload: TPayload;
  allowedHosts?: string[];
};

function createSandboxError(
  message: string,
  extras?: { name?: string; code?: string; stack?: string },
): Error & { code?: string } {
  const error = new Error(message) as Error & { code?: string };
  if (extras?.name) {
    error.name = extras.name;
  }
  if (extras?.code) {
    error.code = extras.code;
  }
  if (extras?.stack) {
    error.stack = extras.stack;
  }
  return error;
}

function isTsSourcePath(filePath: string): boolean {
  return /\.(?:cts|mts|ts|tsx)$/i.test(filePath);
}

function resolveSandboxExecArgv(workerPath: string): string[] {
  if (!isTsSourcePath(workerPath)) {
    return [];
  }
  const argv = [...process.execArgv];
  const hasTsxImport =
    argv.includes("tsx") ||
    argv.includes("tsx/esm") ||
    argv.some((value, index) => value === "--import" && argv[index + 1] === "tsx");
  if (!hasTsxImport) {
    argv.unshift("tsx");
    argv.unshift("--import");
  }
  return argv;
}

export function resolveSiblingWorkerPath(stem: string): string {
  const currentPath = fileURLToPath(import.meta.url);
  const ext = path.extname(currentPath) || ".js";
  return path.join(path.dirname(currentPath), `${stem}${ext}`);
}

export async function runInSandbox<TPayload, TResult>(
  params: SandboxRunParams<TPayload, TResult>,
): Promise<TResult> {
  const timeoutMs = Math.max(1, params.timeoutMs ?? 5_000);
  return await new Promise<TResult>((resolve, reject) => {
    const child = fork(params.workerPath, [], {
      env: {},
      execArgv: resolveSandboxExecArgv(params.workerPath),
      stdio: ["ignore", "ignore", "ignore", "ipc"],
    });
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      fn();
    };

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(() =>
        reject(createSandboxError(`Sandbox timed out after ${timeoutMs}ms`, { code: "ETIMEDOUT" })),
      );
    }, timeoutMs);

    child.on("message", (message: SandboxChildMessage<TResult>) => {
      if (!message || typeof message !== "object" || !("type" in message)) {
        return;
      }
      if (message.type === "update") {
        params.onUpdate?.(message.payload);
        return;
      }
      if (message.type === "result") {
        finish(() => resolve(message.payload));
        return;
      }
      finish(() =>
        reject(
          createSandboxError(message.error.message, {
            name: message.error.name,
            code: message.error.code,
            stack: message.error.stack,
          }),
        ),
      );
    });

    child.once("error", (err) => {
      finish(() => reject(err));
    });

    child.once("exit", (code, signal) => {
      if (settled) {
        return;
      }
      const suffix =
        signal != null
          ? `signal=${signal}`
          : code != null
            ? `code=${code}`
            : "unknown exit";
      finish(() => reject(createSandboxError(`Sandbox exited before replying (${suffix})`)));
    });

    child.send(params.payload);
  });
}

function normalizeAllowedHost(host: string): string {
  return host.trim().toLowerCase().replace(/^\*\./, "").replace(/\.+$/, "");
}

function isAllowedHostname(hostname: string, allowedHosts?: readonly string[]): boolean {
  if (!allowedHosts || allowedHosts.length === 0) {
    return true;
  }
  const normalizedHostname = hostname.trim().toLowerCase();
  return allowedHosts.some((entry) => {
    const normalized = normalizeAllowedHost(entry);
    if (!normalized) {
      return false;
    }
    if (normalized === "*") {
      return true;
    }
    return normalizedHostname === normalized || normalizedHostname.endsWith(`.${normalized}`);
  });
}

function createBlockedHostError(hostname: string): Error & { code: string } {
  return createSandboxError(`Blocked: ${hostname}`, {
    name: "SandboxNetworkError",
    code: "ECONNREFUSED",
  }) as Error & { code: string };
}

function coerceUrl(input: string | URL): URL {
  return input instanceof URL ? input : new URL(input);
}

function resolveHttpRequestUrl(
  defaultProtocol: "http:" | "https:",
  args: unknown[],
): URL | null {
  const [first, second] = args;
  if (first instanceof URL) {
    return first;
  }
  if (typeof first === "string") {
    try {
      return new URL(first);
    } catch {
      const options =
        second && typeof second === "object" && !Array.isArray(second)
          ? (second as Record<string, unknown>)
          : {};
      const protocol =
        typeof options.protocol === "string" && options.protocol.trim()
          ? (options.protocol as string)
          : defaultProtocol;
      const hostSource =
        typeof options.hostname === "string" && options.hostname.trim()
          ? options.hostname
          : typeof options.host === "string"
            ? options.host
            : "";
      if (!hostSource) {
        return null;
      }
      const hostname = hostSource.replace(/:\d+$/, "");
      const port =
        typeof options.port === "number" || typeof options.port === "string"
          ? `:${String(options.port)}`
          : "";
      const requestPath = first.startsWith("/") ? first : `/${first}`;
      return new URL(`${protocol}//${hostname}${port}${requestPath}`);
    }
  }
  if (first && typeof first === "object" && !Array.isArray(first)) {
    const options = first as Record<string, unknown>;
    const protocol =
      typeof options.protocol === "string" && options.protocol.trim()
        ? (options.protocol as string)
        : defaultProtocol;
    const hostSource =
      typeof options.hostname === "string" && options.hostname.trim()
        ? options.hostname
        : typeof options.host === "string"
          ? options.host
          : "";
    if (!hostSource) {
      return null;
    }
    const hostname = hostSource.replace(/:\d+$/, "");
    const port =
      typeof options.port === "number" || typeof options.port === "string"
        ? `:${String(options.port)}`
        : "";
    const requestPath = typeof options.path === "string" && options.path ? options.path : "/";
    return new URL(`${protocol}//${hostname}${port}${requestPath}`);
  }
  return null;
}

function assertUrlAllowed(url: URL, allowedHosts?: readonly string[]): void {
  if (!isAllowedHostname(url.hostname, allowedHosts)) {
    throw createBlockedHostError(url.hostname);
  }
}

export function installSandboxNetworkGuards(allowedHosts?: readonly string[]): void {
  if (!allowedHosts || allowedHosts.length === 0) {
    return;
  }

  const originalFetch = globalThis.fetch?.bind(globalThis);
  if (originalFetch) {
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const target =
        typeof input === "string" || input instanceof URL ? input : new URL(input.url);
      assertUrlAllowed(coerceUrl(target), allowedHosts);
      return await originalFetch(input as never, init);
    }) as typeof globalThis.fetch;
  }

  const originalHttpRequest = http.request.bind(http);
  const originalHttpGet = http.get.bind(http);
  http.request = ((...args: unknown[]) => {
    const url = resolveHttpRequestUrl("http:", args);
    if (url) {
      assertUrlAllowed(url, allowedHosts);
    }
    return originalHttpRequest(...(args as Parameters<typeof http.request>));
  }) as typeof http.request;
  http.get = ((...args: unknown[]) => {
    const url = resolveHttpRequestUrl("http:", args);
    if (url) {
      assertUrlAllowed(url, allowedHosts);
    }
    return originalHttpGet(...(args as Parameters<typeof http.get>));
  }) as typeof http.get;

  const originalHttpsRequest = https.request.bind(https);
  const originalHttpsGet = https.get.bind(https);
  https.request = ((...args: unknown[]) => {
    const url = resolveHttpRequestUrl("https:", args);
    if (url) {
      assertUrlAllowed(url, allowedHosts);
    }
    return originalHttpsRequest(...(args as Parameters<typeof https.request>));
  }) as typeof https.request;
  https.get = ((...args: unknown[]) => {
    const url = resolveHttpRequestUrl("https:", args);
    if (url) {
      assertUrlAllowed(url, allowedHosts);
    }
    return originalHttpsGet(...(args as Parameters<typeof https.get>));
  }) as typeof https.get;
}

export function serializeSandboxError(error: unknown): SandboxErrorMessage["error"] {
  if (error instanceof Error) {
    const serialized: SandboxErrorMessage["error"] = {
      message: error.message || String(error),
      stack: error.stack,
      name: error.name,
    };
    const code = (error as Error & { code?: string }).code;
    if (typeof code === "string" && code) {
      serialized.code = code;
    }
    return serialized;
  }
  return { message: String(error) };
}
