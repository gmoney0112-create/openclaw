import path from "node:path";
import type { AnyAgentTool } from "../agents/tools/common.js";
import type { ChannelPlugin } from "../channels/plugins/types.js";
import { registerContextEngineForOwner } from "../context-engine/registry.js";
import type {
  GatewayRequestHandler,
  GatewayRequestHandlers,
} from "../gateway/server-methods/types.js";
import { registerInternalHook } from "../hooks/internal-hooks.js";
import type { HookEntry } from "../hooks/types.js";
import type { CliBackendPlugin } from "../plugin-sdk/cli-backend.js";
import type { RealtimeTranscriptionProviderPlugin } from "../plugin-sdk/realtime-transcription.js";
import type { RealtimeVoiceProviderPlugin } from "../plugin-sdk/realtime-voice.js";
import { resolveUserPath } from "../utils.js";
import { registerPluginCommand, validatePluginCommandDefinition } from "./commands.js";
import { normalizePluginHttpPath } from "./http-path.js";
import { findOverlappingPluginHttpRoute } from "./http-route-overlap.js";
import { registerPluginInteractiveHandler } from "./interactive.js";
import { normalizeRegisteredProvider } from "./provider-validation.js";
import { createEmptyPluginRegistry } from "./registry-empty.js";
import { withPluginRuntimePluginIdScope } from "./runtime/gateway-request-scope.js";
import type { PluginRuntime } from "./runtime/types.js";
import { defaultSlotIdForKey } from "./slots.js";
import {
  isPluginHookName,
  isPromptInjectionHookName,
  stripPromptMutationFieldsFromLegacyHookResult,
} from "./types.js";
import type {
  ImageGenerationProviderPlugin,
  OpenClawPluginApi,
  OpenClawPluginChannelRegistration,
  OpenClawPluginCliRegistrar,
  OpenClawPluginCommandDefinition,
  PluginConversationBindingResolvedEvent,
  OpenClawPluginHttpRouteAuth,
  OpenClawPluginHttpRouteMatch,
  OpenClawPluginHttpRouteHandler,
  OpenClawPluginHttpRouteParams,
  OpenClawPluginHookOptions,
  MediaUnderstandingProviderPlugin,
  ProviderPlugin,
  OpenClawPluginService,
  OpenClawPluginToolContext,
  OpenClawPluginToolFactory,
  PluginConfigUiHint,
  PluginDiagnostic,
  PluginBundleFormat,
  PluginFormat,
  PluginLogger,
  PluginOrigin,
  PluginKind,
  PluginRegistrationMode,
  PluginHookName,
  PluginHookHandlerMap,
  PluginHookRegistration as TypedPluginHookRegistration,
  SpeechProviderPlugin,
  WebSearchProviderPlugin,
  VideoGenerationProviderPlugin,
  MusicGenerationProviderPlugin,
  MemoryEmbeddingProviderPlugin,
  AgentHarnessProviderPlugin,
  SkillProviderPlugin,
  ResearchProviderPlugin,
  OSAutomationProviderPlugin,
  VoiceInterfaceProviderPlugin,
  AutoCoderProviderPlugin,
  DealSourcingProviderPlugin,
  LeadGenerationProviderPlugin,
  SalesAutomationProviderPlugin,
  GrowthHackingProviderPlugin,
  SaaSBuilderProviderPlugin,
  RevenueOptimizationProviderPlugin,
  ContentFactoryProviderPlugin,
  ProjectManagerProviderPlugin,
  DecisionEngineProviderPlugin,
  BusinessLoopProviderPlugin,
} from "./types.js";

export type PluginToolRegistration = {
  pluginId: string;
  pluginName?: string;
  factory: OpenClawPluginToolFactory;
  names: string[];
  optional: boolean;
  source: string;
  rootDir?: string;
};

export type PluginCliRegistration = {
  pluginId: string;
  pluginName?: string;
  register: OpenClawPluginCliRegistrar;
  commands: string[];
  source: string;
  rootDir?: string;
};

export type PluginHttpRouteRegistration = {
  pluginId?: string;
  path: string;
  handler: OpenClawPluginHttpRouteHandler;
  auth: OpenClawPluginHttpRouteAuth;
  match: OpenClawPluginHttpRouteMatch;
  source?: string;
};

export type PluginChannelRegistration = {
  pluginId: string;
  pluginName?: string;
  plugin: ChannelPlugin;
  source: string;
  rootDir?: string;
};

export type PluginChannelSetupRegistration = {
  pluginId: string;
  pluginName?: string;
  plugin: ChannelPlugin;
  source: string;
  enabled: boolean;
  rootDir?: string;
};

export type PluginProviderRegistration = {
  pluginId: string;
  pluginName?: string;
  provider: ProviderPlugin;
  source: string;
  rootDir?: string;
};

type PluginOwnedProviderRegistration<T extends { id: string }> = {
  pluginId: string;
  pluginName?: string;
  provider: T;
  source: string;
  rootDir?: string;
};

export type PluginSpeechProviderRegistration =
  PluginOwnedProviderRegistration<SpeechProviderPlugin>;
export type PluginMediaUnderstandingProviderRegistration =
  PluginOwnedProviderRegistration<MediaUnderstandingProviderPlugin>;
export type PluginImageGenerationProviderRegistration =
  PluginOwnedProviderRegistration<ImageGenerationProviderPlugin>;
export type PluginVideoGenerationProviderRegistration =
  PluginOwnedProviderRegistration<VideoGenerationProviderPlugin>;
export type PluginMusicGenerationProviderRegistration =
  PluginOwnedProviderRegistration<MusicGenerationProviderPlugin>;
export type PluginMemoryEmbeddingProviderRegistration =
  PluginOwnedProviderRegistration<MemoryEmbeddingProviderPlugin>;
export type PluginRealtimeTranscriptionProviderRegistration =
  PluginOwnedProviderRegistration<RealtimeTranscriptionProviderPlugin>;
