// Public config patch helpers for provider onboarding flows.

import type { OpenClawConfig } from "../config/config.js";
import type {
  ModelApi,
  ModelDefinitionConfig,
  ModelProviderConfig,
} from "../config/types.models.js";
import {
  applyProviderConfigWithDefaultModel,
  applyProviderConfigWithDefaultModels,
  applyProviderConfigWithModelCatalog,
} from "../plugins/provider-onboarding-config.js";

export type { OpenClawConfig } from "../config/config.js";
export type {
  ModelApi,
  ModelDefinitionConfig,
  ModelProviderConfig,
} from "../config/types.models.js";
export {
  applyAgentDefaultModelPrimary,
  applyOnboardAuthAgentModelsAndProviders,
  applyProviderConfigWithDefaultModel,
  applyProviderConfigWithDefaultModels,
  applyProviderConfigWithModelCatalog,
} from "../plugins/provider-onboarding-config.js";
export { ensureModelAllowlistEntry } from "../plugins/provider-model-allowlist.js";

export type ProviderOnboardPresetAppliers<TParams extends readonly unknown[]> = {
  applyProviderConfig: (cfg: OpenClawConfig, ...args: TParams) => OpenClawConfig;
  applyConfig: (cfg: OpenClawConfig, ...args: TParams) => OpenClawConfig;
};

export function createDefaultModelPresetAppliers<TParams extends readonly unknown[]>(params: {
  primaryModelRef: string;
  resolveParams: (
    cfg: OpenClawConfig,
    ...args: TParams
  ) => {
    providerId: string;
    api: ModelApi;
    baseUrl: string;
    defaultModel: ModelDefinitionConfig;
    defaultModelId?: string;
    aliases?: Array<{ modelRef: string; alias: string }>;
  } | null;
}) {
  return {
    applyProviderConfig(cfg: OpenClawConfig, ...args: TParams): OpenClawConfig {
      const resolved = params.resolveParams(cfg, ...args);
      if (!resolved) {
        return cfg;
      }
      return applyProviderConfigWithDefaultModel(cfg, {
        agentModels: cfg.agents?.defaults?.models ?? {},
        providerId: resolved.providerId,
        api: resolved.api,
        baseUrl: resolved.baseUrl,
        defaultModel: resolved.defaultModel,
        defaultModelId: resolved.defaultModelId,
      });
    },
    applyConfig(cfg: OpenClawConfig, ...args: TParams): OpenClawConfig {
      const resolved = params.resolveParams(cfg, ...args);
      if (!resolved) {
        return cfg;
      }
      return {
        ...applyProviderConfigWithDefaultModel(cfg, {
          agentModels: cfg.agents?.defaults?.models ?? {},
          providerId: resolved.providerId,
          api: resolved.api,
          baseUrl: resolved.baseUrl,
          defaultModel: resolved.defaultModel,
          defaultModelId: resolved.defaultModelId,
        }),
        agents: {
          ...cfg.agents,
          defaults: {
            ...cfg.agents?.defaults,
            model: {
              primary: resolved.defaultModelId ?? resolved.defaultModel.id,
            },
          },
        },
      };
    },
  };
}

/** Preset appliers for providers whose onboarding registers a curated list of default models. */
export function createDefaultModelsPresetAppliers<TParams extends readonly unknown[]>(params: {
  primaryModelRef: string;
  resolveParams: (
    cfg: OpenClawConfig,
    ...args: TParams
  ) => {
    providerId: string;
    api: ModelApi;
    baseUrl: string;
    defaultModels: ModelDefinitionConfig[];
    defaultModelId?: string;
    aliases?: Array<{ modelRef: string; alias: string }>;
  } | null;
}): ProviderOnboardPresetAppliers<TParams> {
  return {
    applyProviderConfig(cfg: OpenClawConfig, ...args: TParams): OpenClawConfig {
      const resolved = params.resolveParams(cfg, ...args);
      if (!resolved) {
        return cfg;
      }
      return applyProviderConfigWithDefaultModels(cfg, {
        agentModels: cfg.agents?.defaults?.models ?? {},
        providerId: resolved.providerId,
        api: resolved.api,
        baseUrl: resolved.baseUrl,
        defaultModels: resolved.defaultModels,
        defaultModelId: resolved.defaultModelId,
      });
    },
    applyConfig(cfg: OpenClawConfig, ...args: TParams): OpenClawConfig {
      const resolved = params.resolveParams(cfg, ...args);
      if (!resolved) {
        return cfg;
      }
      const defaultModelId = resolved.defaultModelId ?? resolved.defaultModels[0]?.id;
      return {
        ...applyProviderConfigWithDefaultModels(cfg, {
          agentModels: cfg.agents?.defaults?.models ?? {},
          providerId: resolved.providerId,
          api: resolved.api,
          baseUrl: resolved.baseUrl,
          defaultModels: resolved.defaultModels,
          defaultModelId: resolved.defaultModelId,
        }),
        agents: {
          ...cfg.agents,
          defaults: {
            ...cfg.agents?.defaults,
            ...(defaultModelId ? { model: { primary: defaultModelId } } : {}),
          },
        },
      };
    },
  };
}

/** Preset appliers for providers whose onboarding registers a full model catalog (no single "default model"). */
export function createModelCatalogPresetAppliers<TParams extends readonly unknown[]>(params: {
  primaryModelRef: string;
  resolveParams: (
    cfg: OpenClawConfig,
    ...args: TParams
  ) => {
    providerId: string;
    api: ModelApi;
    baseUrl: string;
    catalogModels: ModelDefinitionConfig[];
    aliases?: Array<string | { modelRef: string; alias: string }>;
  } | null;
}): ProviderOnboardPresetAppliers<TParams> {
  return {
    applyProviderConfig(cfg: OpenClawConfig, ...args: TParams): OpenClawConfig {
      const resolved = params.resolveParams(cfg, ...args);
      if (!resolved) {
        return cfg;
      }
      return applyProviderConfigWithModelCatalog(cfg, {
        agentModels: cfg.agents?.defaults?.models ?? {},
        providerId: resolved.providerId,
        api: resolved.api,
        baseUrl: resolved.baseUrl,
        catalogModels: resolved.catalogModels,
      });
    },
    applyConfig(cfg: OpenClawConfig, ...args: TParams): OpenClawConfig {
      const resolved = params.resolveParams(cfg, ...args);
      if (!resolved) {
        return cfg;
      }
      return {
        ...applyProviderConfigWithModelCatalog(cfg, {
          agentModels: cfg.agents?.defaults?.models ?? {},
          providerId: resolved.providerId,
          api: resolved.api,
          baseUrl: resolved.baseUrl,
          catalogModels: resolved.catalogModels,
        }),
        agents: {
          ...cfg.agents,
          defaults: {
            ...cfg.agents?.defaults,
            model: {
              primary: params.primaryModelRef,
            },
          },
        },
      };
    },
  };
}
