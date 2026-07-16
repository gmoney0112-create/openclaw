// Compat surface: openclaw/plugin-sdk/business-loop
// Provides stable types and registry for autonomous business operations.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Business goal specification. */
export type BusinessGoal = {
  id: string;
  type: "revenue" | "growth" | "efficiency" | "quality" | "customer-satisfaction" | "custom";
  target: number;
  metric: string; // e.g., "MRR", "new-customers", "error-rate"
  timeframe: number; // In days
  constraints?: Record<string, unknown>;
  priority?: "low" | "medium" | "high";
};

/** Loop iteration record. */
export type LoopIteration = {
  iterationNumber: number;
  timestamp: number;
  goals: BusinessGoal[];
  metrics: Record<string, number>;
  actions: string[]; // Taken actions
  results: Record<string, unknown>; // Action outcomes
  nextSteps?: string[];
  learnings?: string[];
  adjustments?: string[];
};

/** Business loop result. */
export type LoopResult = {
  loopId: string;
  completions: number;
  iterations: LoopIteration[];
  totalTime: number; // In milliseconds
  learnings: string[];
  efficiencyGains?: number; // 0-1 scale
  adaptations: string[];
  goalProgress: Record<string, number>; // goal ID -> progress (0-1)
  nextActions?: string[];
};

/** Loop configuration. */
export type LoopConfig = {
  id: string;
  name: string;
  description?: string;
  goals: BusinessGoal[];
  iterationInterval: number; // In milliseconds
  maxIterations?: number;
  checkpointInterval?: number;
  autoAdjust?: boolean;
  metadata?: Record<string, unknown>;
};

/** Loop status. */
export type LoopStatus = {
  loopId: string;
  isRunning: boolean;
  currentIteration: number;
  progress: number; // 0-1
  elapsedTime: number;
  estimatedRemaining: number;
  currentAction?: string;
  recentMetrics?: Record<string, number>;
  issues?: string[];
};

/** Business insight from loop execution. */
export type BusinessInsight = {
  insight: string;
  confidence: number; // 0-1
  actionable: boolean;
  recommendation?: string;
  expectedImpact?: string;
  timestamp: number;
};

/** A provider that runs autonomous business loops. */
export type BusinessLoopProvider = {
  id: string;
  label: string;
  capabilities: string[]; // e.g., ['goal-management', 'iterative-optimization', 'insights']
  runLoop: (config: LoopConfig) => Promise<{ loopId: string }>;
  monitorLoop: (loopId: string) => Promise<LoopStatus>;
  adjustStrategy?: (loopId: string, adjustments: string[]) => Promise<boolean>;
  reportResults: (loopId: string) => Promise<LoopResult>;
  getInsights: (loopId: string) => Promise<BusinessInsight[]>;
  pauseLoop?: (loopId: string) => Promise<boolean>;
  resumeLoop?: (loopId: string) => Promise<boolean>;
  stopLoop?: (loopId: string) => Promise<LoopResult>;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, BusinessLoopProvider>();

/** Register a business-loop provider. */
export function registerBusinessLoopProvider(provider: BusinessLoopProvider): void {
  _registry.set(provider.id, provider);
}

/** Retrieve a registered business-loop provider by ID. */
export function getBusinessLoopProvider(id: string): BusinessLoopProvider | null {
  return _registry.get(id) ?? null;
}

/** List all registered business-loop providers. */
export function listBusinessLoopProviders(): BusinessLoopProvider[] {
  return [..._registry.values()];
}
