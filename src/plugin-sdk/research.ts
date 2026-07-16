// Compat surface: openclaw/plugin-sdk/research
// Provides stable types and registry for autonomous research capabilities.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Types of research queries the engine can perform. */
export type ResearchQueryType = "market" | "competitor" | "trend" | "opportunity" | "custom";

/** Research depth/detail level. */
export type ResearchDepth = "brief" | "detailed" | "comprehensive";

/** Available data sources for research. */
export type ResearchSource = "web" | "news" | "social" | "business-db" | "academic" | "custom";

/** A research query request. */
export type ResearchQuery = {
  /** Type of research to perform. */
  type: ResearchQueryType;
  /** Topic or question to research. */
  topic: string;
  /** Desired depth of analysis. */
  depth: ResearchDepth;
  /** Data sources to query (defaults to all available). */
  sources?: ResearchSource[];
  /** Maximum number of results to return. */
  maxResults?: number;
  /** Custom parameters for specialized queries. */
  params?: Record<string, unknown>;
};

/** A single research finding. */
export type ResearchFinding = {
  /** Source identifier (e.g., "web", "news", "twitter"). */
  source: string;
  /** Title or headline of the finding. */
  title: string;
  /** Brief summary of the content. */
  summary: string;
  /** Relevance/confidence score (0-1). */
  confidence: number;
  /** URL or reference to the original content. */
  url?: string;
  /** When the finding was discovered. */
  timestamp?: number;
  /** Additional metadata. */
  metadata?: Record<string, unknown>;
};

/** Results from a research query. */
export type ResearchResult = {
  /** Original research query. */
  query: ResearchQuery;
  /** Findings returned by the research. */
  findings: ResearchFinding[];
  /** AI-generated analysis/synthesis of findings. */
  analysis?: string;
  /** When the research completed. */
  timestamp: number;
  /** Confidence in the overall results (0-1). */
  confidence?: number;
};

/** A provider that performs autonomous research. */
export type ResearchProvider = {
  /** Unique provider identifier. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Capabilities this provider supports. */
  capabilities: string[]; // e.g., ['market-analysis', 'competitor-tracking', 'trend-detection']
  /** Perform a research query. */
  research: (query: ResearchQuery) => Promise<ResearchResult>;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, ResearchProvider>();

/** Register a research provider. */
export function registerResearchProvider(provider: ResearchProvider): void {
  _registry.set(provider.id, provider);
}

/** Retrieve a registered research provider by ID. */
export function getResearchProvider(id: string): ResearchProvider | null {
  return _registry.get(id) ?? null;
}

/** List all registered research providers. */
export function listResearchProviders(): ResearchProvider[] {
  return [..._registry.values()];
}

/** Find a provider that supports a specific capability. */
export function findProviderWithCapability(capability: string): ResearchProvider | null {
  const providers = listResearchProviders();
  return providers.find((p) => p.capabilities.includes(capability)) ?? null;
}
