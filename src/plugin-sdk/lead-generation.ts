// Compat surface: openclaw/plugin-sdk/lead-generation
// Provides stable types and registry for autonomous lead generation.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Lead generation source types. */
export type LeadSource =
  | "web-scraping"
  | "api"
  | "email-finder"
  | "social"
  | "directory"
  | "custom";

/** Lead generation criteria. */
export type LeadCriteria = {
  industry?: string;
  company?: string;
  title?: string;
  location?: string;
  minCompanySize?: number;
  maxCompanySize?: number;
  sources?: LeadSource[];
  limit?: number;
  includeEmail?: boolean;
  includePhone?: boolean;
};

/** Generated lead contact. */
export type GeneratedLead = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  website?: string;
  linkedin?: string;
  industry?: string;
  verificationScore: number; // 0-1
  source: LeadSource;
  discoveredAt: number;
  metadata?: Record<string, unknown>;
};

/** Results from lead generation. */
export type LeadGenerationResult = {
  criteria: LeadCriteria;
  leads: GeneratedLead[];
  totalGenerated: number;
  validatedLeads: number;
  crm?: {
    platform: string; // 'hubspot' | 'gohighlevel' | 'airtable'
    uploadedCount: number;
    errors?: string[];
  };
  timestamp: number;
};

/** A provider that generates sales leads. */
export type LeadGenerationProvider = {
  id: string;
  label: string;
  capabilities: string[]; // e.g., ['email-finder', 'b2b-scraping', 'linkedin-sourcing']
  generateLeads: (criteria: LeadCriteria) => Promise<LeadGenerationResult>;
  validateLead?: (lead: GeneratedLead) => Promise<boolean>;
  uploadToCRM?: (
    leads: GeneratedLead[],
    crmPlatform: string,
    config: Record<string, unknown>,
  ) => Promise<{ uploaded: number; errors: string[] }>;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, LeadGenerationProvider>();

/** Register a lead-generation provider. */
export function registerLeadGenerationProvider(provider: LeadGenerationProvider): void {
  _registry.set(provider.id, provider);
}

/** Retrieve a registered lead-generation provider by ID. */
export function getLeadGenerationProvider(id: string): LeadGenerationProvider | null {
  return _registry.get(id) ?? null;
}

/** List all registered lead-generation providers. */
export function listLeadGenerationProviders(): LeadGenerationProvider[] {
  return [..._registry.values()];
}
