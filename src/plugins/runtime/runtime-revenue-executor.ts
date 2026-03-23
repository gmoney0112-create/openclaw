type RevenueRequestBody = {
  action: string;
  session_id?: string;
  context?: string;
  payload?: Record<string, unknown>;
};

function resolveRevenueExecutorUrl(): string {
  const raw = process.env.REVENUE_EXECUTOR_URL?.trim() || "http://localhost:3110";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message =
      typeof parsed === "object" && parsed !== null && "error" in parsed
        ? String((parsed as { error: unknown }).error)
        : `HTTP ${response.status}`;
    throw new Error(`revenue-executor request failed: ${message}`);
  }
  return parsed;
}

export async function revenueExecutorExecute(params: RevenueRequestBody): Promise<unknown> {
  const response = await fetch(`${resolveRevenueExecutorUrl()}/revenue/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return readResponse(response);
}

export async function revenueExecutorActions(): Promise<unknown> {
  const response = await fetch(`${resolveRevenueExecutorUrl()}/revenue/actions`, {
    method: "GET",
  });
  return readResponse(response);
}

export async function revenueExecutorHealth(): Promise<unknown> {
  const response = await fetch(`${resolveRevenueExecutorUrl()}/revenue/health`, {
    method: "GET",
  });
  return readResponse(response);
}
