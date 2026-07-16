// Compat surface: openclaw/plugin-sdk/decision-engine
// Provides stable types and registry for autonomous decision making.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Decision context and parameters. */
export type DecisionContext = {
  question: string;
  options: string[];
  constraints?: string[];
  availableData?: Record<string, unknown>;
  stakeholders?: string[];
  deadline?: number;
  precedent?: string;
  businessGoals?: string[];
  metadata?: Record<string, unknown>;
};

/** Analysis of a single option. */
export type OptionAnalysis = {
  option: string;
  pros: string[];
  cons: string[];
  estimatedOutcome?: string;
  riskLevel?: "low" | "medium" | "high";
  resourcesRequired?: string[];
  timeToImplement?: number;
};

/** Risk assessment for a decision. */
export type RiskAssessment = {
  overallRisk: "low" | "medium" | "high";
  technicalRisk?: number; // 0-1
  businessRisk?: number; // 0-1
  operationalRisk?: number; // 0-1
  mitigationStrategies?: string[];
  contingencyPlans?: string[];
};

/** Decision analysis result. */
export type DecisionAnalysis = {
  context: DecisionContext;
  optionAnalyses: OptionAnalysis[];
  riskAssessment: RiskAssessment;
  confidenceScores: Record<string, number>; // option -> confidence (0-1)
  recommendedOption?: string;
  recommendations?: string[];
  timestamp: number;
};

/** Decision outcome and recommendation. */
export type DecisionOutcome = {
  chosenOption: string;
  rationale: string;
  expectedValue: number; // Quantified expected outcome
  confidence: number; // 0-1
  implementationSteps?: string[];
  successMetrics?: string[];
  failureModes?: string[];
  reviewDate?: number;
};

/** Option ranking. */
export type RankedOption = {
  option: string;
  rank: number;
  score: number; // 0-1
  reasoning: string;
};

/** A provider that makes decisions autonomously. */
export type DecisionEngineProvider = {
  id: string;
  label: string;
  capabilities: string[]; // e.g., ['multi-option-analysis', 'risk-assessment', 'recommendation']
  analyzeDecision: (context: DecisionContext) => Promise<DecisionAnalysis>;
  rankOptions: (context: DecisionContext) => Promise<RankedOption[]>;
  assessRisks: (option: string, context: DecisionContext) => Promise<RiskAssessment>;
  getRecommendation: (analysis: DecisionAnalysis) => Promise<DecisionOutcome>;
  explainReasoning?: (option: string, context: DecisionContext) => Promise<string>;
  simulateOutcomes?: (option: string, context: DecisionContext) => Promise<Record<string, unknown>>;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, DecisionEngineProvider>();

/** Register a decision-engine provider. */
export function registerDecisionEngineProvider(provider: DecisionEngineProvider): void {
  _registry.set(provider.id, provider);
}

/** Retrieve a registered decision-engine provider by ID. */
export function getDecisionEngineProvider(id: string): DecisionEngineProvider | null {
  return _registry.get(id) ?? null;
}

/** List all registered decision-engine providers. */
export function listDecisionEngineProviders(): DecisionEngineProvider[] {
  return [..._registry.values()];
}
