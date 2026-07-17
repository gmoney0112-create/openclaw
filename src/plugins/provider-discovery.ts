import { normalizeProviderId } from "../agents/model-selection.js";
import type { OpenClawConfig } from "../config/config.js";
import type { ModelProviderConfig } from "../config/types.js";
import { resolvePluginProviders } from "./providers.js";
import type {
  ProviderCatalogOrder,
  ProviderDiscoveryOrder,
  ProviderPlugin,
  ProviderPluginCatalog,
} from "./types.js";

const DISCOVERY_ORDER: readonly ProviderDiscoveryOrder[] = ["simple", "profile", "paired", "late"];

/**
 * Some bundled provider plugins predate the current `catalog.run` contract and
 * still ship a `buildProvider()` factory instead (zero/optional-arg, returns
 * ModelProviderConfig directly or via Promise). Recognize that legacy shape and
 * adapt it to `run` here rather than requiring every such plugin to be rewritten.
 */
type LegacyProviderCatalogHook = {
  order?: ProviderCatalogOrder;
  buildProvider: () => ModelProviderConfig | Promise<ModelProviderConfig>;
};

function isLegacyProviderCatalogHook(
  hook: ProviderPluginCatalog | LegacyProviderCatalogHook,
): hook is LegacyProviderCatalogHook {
  return (
    typeof (hook as LegacyProviderCatalogHook).buildProvider === "function" &&
    typeof (hook as ProviderPluginCatalog).run !== "function"
  );
}

function resolveProviderCatalogHook(provider: ProviderPlugin): ProviderPluginCatalog | undefined {
  const hook = provider.catalog ?? provider.discovery;
  if (!hook) {
    return undefined;
  }
  if (isLegacyProviderCatalogHook(hook)) {
    return {
      order: hook.order,
      run: async () => ({ provider: await hook.buildProvider() }),
    };
  }
  return hook;
}

export function resolvePluginDiscoveryProviders(params: {
  config?: OpenClawConfig;
  workspaceDir?: string;
  env?: NodeJS.ProcessEnv;
}): ProviderPlugin[] {
  return resolvePluginProviders({
    ...params,
    bundledProviderAllowlistCompat: true,
  }).filter((provider) => resolveProviderCatalogHook(provider));
}

export function groupPluginDiscoveryProvidersByOrder(
  providers: ProviderPlugin[],
): Record<ProviderDiscoveryOrder, ProviderPlugin[]> {
  const grouped = {
    simple: [],
    profile: [],
    paired: [],
    late: [],
  } as Record<ProviderDiscoveryOrder, ProviderPlugin[]>;

  for (const provider of providers) {
    const order = resolveProviderCatalogHook(provider)?.order ?? "late";
    grouped[order].push(provider);
  }

  for (const order of DISCOVERY_ORDER) {
    grouped[order].sort((a, b) => a.label.localeCompare(b.label));
  }

  return grouped;
}

export function normalizePluginDiscoveryResult(params: {
  provider: ProviderPlugin;
  result:
    | { provider: ModelProviderConfig }
    | { providers: Record<string, ModelProviderConfig> }
    | null
    | undefined;
}): Record<string, ModelProviderConfig> {
  const result = params.result;
  if (!result) {
    return {};
  }

  if ("provider" in result) {
    return { [normalizeProviderId(params.provider.id)]: result.provider };
  }

  const normalized: Record<string, ModelProviderConfig> = {};
  for (const [key, value] of Object.entries(result.providers)) {
    const normalizedKey = normalizeProviderId(key);
    if (!normalizedKey || !value) {
      continue;
    }
    normalized[normalizedKey] = value;
  }
  return normalized;
}

export function runProviderCatalog(params: {
  provider: ProviderPlugin;
  config: OpenClawConfig;
  agentDir?: string;
  workspaceDir?: string;
  env: NodeJS.ProcessEnv;
  resolveProviderApiKey: (providerId?: string) => {
    apiKey: string | undefined;
    discoveryApiKey?: string;
  };
  resolveProviderAuth: (
    providerId?: string,
    options?: { oauthMarker?: string },
  ) => {
    apiKey: string | undefined;
    discoveryApiKey?: string;
    mode: "api_key" | "oauth" | "token" | "none";
    source: "env" | "profile" | "none";
    profileId?: string;
  };
}) {
  return resolveProviderCatalogHook(params.provider)?.run({
    config: params.config,
    agentDir: params.agentDir,
    workspaceDir: params.workspaceDir,
    env: params.env,
    resolveProviderApiKey: params.resolveProviderApiKey,
    resolveProviderAuth: params.resolveProviderAuth,
  });
}
