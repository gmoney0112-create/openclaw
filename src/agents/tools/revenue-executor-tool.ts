import { Type } from "@sinclair/typebox";
import { stringEnum } from "../schema/typebox.js";
import { jsonResult, readNumberParam, readStringParam, ToolInputError, type AnyAgentTool } from "./common.js";

const REVENUE_TOOL_ACTIONS = ["execute", "health", "actions"] as const;

const RevenueExecutorToolSchema = Type.Object({
  action: stringEnum(REVENUE_TOOL_ACTIONS),
  revenueAction: Type.Optional(Type.String()),
  sessionId: Type.Optional(Type.String()),
  context: Type.Optional(Type.String()),
  payload: Type.Optional(Type.Object({}, { additionalProperties: true })),
  timeoutMs: Type.Optional(Type.Number()),
});

function resolveBaseUrl(): string {
  const raw = process.env.REVENUE_EXECUTOR_URL?.trim() || "http://localhost:3110";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

async function callRevenue(path: string, init: RequestInit, timeoutMs?: number): Promise<unknown> {
  const controller = new AbortController();
  const timeout =
    typeof timeoutMs === "number" && Number.isFinite(timeoutMs) && timeoutMs > 0 ? Math.floor(timeoutMs) : 15_000;
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${resolveBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
    });
    const text = await response.text();
    const parsed = text ? JSON.parse(text) : {};
    if (!response.ok) {
      const message =
        typeof parsed === "object" && parsed !== null && "error" in parsed
          ? String((parsed as { error: unknown }).error)
          : `HTTP ${response.status}`;
      throw new Error(message);
    }
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

export function createRevenueExecutorTool(): AnyAgentTool {
  return {
    label: "Revenue Executor",
    name: "revenue_executor",
    description:
      "Execute revenue orchestration actions via the revenue-executor service mesh, and inspect its health/actions.",
    parameters: RevenueExecutorToolSchema,
    execute: async (
      _toolCallId: string,
      args: Record<string, unknown>,
      _signal?: AbortSignal,
      _onUpdate?: (update: unknown) => void,
    ) => {
      const params = args as Record<string, unknown>;
      const action = readStringParam(params, "action", { required: true });
      const timeoutMs = readNumberParam(params, "timeoutMs", { integer: true });

      if (action === "health") {
        const result = await callRevenue("/revenue/health", { method: "GET" }, timeoutMs);
        return jsonResult({ ok: true, result });
      }

      if (action === "actions") {
        const result = await callRevenue("/revenue/actions", { method: "GET" }, timeoutMs);
        return jsonResult({ ok: true, result });
      }

      if (action !== "execute") {
        throw new ToolInputError(`Unknown action: ${action}`);
      }

      const revenueAction = readStringParam(params, "revenueAction", {
        required: true,
        label: "revenueAction",
      });
      const sessionId = readStringParam(params, "sessionId");
      const context = readStringParam(params, "context", { allowEmpty: true });
      const payload =
        typeof params.payload === "object" && params.payload !== null
          ? (params.payload as Record<string, unknown>)
          : {};

      const result = await callRevenue(
        "/revenue/execute",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: revenueAction,
            session_id: sessionId,
            context,
            payload,
          }),
        },
        timeoutMs,
      );

      return jsonResult({ ok: true, result });
    },
  };
}
