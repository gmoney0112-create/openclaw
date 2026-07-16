// Compat surface: openclaw/plugin-sdk/revenue-optimization
// Provides stable types and registry for autonomous revenue optimization.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Revenue metrics types. */
export type RevenueMetric = "mrr" | "arr" | "ltv" | "cac" | "churn" | "growth-rate" | "custom";

/** Revenue analysis criteria. */
export type RevenueAnalysisCriteria = {
  metrics?: RevenueMetric[];
  timeframe?: "month" | "quarter" | "year" | "custom";
  startDate?: number;
  endDate?: number;
  includeForecasts?: boolean;
  includeBottlenecks?: boolean;
  customFilters?: Record<string, unknown>;
};

/** Current revenue metrics and values. */
export type RevenueMetrics = {
  mrr?: number; // Monthly Recurring Revenue
  arr?: number; // Annual Recurring Revenue
  ltv?: number; // Lifetime Value
  cac?: number; // Customer Acquisition Cost
  churn?: number; // Churn rate (0-1)
  growthRate?: number; // Month-over-month growth (0-1)
  [key: string]: unknown;
};

/** Revenue trend analysis. */
export type RevenueTrend = {
  metric: RevenueMetric;
  current: number;
  previous: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
  confidence: number; // 0-1
};

/** Bottleneck identification. */
export type RevenueBottleneck = {
  issue: string;
  severity: "low" | "medium" | "high";
  impact: number; // Estimated impact on revenue
  description: string;
  recommendations: string[];
};

/** Revenue optimization result. */
export type RevenueOptimizationResult = {
  criteria: RevenueAnalysisCriteria;
  metrics: RevenueMetrics;
  trends: RevenueTrend[];
  bottlenecks: RevenueBottleneck[];
  forecast?: {
    projectedMRR?: number;
    projectedARR?: number;
    timeframe: number;
  };
  optimizationOpportunities?: string[];
  recommendations?: string[];
  timestamp: number;
};

/** Pricing recommendation. */
export type PricingRecommendation = {
  strategy: "value-based" | "cost-plus" | "competitive" | "custom";
  recommendedPrice: number;
  confidence: number;
  rationale: string;
  expectedImpact?: {
    conversionChange?: number;
    revenueChange?: number;
    churnChange?: number;
  };
};

/** A provider that optimizes revenue. */
export type RevenueOptimizationProvider = {
  id: string;
  label: string;
  capabilities: string[]; // e.g., ['metric-analysis', 'forecasting', 'pricing-optimization']
  analyzeRevenue: (criteria: RevenueAnalysisCriteria) => Promise<RevenueOptimizationResult>;
  forecastRevenue?: (
    metrics: RevenueMetrics,
    months: number,
  ) => Promise<{ projected: RevenueMetrics; confidence: number }>;
  identifyBottlenecks?: (criteria: RevenueAnalysisCriteria) => Promise<RevenueBottleneck[]>;
  recommendPricing?: (
    currentPrice: number,
    context: Record<string, unknown>,
  ) => Promise<PricingRecommendation>;
  optimizeCosts?: (
    budget: number,
    constraints: Record<string, unknown>,
  ) => Promise<{ optimizations: string[]; estimatedSavings: number }>;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, RevenueOptimizationProvider>();

/** Register a revenue-optimization provider. */
export function registerRevenueOptimizationProvider(provider: RevenueOptimizationProvider): void {
  _registry.set(provider.id, provider);
}

/** Retrieve a registered revenue-optimization provider by ID. */
export function getRevenueOptimizationProvider(id: string): RevenueOptimizationProvider | null {
  return _registry.get(id) ?? null;
}

/** List all registered revenue-optimization providers. */
export function listRevenueOptimizationProviders(): RevenueOptimizationProvider[] {
  return [..._registry.values()];
}
