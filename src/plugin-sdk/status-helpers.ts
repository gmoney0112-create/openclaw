import type { ChannelStatusAdapter } from "../channels/plugins/types.adapters.js";
import type { ChannelAccountSnapshot, ChannelStatusIssue } from "../channels/plugins/types.js";

type RuntimeLifecycleSnapshot = {
  running?: boolean | null;
  lastStartAt?: number | null;
  lastStopAt?: number | null;
  lastError?: string | null;
  lastInboundAt?: number | null;
  lastOutboundAt?: number | null;
};

/** Create the baseline runtime snapshot shape used by channel/account status stores. */
export function createDefaultChannelRuntimeState<T extends Record<string, unknown>>(
  accountId: string,
  extra?: T,
): {
  accountId: string;
  running: false;
  lastStartAt: null;
  lastStopAt: null;
  lastError: null;
} & T {
  return {
    accountId,
    running: false,
    lastStartAt: null,
    lastStopAt: null,
    lastError: null,
    ...(extra ?? ({} as T)),
  };
}

/** Normalize a channel-level status summary so missing lifecycle fields become explicit nulls. */
export function buildBaseChannelStatusSummary(snapshot: {
  configured?: boolean | null;
  running?: boolean | null;
  lastStartAt?: number | null;
  lastStopAt?: number | null;
  lastError?: string | null;
}) {
  return {
    configured: snapshot.configured ?? false,
    running: snapshot.running ?? false,
    lastStartAt: snapshot.lastStartAt ?? null,
    lastStopAt: snapshot.lastStopAt ?? null,
    lastError: snapshot.lastError ?? null,
  };
}

/** Extend the base summary with probe fields while preserving stable null defaults. */
export function buildProbeChannelStatusSummary<TExtra extends Record<string, unknown>>(
  snapshot: {
    configured?: boolean | null;
    running?: boolean | null;
    lastStartAt?: number | null;
    lastStopAt?: number | null;
    lastError?: string | null;
    probe?: unknown;
    lastProbeAt?: number | null;
  },
  extra?: TExtra,
) {
  return {
    ...buildBaseChannelStatusSummary(snapshot),
    ...(extra ?? ({} as TExtra)),
    probe: snapshot.probe,
    lastProbeAt: snapshot.lastProbeAt ?? null,
  };
}

/** Build the standard per-account status payload from config metadata plus runtime state. */
export function buildBaseAccountStatusSnapshot(params: {
  account: {
    accountId: string;
    name?: string;
    enabled?: boolean;
    configured?: boolean;
  };
  runtime?: RuntimeLifecycleSnapshot | null;
  probe?: unknown;
}) {
  const { account, runtime, probe } = params;
  return {
    accountId: account.accountId,
    name: account.name,
    enabled: account.enabled,
    configured: account.configured,
    ...buildRuntimeAccountStatusSnapshot({ runtime, probe }),
    lastInboundAt: runtime?.lastInboundAt ?? null,
    lastOutboundAt: runtime?.lastOutboundAt ?? null,
  };
}

/** Convenience wrapper when the caller already has flattened account fields instead of an account object. */
export function buildComputedAccountStatusSnapshot(params: {
  accountId: string;
  name?: string;
  enabled?: boolean;
  configured?: boolean;
  runtime?: RuntimeLifecycleSnapshot | null;
  probe?: unknown;
}) {
  const { accountId, name, enabled, configured, runtime, probe } = params;
  return buildBaseAccountStatusSnapshot({
    account: {
      accountId,
      name,
      enabled,
      configured,
    },
    runtime,
    probe,
  });
}

/** Normalize runtime-only account state into the shared status snapshot fields. */
export function buildRuntimeAccountStatusSnapshot(params: {
  runtime?: RuntimeLifecycleSnapshot | null;
  probe?: unknown;
}) {
  const { runtime, probe } = params;
  return {
    running: runtime?.running ?? false,
    lastStartAt: runtime?.lastStartAt ?? null,
    lastStopAt: runtime?.lastStopAt ?? null,
    lastError: runtime?.lastError ?? null,
    probe,
  };
}

/** Build token-based channel status summaries with optional mode reporting. */
export function buildTokenChannelStatusSummary(
  snapshot: {
    configured?: boolean | null;
    tokenSource?: string | null;
    running?: boolean | null;
    mode?: string | null;
    lastStartAt?: number | null;
    lastStopAt?: number | null;
    lastError?: string | null;
    probe?: unknown;
    lastProbeAt?: number | null;
  },
  opts?: { includeMode?: boolean },
) {
  const base = {
    ...buildBaseChannelStatusSummary(snapshot),
    tokenSource: snapshot.tokenSource ?? "none",
    probe: snapshot.probe,
    lastProbeAt: snapshot.lastProbeAt ?? null,
  };
  if (opts?.includeMode === false) {
    return base;
  }
  return {
    ...base,
    mode: snapshot.mode ?? null,
  };
}

/** Build a full ChannelStatusAdapter from a simplified per-account snapshot resolver. */
export function createComputedAccountStatusAdapter<
  ResolvedAccount,
  Probe = unknown,
  Audit = unknown,