export type PluginRealtimeVoiceProviderRegistration =
  PluginOwnedProviderRegistration<RealtimeVoiceProviderPlugin>;
export type PluginWebSearchProviderRegistration =
  PluginOwnedProviderRegistration<WebSearchProviderPlugin>;
export type PluginCliBackendRegistration = PluginOwnedProviderRegistration<CliBackendPlugin>;
export type PluginAgentHarnessRegistration =
  PluginOwnedProviderRegistration<AgentHarnessProviderPlugin>;
export type PluginSkillProviderRegistration = PluginOwnedProviderRegistration<SkillProviderPlugin>;
export type PluginResearchProviderRegistration =
  PluginOwnedProviderRegistration<ResearchProviderPlugin>;
export type PluginOSAutomationProviderRegistration =
  PluginOwnedProviderRegistration<OSAutomationProviderPlugin>;
export type PluginVoiceInterfaceProviderRegistration =
  PluginOwnedProviderRegistration<VoiceInterfaceProviderPlugin>;
export type PluginAutoCoderProviderRegistration =
  PluginOwnedProviderRegistration<AutoCoderProviderPlugin>;
export type PluginDealSourcingProviderRegistration =
  PluginOwnedProviderRegistration<DealSourcingProviderPlugin>;
export type PluginLeadGenerationProviderRegistration =
  PluginOwnedProviderRegistration<LeadGenerationProviderPlugin>;
export type PluginSalesAutomationProviderRegistration =
  PluginOwnedProviderRegistration<SalesAutomationProviderPlugin>;
export type PluginGrowthHackingProviderRegistration =
  PluginOwnedProviderRegistration<GrowthHackingProviderPlugin>;
export type PluginSaaSBuilderProviderRegistration =
  PluginOwnedProviderRegistration<SaaSBuilderProviderPlugin>;
export type PluginRevenueOptimizationProviderRegistration =
  PluginOwnedProviderRegistration<RevenueOptimizationProviderPlugin>;
export type PluginContentFactoryProviderRegistration =
  PluginOwnedProviderRegistration<ContentFactoryProviderPlugin>;
export type PluginProjectManagerProviderRegistration =
  PluginOwnedProviderRegistration<ProjectManagerProviderPlugin>;
export type PluginDecisionEngineProviderRegistration =
  PluginOwnedProviderRegistration<DecisionEngineProviderPlugin>;
export type PluginBusinessLoopProviderRegistration =
  PluginOwnedProviderRegistration<BusinessLoopProviderPlugin>;

export type PluginHookRegistration = {
  pluginId: string;
  entry: HookEntry;
  events: string[];
  source: string;
  rootDir?: string;
};

export type PluginServiceRegistration = {
  pluginId: string;
  pluginName?: string;
  service: OpenClawPluginService;
  source: string;
  rootDir?: string;
};

export type PluginCommandRegistration = {
  pluginId: string;
  pluginName?: string;
  command: OpenClawPluginCommandDefinition;
  source: string;
  rootDir?: string;
};

export type PluginConversationBindingResolvedHandlerRegistration = {
  pluginId: string;
  pluginName?: string;
  pluginRoot?: string;
  handler: (event: PluginConversationBindingResolvedEvent) => void | Promise<void>;
  source: string;
  rootDir?: string;
};

export type PluginRecord = {
  id: string;
  name: string;
  version?: string;
  description?: string;
  format?: PluginFormat;
  bundleFormat?: PluginBundleFormat;
  bundleCapabilities?: string[];
  kind?: PluginKind;
  source: string;
  rootDir?: string;
  origin: PluginOrigin;
  workspaceDir?: string;
  enabled: boolean;
  status: "loaded" | "disabled" | "error";
  error?: string;
  toolNames: string[];
  hookNames: string[];
  channelIds: string[];
  providerIds: string[];
  speechProviderIds: string[];
  mediaUnderstandingProviderIds: string[];
  imageGenerationProviderIds: string[];
  videoGenerationProviderIds: string[];
  musicGenerationProviderIds: string[];
  memoryEmbeddingProviderIds: string[];
  realtimeTranscriptionProviderIds: string[];
  realtimeVoiceProviderIds: string[];
  webSearchProviderIds: string[];
  cliBackendIds: string[];
  agentHarnessIds: string[];
  skillProviderIds: string[];
  researchProviderIds: string[];
  osAutomationProviderIds: string[];
  voiceInterfaceProviderIds: string[];
  autoCoderProviderIds: string[];
  dealSourcingProviderIds: string[];
  leadGenerationProviderIds: string[];
  salesAutomationProviderIds: string[];
  growthHackingProviderIds: string[];
  saasBuilderProviderIds: string[];
  revenueOptimizationProviderIds: string[];
  contentFactoryProviderIds: string[];
  projectManagerProviderIds: string[];
  decisionEngineProviderIds: string[];
  businessLoopProviderIds: string[];
  gatewayMethods: string[];
  cliCommands: string[];
  services: string[];
  commands: string[];
  httpRoutes: number;
  hookCount: number;
  configSchema: boolean;
  configUiHints?: Record<string, PluginConfigUiHint>;
  configJsonSchema?: Record<string, unknown>;
};

