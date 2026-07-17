import type { ReplyPayload } from "../auto-reply/types.js";

export type PluginApprovalRequestPayload = {
  title: string;
  description?: string | null;
  severity?: "info" | "warn" | "critical";
  pluginId?: string;
  pluginName?: string;
  agentId?: string | null;
  sessionKey?: string | null;
  turnSourceChannel?: string | null;
  turnSourceTo?: string | null;
  turnSourceAccountId?: string | null;
  turnSourceThreadId?: string | number | null;
};

/** A plugin-raised approval request, structurally mirroring ExecApprovalRequest. */
export type PluginApprovalRequest = {
  id: string;
  request: PluginApprovalRequestPayload;
  createdAtMs: number;
  expiresAtMs: number;
};

export type PluginApprovalPendingReplyParams = {
  request: PluginApprovalRequest;
  nowMs?: number;
};

function buildFence(text: string, language?: string): string {
  let fence = "```";
  while (text.includes(fence)) {
    fence += "`";
  }
  const languagePrefix = language ? language : "";
  return `${fence}${languagePrefix}\n${text}\n${fence}`;
}

/** Builds the pending-approval reply text/metadata for a plugin-raised approval request. */
export function buildPluginApprovalPendingReplyPayload(
  params: PluginApprovalPendingReplyParams,
): ReplyPayload {
  const { request, nowMs } = params;
  const lines: string[] = [];
  lines.push("Plugin approval required.");
  lines.push(buildFence(request.request.title, "txt"));
  if (request.request.description) {
    lines.push(buildFence(request.request.description, "txt"));
  }
  const info: string[] = [];
  if (request.request.severity) {
    info.push(`Severity: ${request.request.severity}`);
  }
  if (request.request.pluginName || request.request.pluginId) {
    info.push(`Plugin: ${request.request.pluginName ?? request.request.pluginId}`);
  }
  if (typeof request.expiresAtMs === "number" && Number.isFinite(request.expiresAtMs)) {
    const expiresInSec = Math.max(
      0,
      Math.round((request.expiresAtMs - (nowMs ?? Date.now())) / 1000),
    );
    info.push(`Expires in: ${expiresInSec}s`);
  }
  info.push(`Full id: \`${request.id}\``);
  lines.push(info.join("\n"));

  return {
    text: lines.join("\n\n"),
    channelData: {
      pluginApproval: {
        approvalId: request.id,
        allowedDecisions: ["allow-once", "allow-always", "deny"],
      },
    },
  };
}
