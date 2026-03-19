import type { AgentToolResult, AgentToolUpdateCallback } from "@mariozechner/pi-agent-core";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { createPluginLoaderLogger } from "./logger.js";
import { loadOpenClawPlugins } from "./loader.js";
import type { OpenClawPluginToolContext } from "./types.js";
import {
  installSandboxNetworkGuards,
  serializeSandboxError,
  type SandboxWirePayload,
} from "./tool-sandbox.js";

type PluginToolSandboxPayload = SandboxWirePayload<{
  pluginId: string;
  toolName: string;
  toolCallId: string;
  args: unknown;
  context: OpenClawPluginToolContext;
  loaderEnv?: NodeJS.ProcessEnv;
  secrets?: Record<string, string>;
  allowGatewaySubagentBinding?: boolean;
}>;

const log = createSubsystemLogger("plugins/sandbox");

function send(message: unknown) {
  if (typeof process.send === "function") {
    process.send(message);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function runToolFromPayload(payload: PluginToolSandboxPayload): Promise<AgentToolResult<unknown>> {
  installSandboxNetworkGuards(payload.allowedHosts);
  if (isPlainObject(payload.payload.secrets)) {
    (globalThis as Record<string, unknown>).__OPENCLAW_SANDBOX_SECRETS__ = payload.payload.secrets;
  }

  const registry = loadOpenClawPlugins({
    config: payload.payload.context.config,
    workspaceDir: payload.payload.context.workspaceDir,
    runtimeOptions: payload.payload.allowGatewaySubagentBinding
      ? { allowGatewaySubagentBinding: true }
      : undefined,
    env: payload.payload.loaderEnv ?? {},
    logger: createPluginLoaderLogger(log),
  });

  const entry = registry.tools.find((item) => item.pluginId === payload.payload.pluginId);
  if (!entry) {
    throw new Error(`Plugin tool entry not found: ${payload.payload.pluginId}`);
  }

  const resolved = entry.factory(payload.payload.context);
  const toolList = Array.isArray(resolved) ? resolved : resolved ? [resolved] : [];
  const tool = toolList.find((item) => item.name === payload.payload.toolName);
  if (!tool) {
    throw new Error(
      `Plugin tool not found: ${payload.payload.pluginId}:${payload.payload.toolName}`,
    );
  }

  const onUpdate: AgentToolUpdateCallback<unknown> = (update) => {
    send({ type: "update", payload: update });
  };

  return await tool.execute(payload.payload.toolCallId, payload.payload.args, undefined, onUpdate);
}

process.on("message", async (message: PluginToolSandboxPayload) => {
  try {
    const result = await runToolFromPayload(message);
    send({ type: "result", payload: result });
  } catch (error) {
    send({ type: "error", error: serializeSandboxError(error) });
  } finally {
    process.disconnect?.();
  }
});