export type PluginRegistry = {
  plugins: PluginRecord[];
  tools: PluginToolRegistration[];
  hooks: PluginHookRegistration[];
  typedHooks: TypedPluginHookRegistration[];
  channels: PluginChannelRegistration[];
  channelSetups: PluginChannelSetupRegistration[];
  providers: PluginProviderRegistration[];
  speechProviders: PluginSpeechProviderRegistration[];
  mediaUnderstandingProviders: PluginMediaUnderstandingProviderRegistration[];
  imageGenerationProviders: PluginImageGenerationProviderRegistration[];
  videoGenerationProviders: PluginVideoGenerationProviderRegistration[];
  musicGenerationProviders: PluginMusicGenerationProviderRegistration[];
  memoryEmbeddingProviders: PluginMemoryEmbeddingProviderRegistration[];
  realtimeTranscriptionProviders: PluginRealtimeTranscriptionProviderRegistration[];
  realtimeVoiceProviders: PluginRealtimeVoiceProviderRegistration[];
  webSearchProviders: PluginWebSearchProviderRegistration[];
  cliBackends: PluginCliBackendRegistration[];
  agentHarnesses: PluginAgentHarnessRegistration[];
  skillProviders: PluginSkillProviderRegistration[];
  researchProviders: PluginResearchProviderRegistration[];
  osAutomationProviders: PluginOSAutomationProviderRegistration[];
  voiceInterfaceProviders: PluginVoiceInterfaceProviderRegistration[];
  autoCoderProviders: PluginAutoCoderProviderRegistration[];
  dealSourcingProviders: PluginDealSourcingProviderRegistration[];
  leadGenerationProviders: PluginLeadGenerationProviderRegistration[];
  salesAutomationProviders: PluginSalesAutomationProviderRegistration[];
  growthHackingProviders: PluginGrowthHackingProviderRegistration[];
  saasBuilderProviders: PluginSaaSBuilderProviderRegistration[];
  revenueOptimizationProviders: PluginRevenueOptimizationProviderRegistration[];
  contentFactoryProviders: PluginContentFactoryProviderRegistration[];
  projectManagerProviders: PluginProjectManagerProviderRegistration[];
  decisionEngineProviders: PluginDecisionEngineProviderRegistration[];
  businessLoopProviders: PluginBusinessLoopProviderRegistration[];
  gatewayHandlers: GatewayRequestHandlers;
  httpRoutes: PluginHttpRouteRegistration[];
  cliRegistrars: PluginCliRegistration[];
  services: PluginServiceRegistration[];
  commands: PluginCommandRegistration[];
  conversationBindingResolvedHandlers: PluginConversationBindingResolvedHandlerRegistration[];
  memoryCapabilities: Array<{ pluginId: string; capability: unknown }>;
  diagnostics: PluginDiagnostic[];
};

export type PluginRegistryParams = {
  logger: PluginLogger;
  coreGatewayHandlers?: GatewayRequestHandlers;
  runtime: PluginRuntime;
  // When true, skip writing to the global plugin command registry during register().
  // Used by non-activating snapshot loads to avoid leaking commands into the running gateway.
  suppressGlobalCommands?: boolean;
};

type PluginTypedHookPolicy = {
  allowPromptInjection?: boolean;
};

const constrainLegacyPromptInjectionHook = (
  handler: PluginHookHandlerMap["before_agent_start"],
): PluginHookHandlerMap["before_agent_start"] => {
  return (event, ctx) => {
    const result = handler(event, ctx);
    if (result && typeof result === "object" && "then" in result) {
      return Promise.resolve(result).then((resolved) =>
        stripPromptMutationFieldsFromLegacyHookResult(resolved),
      );
    }
    return stripPromptMutationFieldsFromLegacyHookResult(result);
  };
};

export { createEmptyPluginRegistry } from "./registry-empty.js";

