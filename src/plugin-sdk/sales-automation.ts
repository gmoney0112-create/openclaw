// Compat surface: openclaw/plugin-sdk/sales-automation
// Provides stable types and registry for autonomous sales automation.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Sales campaign types. */
export type SalesCampaignType =
  | "cold-email"
  | "linkedin-outreach"
  | "phone"
  | "follow-up"
  | "proposal"
  | "closing"
  | "custom";

/** Lead qualification levels. */
export type LeadQualification = "not-qualified" | "mql" | "sql" | "ready-to-close";

/** Sales campaign configuration. */
export type SalesCampaignConfig = {
  type: SalesCampaignType;
  name: string;
  description?: string;
  leadIds: string[];
  templates?: Record<string, string>; // template name -> content
  personalization?: boolean;
  schedule?: {
    startDate: number;
    frequency: "daily" | "weekly" | "custom";
    timezone?: string;
  };
  metadata?: Record<string, unknown>;
};

/** Sales message sent to a lead. */
export type SalesMessage = {
  id: string;
  leadId: string;
  campaignId: string;
  type: SalesCampaignType;
  content: string;
  channel: "email" | "linkedin" | "phone" | "sms";
  sentAt: number;
  status: "pending" | "sent" | "failed" | "bounced";
};

/** Lead response to a sales message. */
export type LeadResponse = {
  id: string;
  messageId: string;
  leadId: string;
  content: string;
  sentiment: "positive" | "neutral" | "negative";
  qualification: LeadQualification;
  receivedAt: number;
  requiresFollowup: boolean;
};

/** Sales campaign results. */
export type SalesCampaignResult = {
  campaignId: string;
  config: SalesCampaignConfig;
  messagesSent: number;
  responses: LeadResponse[];
  responseRate: number; // 0-1
  qualifiedLeads: number;
  nextActions: string[];
  timestamp: number;
};

/** A provider that automates sales processes. */
export type SalesAutomationProvider = {
  id: string;
  label: string;
  capabilities: string[]; // e.g., ['cold-email', 'linkedin-outreach', 'follow-up-automation']
  launchCampaign: (config: SalesCampaignConfig) => Promise<{ campaignId: string }>;
  qualifyLead: (leadId: string, context: Record<string, unknown>) => Promise<LeadQualification>;
  sendMessage: (leadId: string, content: string, channel: string) => Promise<SalesMessage>;
  processResponses: (campaignId: string) => Promise<LeadResponse[]>;
  getCampaignResults: (campaignId: string) => Promise<SalesCampaignResult>;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, SalesAutomationProvider>();

/** Register a sales-automation provider. */
export function registerSalesAutomationProvider(provider: SalesAutomationProvider): void {
  _registry.set(provider.id, provider);
}

/** Retrieve a registered sales-automation provider by ID. */
export function getSalesAutomationProvider(id: string): SalesAutomationProvider | null {
  return _registry.get(id) ?? null;
}

/** List all registered sales-automation providers. */
export function listSalesAutomationProviders(): SalesAutomationProvider[] {
  return [..._registry.values()];
}
