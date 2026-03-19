import { normalizeToolName } from "../agents/tool-policy.js";
import type { AnyAgentTool } from "../agents/tools/common.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { applyTestPluginDefaults, normalizePluginsConfig } from "./config-state.js";
import { loadOpenClawPlugins } from "./loader.js";
import { createPluginLoaderLogger } from "./logger.js";
import {
  resolveSiblingWorkerPath,
  runInSandbox,
  type SandboxWirePayload,
} from "./tool-sandbox.js";
import type { OpenClawPluginToolContext } from "./types.js";

const log = createSubsystemLogger("plugins");
const PLUGIN_TOOL_SANDBOX_WORKER = resolveSiblingWorkerPath("plugin-tool-sandbox-worker");
const PLUGIN_SANDBOX_TIMEOUT_MS = 5_000;

const PLUGIN_SANDBOX_ALLOWLISTS: Record<string, string[]> = {
  "revenue-executor": [
    "api.gohighlevel.com",
    "services.leadconnectorhq.com",
    "api.stripe.com",
  ],
};

const NON_SECRET_PLUGIN_ENV_KEYS = new Set([
  "APPDATA",
  "HOME",
  "LOCALAPPDATA",
  "NODE_ENV",
  "OPENCLAW_AGENT_DIR",
  "OPENCLAW_CONFIG_DIR",
  "OPENCLAW_HOME",
  "OPENCLAW_PLUGIN_DIR",
  "PATH",
  "TMP",
  "TEMP",
  "USERPROFILE",
]);

const PLUGIN_SECRET_ENV_KEYS: Record<string, string[]> = {
  "revenue-executor": [
    "GHL_API_KEY",
    "GHL_LOCATION_ID",
    "OPENAI_API_KEY",
    "STRIPE_API_KEY",
    "STRIPE_SECRET",
    "STRIPE_SECRET_KEY",
  ],
};

type PluginToolMeta = {
  pluginId: string;
  optional: boolean;
};

const pluginToolMeta = new WeakMap<AnyAgentTool, PluginToolMeta>();

export function getPluginToolMeta(tool: AnyAgentTool): PluginToolMeta | undefined {
  return pluginToolMeta.get(tool);
}

function normalizeAllowlist(list?: string[]) {
  return new Set((list ?? []).map(normalizeToolName).filter(Boolean));
}

function pickPluginLoaderEnv(env?: NodeJS.ProcessEnv): NodeJS.ProcessEnv | undefined {
  if (!env) {
    return undefined;
  }
  const picked: NodeJS.ProcessEnv = {};
  for (const key of NON_SECRET_PLUGIN_ENV_KEYS) {
    const value = env[key];
    if (typeof value === "string" && value) {
      picked[key] = value;
    }
  }
  return Object.keys(picked).length > 0 ? picked : undefined;
}

function pickPluginSecrets(pluginId: string, env?: NodeJS.ProcessEnv): Record<string, string> | undefined {
  if (!env) {
    return undefined;
  }
  const keys = PLUGIN_SECRET_ENV_KEYS[pluginId] ?? [];
  const picked: Record<string, string> = {};
  for (const key of keys) {
    const value = env[key];
    if (typeof value === "string" && value) {
      picked[key] = value;
    }
  }
  return Object.keys(picked).length > 0 ? picked : undefined;
}

function wrapPluginToolWithSandbox(params: {
  tool: AnyAgentTool;
  pluginId: string;
  context: OpenClawPluginToolContext;
  env?: NodeJS.ProcessEnv;
  allowGatewaySubagentBinding?: boolean;
}): AnyAgentTool {
  const { tool } = params;
  if (typeof tool.execute !== "function") {
    return tool;
  }
  const allowedHosts = PLUGIN_SANDBOX_ALLOWLISTS[params.pluginId];
  const loaderEnv = pickPluginLoaderEnv(params.env);
  const secrets = pickPluginSecrets(params.pluginId, params.env);

  return {
    ...tool,
    execute: async (toolCallId, args, signal, onUpdate) => {
      if (signal?.aborted) {
        const error = new Error("Tool execution aborted");
        error.name = "AbortError";
        throw error;
      }

      let abortHandler: (() => void) | undefined;
      const runPromise = runInSandbox<
        SandboxWirePayload<{
          pluginId: string;
          toolName: string;
          toolCallId: string;
          args: unknown;
          context: OpenClawPluginToolContext;
          loaderEnv?: NodeJS.ProcessEnv;
          secrets?: Record<string, string>;
          allowGatewaySubagentBinding?: boolean;
        }>,
        unknown
      >({
        workerPath: PLUGIN_TOOL_SANDBOX_WORKER,
        timeoutMs: PLUGIN_SANDBOX_TIMEOUT_MS,
        onUpdate,
        payload: {
          allowedHosts,
          payload: {
            pluginId: params.pluginId,
            toolName: tool.name,
            toolCallId,
            args,
            context: params.context,
            loaderEnv,
            secrets,
            allowGatewaySubagentBinding: params.allowGatewaySubagentBinding,
          },
        },
      });

      const abortPromise =
        signal != null
          ? new Promise<never>((_, reject) => {
              abortHandler = () => {
                const error = new Error("Tool execution aborted");
                error.name = "AbortError";
                reject(error);
              };
              signal.addEventListener("abort", abortHandler, { once: true });
            })
          : null;

      try {
        return (await (abortPromise ? Promise.race([runPromise, abortPromise]) : runPromise)) as never;
      } finally {
        if (signal && abortHandler) {
          signal.removeEventListener("abort", abortHandler);
        }
      }
    },
  };
}

