// Compat surface: openclaw/plugin-sdk/auto-coder
// Provides stable types and registry for autonomous code analysis and generation.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Types of code analysis. */
export type CodeAnalysisType =
  | "bug-detection"
  | "performance"
  | "security"
  | "type-safety"
  | "style"
  | "full";

/** Severity levels for code issues. */
export type IssueSeverity = "error" | "warning" | "info";

/** A code analysis request. */
export type CodeAnalysisRequest = {
  /** File path or code location to analyze. */
  codeLocation: string;
  /** Type of analysis to perform. */
  analysisType: CodeAnalysisType;
  /** Code content to analyze (if not reading from file). */
  code?: string;
  /** Additional context (e.g., framework, dependencies). */
  context?: Record<string, unknown>;
};

/** An issue found during code analysis. */
export type CodeIssue = {
  /** File path where the issue was found. */
  file: string;
  /** Line number (1-indexed). */
  line: number;
  /** Severity of the issue. */
  severity: IssueSeverity;
  /** Human-readable error message. */
  message: string;
  /** Suggested fix (if available). */
  suggestion?: string;
  /** Whether this issue can be automatically fixed. */
  autoFixable: boolean;
  /** Additional details about the issue. */
  details?: Record<string, unknown>;
};

/** A request to generate fixes for code issues. */
export type CodeFixRequest = {
  /** Issues to fix. */
  issues: CodeIssue[];
  /** Strategy for testing the fix. */
  testStrategy: "unit" | "integration" | "e2e" | "none";
  /** Strategy for deploying the patch. */
  deployStrategy: "immediate" | "staged" | "manual";
  /** Whether to run a dry-run before applying. */
  dryRun?: boolean;
};

/** A generated code patch. */
export type CodePatch = {
  /** Generated patch content (diff format). */
  patchContent: string;
  /** Test script to validate the patch (if generated). */
  testScript?: string;
  /** Summary of changes. */
  summary: string;
  /** Risk assessment of the patch. */
  riskLevel?: "low" | "medium" | "high";
};

/** Result of validating a patch. */
export type PatchValidationResult = {
  /** Whether the patch is valid and can be applied. */
  isValid: boolean;
  /** Test results (if any). */
  testResults?: {
    passed: number;
    failed: number;
    skipped: number;
  };
  /** Error message if validation failed. */
  error?: string;
  /** Detailed validation report. */
  details?: Record<string, unknown>;
};

/** Result of deploying a patch. */
export type PatchDeploymentResult = {
  /** Whether the patch was successfully deployed. */
  success: boolean;
  /** Whether the patch was actually deployed (vs staged/manual). */
  deployed: boolean;
  /** Commit SHA if deployed to git. */
  commitSha?: string;
  /** NPM package version if published. */
  packageVersion?: string;
  /** Deployment message or error. */
  message?: string;
};

/** A provider that analyzes and generates code fixes. */
export type AutoCoderProvider = {
  /** Unique provider identifier. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Analyze code for issues. */
  analyzeCode: (req: CodeAnalysisRequest) => Promise<CodeIssue[]>;
  /** Generate a fix for code issues. */
  generateFix: (req: CodeFixRequest) => Promise<CodePatch>;
  /** Validate a patch before applying. */
  validatePatch: (patch: CodePatch) => Promise<PatchValidationResult>;
  /** Deploy/apply a validated patch. */
  deployPatch: (patch: CodePatch, strategy: string) => Promise<PatchDeploymentResult>;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, AutoCoderProvider>();

/** Register an auto-coder provider. */
export function registerAutoCoderProvider(provider: AutoCoderProvider): void {
  _registry.set(provider.id, provider);
}

/** Retrieve a registered auto-coder provider by ID. */
export function getAutoCoderProvider(id: string): AutoCoderProvider | null {
  return _registry.get(id) ?? null;
}

/** List all registered auto-coder providers. */
export function listAutoCoderProviders(): AutoCoderProvider[] {
  return [..._registry.values()];
}
