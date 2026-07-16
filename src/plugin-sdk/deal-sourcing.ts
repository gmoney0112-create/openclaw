// Compat surface: openclaw/plugin-sdk/deal-sourcing
// Provides stable types and registry for autonomous deal-sourcing capabilities.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Types of deals/opportunities to source. */
export type DealType =
  | "real-estate"
  | "saas-acquisition"
  | "domain"
  | "business"
  | "digital-product"
  | "custom";

/** Deal sourcing filters/criteria. */
export type DealCriteria = {
  type: DealType;
  minValue?: number;
  maxValue?: number;
  location?: string;
  industry?: string;
  tags?: string[];
  customFilters?: Record<string, unknown>;
};

/** A sourced deal/opportunity. */
export type SourcedDeal = {
  id: string;
  title: string;
  description: string;
  type: DealType;
  value?: number;
  valuation?: number;
  profitPotential?: number;
  competitionLevel: "low" | "medium" | "high";
  url?: string;
  metadata?: Record<string, unknown>;
  discoveredAt: number;
  confidence: number; // 0-1
};

/** Results from a deal sourcing query. */
export type DealSourcingResult = {
  criteria: DealCriteria;
  deals: SourcedDeal[];
  totalFound: number;
  analysis?: string;
  recommendations?: string[];
  timestamp: number;
};

/** A provider that sources business deals and opportunities. */
export type DealSourcingProvider = {
  id: string;
  label: string;
  capabilities: string[]; // e.g., ['real-estate', 'saas-deals', 'domain-sourcing']
  sourceDeal: (criteria: DealCriteria) => Promise<DealSourcingResult>;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, DealSourcingProvider>();

/** Register a deal-sourcing provider. */
export function registerDealSourcingProvider(provider: DealSourcingProvider): void {
  _registry.set(provider.id, provider);
}

/** Retrieve a registered deal-sourcing provider by ID. */
export function getDealSourcingProvider(id: string): DealSourcingProvider | null {
  return _registry.get(id) ?? null;
}

/** List all registered deal-sourcing providers. */
export function listDealSourcingProviders(): DealSourcingProvider[] {
  return [..._registry.values()];
}

/** Find a provider that supports a specific deal type. */
export function findProviderForDealType(dealType: DealType): DealSourcingProvider | null {
  const providers = listDealSourcingProviders();
  return providers.find((p) => p.capabilities.includes(dealType)) ?? null;
}