function isOptionalToolAllowed(params: {
  toolName: string;
  pluginId: string;
  allowlist: Set<string>;
}): boolean {
  if (params.allowlist.size === 0) {
    return false;
  }
  const toolName = normalizeToolName(params.toolName);
  if (params.allowlist.has(toolName)) {
    return true;
  }
  const pluginKey = normalizeToolName(params.pluginId);
  if (params.allowlist.has(pluginKey)) {
    return true;
  }
  return params.allowlist.has("group:plugins");
}

export function resolvePluginTools(params: {
  context: OpenClawPluginToolContext;
  existingToolNames?: Set<string>;
  toolAllowlist?: string[];
  suppressNameConflicts?: boolean;
  allowGatewaySubagentBinding?: boolean;
  env?: NodeJS.ProcessEnv;
}): AnyAgentTool[] {
  // Fast path: when plugins are effectively disabled, avoid discovery/jiti entirely.
  // This matters a lot for unit tests and for tool construction hot paths.
  const env = params.env ?? process.env;
  const effectiveConfig = applyTestPluginDefaults(params.context.config ?? {}, env);
  const normalized = normalizePluginsConfig(effectiveConfig.plugins);
  if (!normalized.enabled) {
    return [];
  }

  const registry = loadOpenClawPlugins({
    config: effectiveConfig,
    workspaceDir: params.context.workspaceDir,
    runtimeOptions: params.allowGatewaySubagentBinding
      ? {
          allowGatewaySubagentBinding: true,
        }
      : undefined,
    env,
    logger: createPluginLoaderLogger(log),
  });

  const tools: AnyAgentTool[] = [];
  const existing = params.existingToolNames ?? new Set<string>();
  const existingNormalized = new Set(Array.from(existing, (tool) => normalizeToolName(tool)));
  const allowlist = normalizeAllowlist(params.toolAllowlist);
  const blockedPlugins = new Set<string>();

  for (const entry of registry.tools) {
    if (blockedPlugins.has(entry.pluginId)) {
      continue;
    }
    const pluginIdKey = normalizeToolName(entry.pluginId);
    if (existingNormalized.has(pluginIdKey)) {
      const message = `plugin id conflicts with core tool name (${entry.pluginId})`;
      if (!params.suppressNameConflicts) {
        log.error(message);
        registry.diagnostics.push({
          level: "error",
          pluginId: entry.pluginId,
          source: entry.source,
          message,
        });
      }
      blockedPlugins.add(entry.pluginId);
      continue;
    }
    let resolved: AnyAgentTool | AnyAgentTool[] | null | undefined = null;
    try {
      resolved = entry.factory(params.context);
    } catch (err) {
      log.error(`plugin tool failed (${entry.pluginId}): ${String(err)}`);
      continue;
    }
    if (!resolved) {
      continue;
    }
    const listRaw = Array.isArray(resolved) ? resolved : [resolved];
    const list = entry.optional
      ? listRaw.filter((tool) =>
          isOptionalToolAllowed({
            toolName: tool.name,
            pluginId: entry.pluginId,
            allowlist,
          }),
        )
      : listRaw;
    if (list.length === 0) {
      continue;
    }
    const nameSet = new Set<string>();
    for (const tool of list) {
      if (nameSet.has(tool.name) || existing.has(tool.name)) {
        const message = `plugin tool name conflict (${entry.pluginId}): ${tool.name}`;
        if (!params.suppressNameConflicts) {
          log.error(message);
          registry.diagnostics.push({
            level: "error",
            pluginId: entry.pluginId,
            source: entry.source,
            message,
          });
        }
        continue;
      }
      nameSet.add(tool.name);
      existing.add(tool.name);
      const wrappedTool = wrapPluginToolWithSandbox({
        tool,
        pluginId: entry.pluginId,
        context: params.context,
        env,
        allowGatewaySubagentBinding: params.allowGatewaySubagentBinding,
      });
      pluginToolMeta.set(tool, {
        pluginId: entry.pluginId,
        optional: entry.optional,
      });
      pluginToolMeta.set(wrappedTool, {
        pluginId: entry.pluginId,
        optional: entry.optional,
      });
      tools.push(wrappedTool);
    }
  }

  return tools;
}