>(params: {
  defaultRuntime?: ChannelAccountSnapshot;
  resolveAccountSnapshot: (snapshotParams: {
    account: ResolvedAccount;
    runtime?: ChannelAccountSnapshot;
    probe?: Probe;
    audit?: Audit;
  }) => {
    accountId: string;
    name?: string;
    enabled?: boolean;
    configured?: boolean;
    extra?: Record<string, unknown>;
  };
  collectStatusIssues?: ChannelStatusAdapter<ResolvedAccount, Probe, Audit>["collectStatusIssues"];
  buildChannelSummary?: ChannelStatusAdapter<ResolvedAccount, Probe, Audit>["buildChannelSummary"];
  probeAccount?: ChannelStatusAdapter<ResolvedAccount, Probe, Audit>["probeAccount"];
  formatCapabilitiesProbe?: ChannelStatusAdapter<
    ResolvedAccount,
    Probe,
    Audit
  >["formatCapabilitiesProbe"];
  auditAccount?: ChannelStatusAdapter<ResolvedAccount, Probe, Audit>["auditAccount"];
  buildCapabilitiesDiagnostics?: ChannelStatusAdapter<
    ResolvedAccount,
    Probe,
    Audit
  >["buildCapabilitiesDiagnostics"];
  resolveAccountState?: ChannelStatusAdapter<ResolvedAccount, Probe, Audit>["resolveAccountState"];
  logSelfId?: ChannelStatusAdapter<ResolvedAccount, Probe, Audit>["logSelfId"];
  skipStaleSocketHealthCheck?: boolean;
}): ChannelStatusAdapter<ResolvedAccount, Probe, Audit> {
  return {
    defaultRuntime: params.defaultRuntime,
    collectStatusIssues: params.collectStatusIssues,
    buildChannelSummary: params.buildChannelSummary,
    probeAccount: params.probeAccount,
    formatCapabilitiesProbe: params.formatCapabilitiesProbe,
    auditAccount: params.auditAccount,
    buildCapabilitiesDiagnostics: params.buildCapabilitiesDiagnostics,
    resolveAccountState: params.resolveAccountState,
    logSelfId: params.logSelfId,
    buildAccountSnapshot: ({ account, runtime, probe, audit }) => {
      const resolved = params.resolveAccountSnapshot({ account, runtime, probe, audit });
      return {
        ...params.defaultRuntime,
        ...runtime,
        accountId: resolved.accountId,
        name: resolved.name,
        enabled: resolved.enabled,
        configured: resolved.configured,
        probe,
        ...resolved.extra,
      } as ChannelAccountSnapshot;
    },
  };
}

/** Async twin of createComputedAccountStatusAdapter for channels whose per-account snapshot requires awaiting I/O (e.g. checking auth state on disk). */
export function createAsyncComputedAccountStatusAdapter<
  ResolvedAccount,
  Probe = unknown,
  Audit = unknown,
>(params: {
  defaultRuntime?: ChannelAccountSnapshot;
  resolveAccountSnapshot: (snapshotParams: {
    account: ResolvedAccount;
    runtime?: ChannelAccountSnapshot;
    probe?: Probe;
    audit?: Audit;
  }) => Promise<{
    accountId: string;
    name?: string;
    enabled?: boolean;
    configured?: boolean;
    extra?: Record<string, unknown>;
  }>;
  collectStatusIssues?: ChannelStatusAdapter<ResolvedAccount, Probe, Audit>["collectStatusIssues"];
  buildChannelSummary?: ChannelStatusAdapter<ResolvedAccount, Probe, Audit>["buildChannelSummary"];
  probeAccount?: ChannelStatusAdapter<ResolvedAccount, Probe, Audit>["probeAccount"];
  formatCapabilitiesProbe?: ChannelStatusAdapter<
    ResolvedAccount,
    Probe,
    Audit
  >["formatCapabilitiesProbe"];
  auditAccount?: ChannelStatusAdapter<ResolvedAccount, Probe, Audit>["auditAccount"];
  buildCapabilitiesDiagnostics?: ChannelStatusAdapter<
    ResolvedAccount,
    Probe,
    Audit
  >["buildCapabilitiesDiagnostics"];
  resolveAccountState?: ChannelStatusAdapter<ResolvedAccount, Probe, Audit>["resolveAccountState"];
  logSelfId?: ChannelStatusAdapter<ResolvedAccount, Probe, Audit>["logSelfId"];
  skipStaleSocketHealthCheck?: boolean;
}): ChannelStatusAdapter<ResolvedAccount, Probe, Audit> {
  return {
    defaultRuntime: params.defaultRuntime,
    collectStatusIssues: params.collectStatusIssues,
    buildChannelSummary: params.buildChannelSummary,
    probeAccount: params.probeAccount,
    formatCapabilitiesProbe: params.formatCapabilitiesProbe,
    auditAccount: params.auditAccount,
    buildCapabilitiesDiagnostics: params.buildCapabilitiesDiagnostics,
    resolveAccountState: params.resolveAccountState,
    logSelfId: params.logSelfId,
    buildAccountSnapshot: async ({ account, runtime, probe, audit }) => {
      const resolved = await params.resolveAccountSnapshot({ account, runtime, probe, audit });
      return {
        ...params.defaultRuntime,
        ...runtime,
        accountId: resolved.accountId,
        name: resolved.name,
        enabled: resolved.enabled,
        configured: resolved.configured,
        probe,
        ...resolved.extra,
      } as ChannelAccountSnapshot;
    },
  };
}

/** Convert account runtime errors into the generic channel status issue format. */
export function collectStatusIssuesFromLastError(
  channel: string,
  accounts: Array<{ accountId: string; lastError?: unknown }>,
): ChannelStatusIssue[] {
  return accounts.flatMap((account) => {
    const lastError = typeof account.lastError === "string" ? account.lastError.trim() : "";
    if (!lastError) {
      return [];
    }
    return [
      {
        channel,
        accountId: account.accountId,
        kind: "runtime",
        message: `Channel error: ${lastError}`,
      },
    ];
  });
}
