import { normalizeAccountId } from "../routing/session-key.js";

export function resolveApprovalRequestChannelAccountId(params: {
  request: { request?: { turnSourceChannel?: string | null; turnSourceAccountId?: string | null } };
  channel: string;
  cfg?: unknown;
}): string | undefined {
  const request = params.request?.request;
  if (!request) {
    return undefined;
  }
  const sourceChannel = request.turnSourceChannel?.trim().toLowerCase();
  if (sourceChannel && sourceChannel !== params.channel.toLowerCase()) {
    return undefined;
  }
  return request.turnSourceAccountId?.trim() || undefined;
}

export function doesApprovalRequestMatchChannelAccount(params: {
  request: { request?: { turnSourceChannel?: string | null; turnSourceAccountId?: string | null } };
  channel: string;
  accountId?: string | null;
  cfg?: unknown;
}): boolean {
  const boundAccountId = resolveApprovalRequestChannelAccountId(params);
  if (!boundAccountId || !params.accountId) {
    return true;
  }
  return normalizeAccountId(boundAccountId) === normalizeAccountId(params.accountId);
}

/** Build a resolver that matches an exec/plugin approval request's origin target against the active session target. */
export function createChannelNativeOriginTargetResolver<T>(params: T): T {
  return params;
}

/** Build a resolver that maps a channel's configured approvers onto DM delivery targets. */
export function createChannelApproverDmTargetResolver<T>(params: T): T {
  return params;
}

/** Build a stable dedupe key for a channel approval delivery target (thread-aware). */
export function buildChannelApprovalNativeTargetKey(target: {
  to: string;
  threadId?: number | string | null;
}): string {
  return target.threadId != null ? `${target.to}:${target.threadId}` : target.to;
}
