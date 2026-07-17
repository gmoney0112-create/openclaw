import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";
import { defineChannelPluginEntry, definePluginEntry, defineSetupPluginEntry } from "./core.js";
import type { AnyAgentTool, OpenClawPluginApi } from "./plugin-entry.js";

export type { AnyAgentTool, OpenClawPluginApi } from "./plugin-entry.js";

type BundledEntryRef = {
  specifier: string;
  exportName: string;
};

type BundledChannelEntryOptions = {
  id: string;
  name: string;
  description: string;
  importMetaUrl: string;
  plugin: BundledEntryRef;
  runtime?: BundledEntryRef;
  registerFull?: (api: OpenClawPluginApi) => void;
};

type BundledChannelSetupEntryOptions = {
  importMetaUrl: string;
  plugin: BundledEntryRef;
  secrets?: BundledEntryRef;
  features?: Record<string, unknown>;
};

function resolveBundledModulePath(importMetaUrl: string, specifier: string): string {
  if (!specifier.startsWith(".")) {
    return specifier;
  }
  const importerPath = fileURLToPath(importMetaUrl);
  return path.resolve(path.dirname(importerPath), specifier);
}

function resolveLoadedExport<T>(moduleValue: unknown, exportName: string, specifier: string): T {
  const namespace =
    moduleValue && typeof moduleValue === "object" && "default" in moduleValue
      ? (moduleValue as { default: unknown })
      : undefined;
  const candidate =
    moduleValue && typeof moduleValue === "object"
      ? (moduleValue as Record<string, unknown>)[exportName]
      : undefined;
  const defaultCandidate =
    namespace && namespace.default && typeof namespace.default === "object"
      ? (namespace.default as Record<string, unknown>)[exportName]
      : undefined;
  const resolved = candidate ?? defaultCandidate;
  if (resolved === undefined) {
    throw new Error(`Missing export "${exportName}" from bundled module ${specifier}`);
  }
  return resolved as T;
}

export function loadBundledEntryExportSync<T>(importMetaUrl: string, ref: BundledEntryRef): T {
  const resolvedPath = resolveBundledModulePath(importMetaUrl, ref.specifier);
  const jiti = createJiti(importMetaUrl, {
    interopDefault: true,
    tryNative: false,
  });
  const loaded = jiti(resolvedPath);
  return resolveLoadedExport<T>(loaded, ref.exportName, ref.specifier);
}

export function defineBundledChannelEntry(options: BundledChannelEntryOptions) {
  try {
    const plugin = loadBundledEntryExportSync(options.importMetaUrl, options.plugin);
    const setRuntime = options.runtime
      ? loadBundledEntryExportSync<(runtime: unknown) => void>(
          options.importMetaUrl,
          options.runtime,
        )
      : undefined;
    return defineChannelPluginEntry({
      id: options.id,
      name: options.name,
      description: options.description,
      plugin,
      ...(setRuntime ? { setRuntime } : {}),
      ...(options.registerFull ? { registerFull: options.registerFull } : {}),
    });
  } catch (err) {
    // Fail-soft: a bundled channel that cannot resolve its plugin module at import
    // time must not crash the whole process. The gateway isolates plugin imports in
    // try/catch, but the CLI plugin loader does not, so an unresolved specifier here
    // was aborting `openclaw <cmd>` entirely. Degrade to an inert entry so discovery
    // continues; the channel is simply unavailable until its load issue is fixed.
    console.error(
      `[plugins] bundled channel "${options.id}" failed to load and was skipped: ${String(err)}`,
    );
    return definePluginEntry({
      id: options.id,
      name: options.name,
      description: options.description,
      register() {
        // Inert: the plugin module did not resolve, so there is nothing to register.
      },
    });
  }
}

export function defineBundledChannelSetupEntry(options: BundledChannelSetupEntryOptions) {
  try {
    const plugin = loadBundledEntryExportSync(options.importMetaUrl, options.plugin);
    return {
      ...defineSetupPluginEntry(plugin),
      ...(options.secrets
        ? {
            secrets: loadBundledEntryExportSync(options.importMetaUrl, options.secrets),
          }
        : {}),
      ...(options.features ? { features: options.features } : {}),
    };
  } catch (err) {
    // Fail-soft (see defineBundledChannelEntry): an unresolved setup-plugin module
    // must not abort CLI/gateway startup at import time. Degrade to an inert setup
    // entry so discovery continues; this channel's setup flow is unavailable.
    console.error(
      `[plugins] bundled channel setup entry failed to load and was skipped: ${String(err)}`,
    );
    return {
      ...defineSetupPluginEntry(undefined),
      ...(options.features ? { features: options.features } : {}),
    };
  }
}
