// Compat surface: openclaw/plugin-sdk/saas-builder
// Provides stable types and registry for autonomous SaaS product creation.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** SaaS product ideas/templates. */
export type SaaSTemplate =
  | "lead-generation"
  | "analytics"
  | "automation"
  | "content"
  | "marketplace"
  | "collaboration"
  | "custom";

/** SaaS product specification. */
export type SaaSSpec = {
  name: string;
  description: string;
  template: SaaSTemplate;
  features: string[];
  targetMarket: string;
  pricingModel: "freemium" | "subscription" | "usage-based" | "tiered";
  targetPrice?: number;
  techStack?: {
    frontend?: string; // 'react' | 'vue' | 'svelte'
    backend?: string; // 'nodejs' | 'python' | 'go'
    database?: string; // 'postgres' | 'mongodb'
  };
  metadata?: Record<string, unknown>;
};

/** Generated SaaS component. */
export type SaaSComponent = {
  id: string;
  type: "backend" | "frontend" | "database" | "api" | "ui" | "test";
  path: string;
  code: string;
  language: string;
  framework?: string;
};

/** SaaS deployment configuration. */
export type SaaSDeployment = {
  platform: "vercel" | "heroku" | "railway" | "aws" | "custom";
  domainName?: string;
  environment: "development" | "staging" | "production";
  replicas?: number;
  dataRegion?: string;
};

/** SaaS product build result. */
export type SaaSBuildResult = {
  productId: string;
  spec: SaaSSpec;
  components: SaaSComponent[];
  repositoryUrl?: string;
  deploymentUrl?: string;
  features: {
    implemented: string[];
    planned: string[];
  };
  estimatedTime?: number; // hours
  nextSteps: string[];
  timestamp: number;
};

/** SaaS deployment result. */
export type SaaSDeploymentResult = {
  productId: string;
  deploymentId: string;
  deployment: SaaSDeployment;
  deployed: boolean;
  url?: string;
  apiEndpoint?: string;
  status: "building" | "deploying" | "live" | "failed";
  errors?: string[];
  timestamp: number;
};

/** A provider that builds and deploys SaaS products. */
export type SaaSBuilderProvider = {
  id: string;
  label: string;
  capabilities: string[]; // e.g., ['fullstack-generation', 'deployment', 'testing']
  buildProduct: (spec: SaaSSpec) => Promise<SaaSBuildResult>;
  generateComponent: (
    type: SaaSComponent["type"],
    context: Record<string, unknown>,
  ) => Promise<SaaSComponent>;
  generateTests: (components: SaaSComponent[]) => Promise<SaaSComponent[]>;
  deployProduct: (productId: string, deployment: SaaSDeployment) => Promise<SaaSDeploymentResult>;
  getDeploymentStatus: (deploymentId: string) => Promise<SaaSDeploymentResult>;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, SaaSBuilderProvider>();

/** Register a SaaS-builder provider. */
export function registerSaaSBuilderProvider(provider: SaaSBuilderProvider): void {
  _registry.set(provider.id, provider);
}

/** Retrieve a registered SaaS-builder provider by ID. */
export function getSaaSBuilderProvider(id: string): SaaSBuilderProvider | null {
  return _registry.get(id) ?? null;
}

/** List all registered SaaS-builder providers. */
export function listSaaSBuilderProviders(): SaaSBuilderProvider[] {
  return [..._registry.values()];
}