export function createPluginRegistry(registryParams: PluginRegistryParams) {
  const registry = createEmptyPluginRegistry();
  const coreGatewayMethods = new Set(Object.keys(registryParams.coreGatewayHandlers ?? {}));

  const pushDiagnostic = (diag: PluginDiagnostic) => {
    registry.diagnostics.push(diag);
  };

  const registerTool = (
    record: PluginRecord,
    tool: AnyAgentTool | OpenClawPluginToolFactory,
    opts?: { name?: string; names?: string[]; optional?: boolean },
  ) => {
    const names = opts?.names ?? (opts?.name ? [opts.name] : []);
    const optional = opts?.optional === true;
    const factory: OpenClawPluginToolFactory =
      typeof tool === "function" ? tool : (_ctx: OpenClawPluginToolContext) => tool;

    if (typeof tool !== "function") {
      names.push(tool.name);
    }

    const normalized = names.map((name) => name.trim()).filter(Boolean);
    if (normalized.length > 0) {
      record.toolNames.push(...normalized);
    }
    registry.tools.push({
      pluginId: record.id,
      pluginName: record.name,
      factory,
      names: normalized,
      optional,
      source: record.source,
      rootDir: record.rootDir,
    });
  };

  const registerHook = (
    record: PluginRecord,
    events: string | string[],
    handler: Parameters<typeof registerInternalHook>[1],
    opts: OpenClawPluginHookOptions | undefined,
    config: OpenClawPluginApi["config"],
  ) => {
    const eventList = Array.isArray(events) ? events : [events];
    const normalizedEvents = eventList.map((event) => event.trim()).filter(Boolean);
    const entry = opts?.entry ?? null;
    const name = entry?.hook.name ?? opts?.name?.trim();
    if (!name) {
      pushDiagnostic({
        level: "warn",
        pluginId: record.id,
        source: record.source,
        message: "hook registration missing name",
      });
      return;
    }
    const existingHook = registry.hooks.find((entry) => entry.entry.hook.name === name);
    if (existingHook) {
      pushDiagnostic({
        level: "error",
        pluginId: record.id,
        source: record.source,
        message: `hook already registered: ${name} (${existingHook.pluginId})`,
      });
      return;
    }

    const description = entry?.hook.description ?? opts?.description ?? "";
    const hookEntry: HookEntry = entry
      ? {
          ...entry,
          hook: {
            ...entry.hook,
            name,
            description,
            source: "openclaw-plugin",
            pluginId: record.id,
          },
          metadata: {
            ...entry.metadata,
            events: normalizedEvents,
          },
        }
      : {
          hook: {
            name,
            description,
            source: "openclaw-plugin",
            pluginId: record.id,
            filePath: record.source,
            baseDir: path.dirname(record.source),
            handlerPath: record.source,
          },
          frontmatter: {},
          metadata: { events: normalizedEvents },
          invocation: { enabled: true },
        };

    record.hookNames.push(name);
    registry.hooks.push({
      pluginId: record.id,
      entry: hookEntry,
      events: normalizedEvents,
      source: record.source,
    });

    const hookSystemEnabled = config?.hooks?.internal?.enabled === true;
    if (!hookSystemEnabled || opts?.register === false) {
      return;
    }

    for (const event of normalizedEvents) {
      registerInternalHook(event, handler);
    }
  };

  const registerGatewayMethod = (
    record: PluginRecord,
    method: string,
    handler: GatewayRequestHandler,
  ) => {
    const trimmed = method.trim();
    if (!trimmed) {
      return;
    }
    if (coreGatewayMethods.has(trimmed) || registry.gatewayHandlers[trimmed]) {
      pushDiagnostic({
        level: "error",
        pluginId: record.id,
        source: record.source,
        message: `gateway method already registered: ${trimmed}`,
      });
      return;
    }
    registry.gatewayHandlers[trimmed] = handler;
    record.gatewayMethods.push(trimmed);
  };

  const describeHttpRouteOwner = (entry: PluginHttpRouteRegistration): string => {
    const plugin = entry.pluginId?.trim() || "unknown-plugin";
    const source = entry.source?.trim() || "unknown-source";
    return `${plugin} (${source})`;
  };

  const registerHttpRoute = (record: PluginRecord, params: OpenClawPluginHttpRouteParams) => {
    const normalizedPath = normalizePluginHttpPath(params.path);
    if (!normalizedPath) {
      pushDiagnostic({
        level: "warn",
        pluginId: record.id,
        source: record.source,
        message: "http route registration missing path",
      });
      return;
    }
    if (params.auth !== "gateway" && params.auth !== "plugin") {
      pushDiagnostic({
        level: "error",
        pluginId: record.id,
        source: record.source,
        message: `http route registration missing or invalid auth: ${normalizedPath}`,
      });
      return;
    }
    const match = params.match ?? "exact";
    const overlappingRoute = findOverlappingPluginHttpRoute(registry.httpRoutes, {
      path: normalizedPath,
      match,
    });
    if (overlappingRoute && overlappingRoute.auth !== params.auth) {
      pushDiagnostic({
        level: "error",
        pluginId: record.id,
        source: record.source,
        message:
          `http route overlap rejected: ${normalizedPath} (${match}, ${params.auth}) ` +
          `overlaps ${overlappingRoute.path} (${overlappingRoute.match}, ${overlappingRoute.auth}) ` +
          `owned by ${describeHttpRouteOwner(overlappingRoute)}`,
      });
      return;
    }
    const existingIndex = registry.httpRoutes.findIndex(
      (entry) => entry.path === normalizedPath && entry.match === match,
    );
    if (existingIndex >= 0) {
      const existing = registry.httpRoutes[existingIndex];
      if (!existing) {
        return;
      }
      if (!params.replaceExisting) {
        pushDiagnostic({
          level: "error",
          pluginId: record.id,
          source: record.source,
          message: `http route already registered: ${normalizedPath} (${match}) by ${describeHttpRouteOwner(existing)}`,
        });
        return;
      }
      if (existing.pluginId && existing.pluginId !== record.id) {
        pushDiagnostic({
          level: "error",
          pluginId: record.id,
          source: record.source,
          message: `http route replacement rejected: ${normalizedPath} (${match}) owned by ${describeHttpRouteOwner(existing)}`,
        });
        return;
      }
      registry.httpRoutes[existingIndex] = {
        pluginId: record.id,
        path: normalizedPath,
        handler: params.handler,
        auth: params.auth,
        match,
        source: record.source,
      };
      return;
    }
    record.httpRoutes += 1;
    registry.httpRoutes.push({
      pluginId: record.id,
      path: normalizedPath,
      handler: params.handler,
      auth: params.auth,
      match,
      source: record.source,
    });
  };

  const registerChannel = (
    record: PluginRecord,
    registration: OpenClawPluginChannelRegistration | ChannelPlugin,
    mode: PluginRegistrationMode = "full",
  ) => {
    const normalized =
      typeof (registration as OpenClawPluginChannelRegistration).plugin === "object"
        ? (registration as OpenClawPluginChannelRegistration)
        : { plugin: registration as ChannelPlugin };
    const plugin = normalized.plugin;
    const id = typeof plugin?.id === "string" ? plugin.id.trim() : String(plugin?.id ?? "").trim();
    if (!id) {
      pushDiagnostic({
        level: "error",
        pluginId: record.id,
        source: record.source,
        message: "channel registration missing id",
      });
      return;
    }
    const existingRuntime = registry.channels.find((entry) => entry.plugin.id === id);
    if (mode !== "setup-only" && existingRuntime) {
      pushDiagnostic({
        level: "error",
        pluginId: record.id,
        source: record.source,
        message: `channel already registered: ${id} (${existingRuntime.pluginId})`,
      });
      return;
    }
    const existingSetup = registry.channelSetups.find((entry) => entry.plugin.id === id);
    if (existingSetup) {
      pushDiagnostic({
        level: "error",
        pluginId: record.id,
        source: record.source,
        message: `channel setup already registered: ${id} (${existingSetup.pluginId})`,
      });
      return;
    }
    record.channelIds.push(id);
    registry.channelSetups.push({
      pluginId: record.id,
      pluginName: record.name,
      plugin,
      source: record.source,
      enabled: record.enabled,
      rootDir: record.rootDir,
    });
    if (mode === "setup-only") {
      return;
    }
    registry.channels.push({
      pluginId: record.id,
      pluginName: record.name,
      plugin,
      source: record.source,
      rootDir: record.rootDir,
    });
  };

  const registerProvider = (record: PluginRecord, provider: ProviderPlugin) => {
    const normalizedProvider = normalizeRegisteredProvider({
      pluginId: record.id,
      source: record.source,
      provider,
      pushDiagnostic,
    });
    if (!normalizedProvider) {
      return;
    }
    const id = normalizedProvider.id;
    const existing = registry.providers.find((entry) => entry.provider.id === id);
    if (existing) {
      pushDiagnostic({
        level: "error",
        pluginId: record.id,
        source: record.source,
        message: `provider already registered: ${id} (${existing.pluginId})`,
      });
      return;
    }
    record.providerIds.push(id);
    registry.providers.push({
      pluginId: record.id,
      pluginName: record.name,
      provider: normalizedProvider,
      source: record.source,
      rootDir: record.rootDir,
    });
  };

  const registerUniqueProviderLike = <
    T extends { id: string },
    R extends PluginOwnedProviderRegistration<T>,
  >(params: {
    record: PluginRecord;
    provider: T;
    kindLabel: string;
    registrations: R[];
    ownedIds: string[];
  }) => {
    const id = params.provider.id.trim();
    const { record, kindLabel } = params;
    const missingLabel = `${kindLabel} registration missing id`;
    const duplicateLabel = `${kindLabel} already registered: ${id}`;
    if (!id) {
      pushDiagnostic({
        level: "error",
        pluginId: record.id,
        source: record.source,
        message: missingLabel,
      });
      return;
    }
    const existing = params.registrations.find((entry) => entry.provider.id === id);
    if (existing) {
      pushDiagnostic({
        level: "error",
        pluginId: record.id,
        source: record.source,
        message: `${duplicateLabel} (${existing.pluginId})`,
      });
      return;
    }
    params.ownedIds.push(id);
    params.registrations.push({
      pluginId: record.id,
      pluginName: record.name,
      provider: params.provider,
      source: record.source,
      rootDir: record.rootDir,
    } as R);
  };

  const registerSpeechProvider = (record: PluginRecord, provider: SpeechProviderPlugin) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "speech provider",
      registrations: registry.speechProviders,
      ownedIds: record.speechProviderIds,
    });
  };

  const registerMediaUnderstandingProvider = (
    record: PluginRecord,
    provider: MediaUnderstandingProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "media provider",
      registrations: registry.mediaUnderstandingProviders,
      ownedIds: record.mediaUnderstandingProviderIds,
    });
  };

  const registerImageGenerationProvider = (
    record: PluginRecord,
    provider: ImageGenerationProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "image-generation provider",
      registrations: registry.imageGenerationProviders,
      ownedIds: record.imageGenerationProviderIds,
    });
  };

  const registerWebSearchProvider = (record: PluginRecord, provider: WebSearchProviderPlugin) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "web search provider",
      registrations: registry.webSearchProviders,
      ownedIds: record.webSearchProviderIds,
    });
  };

  const registerCliBackend = (record: PluginRecord, provider: CliBackendPlugin) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "CLI backend",
      registrations: registry.cliBackends,
      ownedIds: record.cliBackendIds,
    });
  };

  const registerVideoGenerationProvider = (
    record: PluginRecord,
    provider: VideoGenerationProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "video-generation provider",
      registrations: registry.videoGenerationProviders,
      ownedIds: record.videoGenerationProviderIds,
    });
  };

  const registerMusicGenerationProvider = (
    record: PluginRecord,
    provider: MusicGenerationProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "music-generation provider",
      registrations: registry.musicGenerationProviders,
      ownedIds: record.musicGenerationProviderIds,
    });
  };

  const registerMemoryEmbeddingProvider = (
    record: PluginRecord,
    provider: MemoryEmbeddingProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "memory-embedding provider",
      registrations: registry.memoryEmbeddingProviders,
      ownedIds: record.memoryEmbeddingProviderIds,
    });
  };

  const registerRealtimeTranscriptionProvider = (
    record: PluginRecord,
    provider: RealtimeTranscriptionProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "realtime-transcription provider",
      registrations: registry.realtimeTranscriptionProviders,
      ownedIds: record.realtimeTranscriptionProviderIds,
    });
  };

  const registerRealtimeVoiceProvider = (
    record: PluginRecord,
    provider: RealtimeVoiceProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "realtime-voice provider",
      registrations: registry.realtimeVoiceProviders,
      ownedIds: record.realtimeVoiceProviderIds,
    });
  };

  const registerAgentHarness = (record: PluginRecord, provider: AgentHarnessProviderPlugin) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "agent-harness",
      registrations: registry.agentHarnesses,
      ownedIds: record.agentHarnessIds,
    });
  };

  const registerSkillProvider = (record: PluginRecord, provider: SkillProviderPlugin) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "skill provider",
      registrations: registry.skillProviders,
      ownedIds: record.skillProviderIds,
    });
  };

  const registerResearchProvider = (record: PluginRecord, provider: ResearchProviderPlugin) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "research provider",
      registrations: registry.researchProviders,
      ownedIds: record.researchProviderIds,
    });
  };

  const registerOSAutomationProvider = (
    record: PluginRecord,
    provider: OSAutomationProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "OS automation provider",
      registrations: registry.osAutomationProviders,
      ownedIds: record.osAutomationProviderIds,
    });
  };

  const registerVoiceInterfaceProvider = (
    record: PluginRecord,
    provider: VoiceInterfaceProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "voice interface provider",
      registrations: registry.voiceInterfaceProviders,
      ownedIds: record.voiceInterfaceProviderIds,
    });
  };

  const registerAutoCoderProvider = (record: PluginRecord, provider: AutoCoderProviderPlugin) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "auto-coder provider",
      registrations: registry.autoCoderProviders,
      ownedIds: record.autoCoderProviderIds,
    });
  };

  const registerDealSourcingProvider = (
    record: PluginRecord,
    provider: DealSourcingProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "deal-sourcing provider",
      registrations: registry.dealSourcingProviders,
      ownedIds: record.dealSourcingProviderIds,
    });
  };

  const registerLeadGenerationProvider = (
    record: PluginRecord,
    provider: LeadGenerationProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "lead-generation provider",
      registrations: registry.leadGenerationProviders,
      ownedIds: record.leadGenerationProviderIds,
    });
  };

  const registerSalesAutomationProvider = (
    record: PluginRecord,
    provider: SalesAutomationProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "sales-automation provider",
      registrations: registry.salesAutomationProviders,
      ownedIds: record.salesAutomationProviderIds,
    });
  };

  const registerGrowthHackingProvider = (
    record: PluginRecord,
    provider: GrowthHackingProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "growth-hacking provider",
      registrations: registry.growthHackingProviders,
      ownedIds: record.growthHackingProviderIds,
    });
  };

  const registerSaaSBuilderProvider = (
    record: PluginRecord,
    provider: SaaSBuilderProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "SaaS-builder provider",
      registrations: registry.saasBuilderProviders,
      ownedIds: record.saasBuilderProviderIds,
    });
  };

  const registerRevenueOptimizationProvider = (
    record: PluginRecord,
    provider: RevenueOptimizationProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "revenue-optimization provider",
      registrations: registry.revenueOptimizationProviders,
      ownedIds: record.revenueOptimizationProviderIds,
    });
  };

  const registerContentFactoryProvider = (
    record: PluginRecord,
    provider: ContentFactoryProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "content-factory provider",
      registrations: registry.contentFactoryProviders,
      ownedIds: record.contentFactoryProviderIds,
    });
  };

  const registerProjectManagerProvider = (
    record: PluginRecord,
    provider: ProjectManagerProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "project-manager provider",
      registrations: registry.projectManagerProviders,
      ownedIds: record.projectManagerProviderIds,
    });
  };

  const registerDecisionEngineProvider = (
    record: PluginRecord,
    provider: DecisionEngineProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "decision-engine provider",
      registrations: registry.decisionEngineProviders,
      ownedIds: record.decisionEngineProviderIds,
    });
  };

  const registerBusinessLoopProvider = (
    record: PluginRecord,
    provider: BusinessLoopProviderPlugin,
  ) => {
    registerUniqueProviderLike({
      record,
      provider,
      kindLabel: "business-loop provider",
      registrations: registry.businessLoopProviders,
      ownedIds: record.businessLoopProviderIds,
    });
  };

  const registerCli = (
    record: PluginRecord,
    registrar: OpenClawPluginCliRegistrar,
    opts?: { commands?: string[] },
  ) => {
    const commands = (opts?.commands ?? []).map((cmd) => cmd.trim()).filter(Boolean);
    if (commands.length === 0) {
      pushDiagnostic({
        level: "error",
        pluginId: record.id,
        source: record.source,
        message: "cli registration missing explicit commands metadata",
      });
      return;
    }
    const existing = registry.cliRegistrars.find((entry) =>
      entry.commands.some((command) => commands.includes(command)),
    );
    if (existing) {
      const overlap = commands.find((command) => existing.commands.includes(command));
      pushDiagnostic({
        level: "error",
        pluginId: record.id,
        source: record.source,
        message: `cli command already registered: ${overlap ?? commands[0]} (${existing.pluginId})`,
      });
      return;
    }
    record.cliCommands.push(...commands);
    registry.cliRegistrars.push({
      pluginId: record.id,
      pluginName: record.name,
      register: registrar,
      commands,
      source: record.source,
      rootDir: record.rootDir,
    });
  };

  const registerService = (record: PluginRecord, service: OpenClawPluginService) => {
    const id = service.id.trim();
    if (!id) {
      return;
    }
    const existing = registry.services.find((entry) => entry.service.id === id);
    if (existing) {
      pushDiagnostic({
        level: "error",
        pluginId: record.id,
        source: record.source,
        message: `service already registered: ${id} (${existing.pluginId})`,
      });
      return;
    }
    record.services.push(id);
    registry.services.push({
      pluginId: record.id,
      pluginName: record.name,
      service,
      source: record.source,
      rootDir: record.rootDir,
    });
  };

  const registerCommand = (record: PluginRecord, command: OpenClawPluginCommandDefinition) => {
    const name = command.name.trim();
    if (!name) {
      pushDiagnostic({
        level: "error",
        pluginId: record.id,
        source: record.source,
        message: "command registration missing name",
      });
      return;
    }

    // For snapshot (non-activating) loads, record the command locally without touching the
    // global plugin command registry so running gateway commands stay intact.
    // We still validate the command definition so diagnostics match the real activation path.
    // NOTE: cross-plugin duplicate command detection is intentionally skipped here because
    // snapshot registries are isolated and never write to the global command table. Conflicts
    // will surface when the plugin is loaded via the normal activation path at gateway startup.
    if (registryParams.suppressGlobalCommands) {
      const validationError = validatePluginCommandDefinition(command);
      if (validationError) {
        pushDiagnostic({
          level: "error",
          pluginId: record.id,
          source: record.source,
          message: `command registration failed: ${validationError}`,
        });
        return;
      }
    } else {
      const result = registerPluginCommand(record.id, command, {
        pluginName: record.name,
        pluginRoot: record.rootDir,
      });
      if (!result.ok) {
        pushDiagnostic({
          level: "error",
          pluginId: record.id,
          source: record.source,
          message: `command registration failed: ${result.error}`,
        });
        return;
      }
    }

    record.commands.push(name);
    registry.commands.push({
      pluginId: record.id,
      pluginName: record.name,
      command,
      source: record.source,
      rootDir: record.rootDir,
    });
  };

  const registerTypedHook = <K extends PluginHookName>(
    record: PluginRecord,
    hookName: K,
    handler: PluginHookHandlerMap[K],
    opts?: { priority?: number },
    policy?: PluginTypedHookPolicy,
  ) => {
    if (!isPluginHookName(hookName)) {
      pushDiagnostic({
        level: "warn",
        pluginId: record.id,
        source: record.source,
        message: `unknown typed hook "${String(hookName)}" ignored`,
      });
      return;
    }
    let effectiveHandler = handler;
    if (policy?.allowPromptInjection === false && isPromptInjectionHookName(hookName)) {
      if (hookName === "before_prompt_build") {
        pushDiagnostic({
          level: "warn",
          pluginId: record.id,
          source: record.source,
          message: `typed hook "${hookName}" blocked by plugins.entries.${record.id}.hooks.allowPromptInjection=false`,
        });
        return;
      }
      if (hookName === "before_agent_start") {
        pushDiagnostic({
          level: "warn",
          pluginId: record.id,
          source: record.source,
          message: `typed hook "${hookName}" prompt fields constrained by plugins.entries.${record.id}.hooks.allowPromptInjection=false`,
        });
        effectiveHandler = constrainLegacyPromptInjectionHook(
          handler as PluginHookHandlerMap["before_agent_start"],
        ) as PluginHookHandlerMap[K];
      }
    }
    record.hookCount += 1;
    registry.typedHooks.push({
      pluginId: record.id,
      hookName,
      handler: effectiveHandler,
      priority: opts?.priority,
      source: record.source,
    } as TypedPluginHookRegistration);
  };

  const registerConversationBindingResolvedHandler = (
    record: PluginRecord,
    handler: (event: PluginConversationBindingResolvedEvent) => void | Promise<void>,
  ) => {
    registry.conversationBindingResolvedHandlers.push({
      pluginId: record.id,
      pluginName: record.name,
      pluginRoot: record.rootDir,
      handler,
      source: record.source,
      rootDir: record.rootDir,
    });
  };

  const normalizeLogger = (logger: PluginLogger): PluginLogger => ({
    info: logger.info,
    warn: logger.warn,
    error: logger.error,
    debug: logger.debug,
  });

  const pluginRuntimeById = new Map<string, PluginRuntime>();

  const resolvePluginRuntime = (pluginId: string): PluginRuntime => {
    const cached = pluginRuntimeById.get(pluginId);
    if (cached) {
      return cached;
    }
    const runtime = new Proxy(registryParams.runtime, {
      get(target, prop, receiver) {
        if (prop !== "subagent") {
          return Reflect.get(target, prop, receiver);
        }
        const subagent = Reflect.get(target, prop, receiver);
        return {
          run: (params) => withPluginRuntimePluginIdScope(pluginId, () => subagent.run(params)),
          waitForRun: (params) =>
            withPluginRuntimePluginIdScope(pluginId, () => subagent.waitForRun(params)),
          getSessionMessages: (params) =>
            withPluginRuntimePluginIdScope(pluginId, () => subagent.getSessionMessages(params)),
          getSession: (params) =>
            withPluginRuntimePluginIdScope(pluginId, () => subagent.getSession(params)),
          deleteSession: (params) =>
            withPluginRuntimePluginIdScope(pluginId, () => subagent.deleteSession(params)),
        } satisfies PluginRuntime["subagent"];
      },
    });
    pluginRuntimeById.set(pluginId, runtime);
    return runtime;
  };

  const createApi = (
    record: PluginRecord,
    params: {
      config: OpenClawPluginApi["config"];
      pluginConfig?: Record<string, unknown>;
      hookPolicy?: PluginTypedHookPolicy;
      registrationMode?: PluginRegistrationMode;
    },
  ): OpenClawPluginApi => {
    const registrationMode = params.registrationMode ?? "full";
    return {
      id: record.id,
      name: record.name,
      version: record.version,
      description: record.description,
      source: record.source,
      rootDir: record.rootDir,
      registrationMode,
      config: params.config,
      pluginConfig: params.pluginConfig,
      runtime: resolvePluginRuntime(record.id),
      logger: normalizeLogger(registryParams.logger),
      registerTool:
        registrationMode === "full" ? (tool, opts) => registerTool(record, tool, opts) : () => {},
      registerHook:
        registrationMode === "full"
          ? (events, handler, opts) => registerHook(record, events, handler, opts, params.config)
          : () => {},
      registerHttpRoute:
        registrationMode === "full" ? (params) => registerHttpRoute(record, params) : () => {},
      registerChannel: (registration) => registerChannel(record, registration, registrationMode),
      registerProvider:
        registrationMode === "full" ? (provider) => registerProvider(record, provider) : () => {},
      registerSpeechProvider:
        registrationMode === "full"
          ? (provider) => registerSpeechProvider(record, provider)
          : () => {},
      registerMediaUnderstandingProvider:
        registrationMode === "full"
          ? (provider) => registerMediaUnderstandingProvider(record, provider)
          : () => {},
      registerImageGenerationProvider:
        registrationMode === "full"
          ? (provider) => registerImageGenerationProvider(record, provider)
          : () => {},
      registerWebSearchProvider:
        registrationMode === "full"
          ? (provider) => registerWebSearchProvider(record, provider)
          : () => {},
      registerCliBackend:
        registrationMode === "full" ? (provider) => registerCliBackend(record, provider) : () => {},
      registerVideoGenerationProvider:
        registrationMode === "full"
          ? (provider) => registerVideoGenerationProvider(record, provider)
          : () => {},
      registerMusicGenerationProvider:
        registrationMode === "full"
          ? (provider) => registerMusicGenerationProvider(record, provider)
          : () => {},
      registerMemoryEmbeddingProvider:
        registrationMode === "full"
          ? (provider) => registerMemoryEmbeddingProvider(record, provider)
          : () => {},
      registerRealtimeTranscriptionProvider:
        registrationMode === "full"
          ? (provider) => registerRealtimeTranscriptionProvider(record, provider)
          : () => {},
      registerRealtimeVoiceProvider:
        registrationMode === "full"
          ? (provider) => registerRealtimeVoiceProvider(record, provider)
          : () => {},
      registerAgentHarness:
        registrationMode === "full"
          ? (provider) => registerAgentHarness(record, provider)
          : () => {},
      registerSkillProvider:
        registrationMode === "full"
          ? (provider) => registerSkillProvider(record, provider)
          : () => {},
      registerResearchProvider:
        registrationMode === "full"
          ? (provider) => registerResearchProvider(record, provider)
          : () => {},
      registerOSAutomationProvider:
        registrationMode === "full"
          ? (provider) => registerOSAutomationProvider(record, provider)
          : () => {},
      registerVoiceInterfaceProvider:
        registrationMode === "full"
          ? (provider) => registerVoiceInterfaceProvider(record, provider)
          : () => {},
      registerAutoCoderProvider:
        registrationMode === "full"
          ? (provider) => registerAutoCoderProvider(record, provider)
          : () => {},
      registerDealSourcingProvider:
        registrationMode === "full"
          ? (provider) => registerDealSourcingProvider(record, provider)
          : () => {},
      registerLeadGenerationProvider:
        registrationMode === "full"
          ? (provider) => registerLeadGenerationProvider(record, provider)
          : () => {},
      registerSalesAutomationProvider:
        registrationMode === "full"
          ? (provider) => registerSalesAutomationProvider(record, provider)
          : () => {},
      registerGrowthHackingProvider:
        registrationMode === "full"
          ? (provider) => registerGrowthHackingProvider(record, provider)
          : () => {},
      registerSaaSBuilderProvider:
        registrationMode === "full"
          ? (provider) => registerSaaSBuilderProvider(record, provider)
          : () => {},
      registerRevenueOptimizationProvider:
        registrationMode === "full"
          ? (provider) => registerRevenueOptimizationProvider(record, provider)
          : () => {},
      registerContentFactoryProvider:
        registrationMode === "full"
          ? (provider) => registerContentFactoryProvider(record, provider)
          : () => {},
      registerProjectManagerProvider:
        registrationMode === "full"
          ? (provider) => registerProjectManagerProvider(record, provider)
          : () => {},
      registerDecisionEngineProvider:
        registrationMode === "full"
          ? (provider) => registerDecisionEngineProvider(record, provider)
          : () => {},
      registerBusinessLoopProvider:
        registrationMode === "full"
          ? (provider) => registerBusinessLoopProvider(record, provider)
          : () => {},
      registerMemoryCapability:
        registrationMode === "full"
          ? (capability) => {
              registry.memoryCapabilities.push({
                pluginId: record.id,
                capability,
              });
            }
          : () => {},
      registerMemoryPromptSupplement: registrationMode === "full" ? () => {} : () => {},
      registerMemoryCorpusSupplement: registrationMode === "full" ? () => {} : () => {},
      registerGatewayMethod:
        registrationMode === "full"
          ? (method, handler) => registerGatewayMethod(record, method, handler)
          : () => {},
      registerCli:
        registrationMode === "full"
          ? (registrar, opts) => registerCli(record, registrar, opts)
          : () => {},
      registerService:
        registrationMode === "full" ? (service) => registerService(record, service) : () => {},
      registerInteractiveHandler:
        registrationMode === "full"
          ? (registration) => {
              const result = registerPluginInteractiveHandler(record.id, registration, {
                pluginName: record.name,
                pluginRoot: record.rootDir,
              });
              if (!result.ok) {
                pushDiagnostic({
                  level: "warn",
                  pluginId: record.id,
                  source: record.source,
                  message: result.error ?? "interactive handler registration failed",
                });
              }
            }
          : () => {},
      onConversationBindingResolved:
        registrationMode === "full"
          ? (handler) => registerConversationBindingResolvedHandler(record, handler)
          : () => {},
      registerCommand:
        registrationMode === "full" ? (command) => registerCommand(record, command) : () => {},
      registerContextEngine: (id, factory) => {
        if (registrationMode !== "full") {
          return;
        }
        if (id === defaultSlotIdForKey("contextEngine")) {
          pushDiagnostic({
            level: "error",
            pluginId: record.id,
            source: record.source,
            message: `context engine id reserved by core: ${id}`,
          });
          return;
        }
        const result = registerContextEngineForOwner(id, factory, `plugin:${record.id}`, {
          allowSameOwnerRefresh: true,
        });
        if (!result.ok) {
          pushDiagnostic({
            level: "error",
            pluginId: record.id,
            source: record.source,
            message: `context engine already registered: ${id} (${result.existingOwner})`,
          });
        }
      },
      resolvePath: (input: string) => resolveUserPath(input),
      on: (hookName, handler, opts) =>
        registrationMode === "full"
          ? registerTypedHook(record, hookName, handler, opts, params.hookPolicy)
          : undefined,
    };
  };

  return {
    registry,
    createApi,
    pushDiagnostic,
    registerTool,
    registerChannel,
    registerProvider,
    registerSpeechProvider,
    registerMediaUnderstandingProvider,
    registerImageGenerationProvider,
    registerVideoGenerationProvider,
    registerMusicGenerationProvider,
    registerMemoryEmbeddingProvider,
    registerRealtimeTranscriptionProvider,
    registerRealtimeVoiceProvider,
    registerWebSearchProvider,
    registerCliBackend,
    registerAgentHarness,
    registerSkillProvider,
    registerResearchProvider,
    registerOSAutomationProvider,
    registerVoiceInterfaceProvider,
    registerAutoCoderProvider,
    registerDealSourcingProvider,
    registerLeadGenerationProvider,
    registerSalesAutomationProvider,
    registerGrowthHackingProvider,
    registerSaaSBuilderProvider,
    registerRevenueOptimizationProvider,
    registerContentFactoryProvider,
    registerProjectManagerProvider,
    registerDecisionEngineProvider,
    registerBusinessLoopProvider,
    registerGatewayMethod,
    registerCli,
    registerService,
    registerCommand,
    registerHook,
    registerTypedHook,
  };
}
