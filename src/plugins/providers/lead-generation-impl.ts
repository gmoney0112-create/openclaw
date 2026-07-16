// MVP Implementation: Lead Generation Provider
// Reference implementation for autonomous lead sourcing and qualification

import type {
  LeadGenerationProvider,
  LeadCriteria,
  GeneratedLead,
} from "../plugin-sdk/lead-generation.js";

/** Reference lead generation provider with mock data for MVP */
export const createMvpLeadGenerationProvider = (): LeadGenerationProvider => {
  const mockLeadsDatabase: Record<string, GeneratedLead[]> = {
    "tech-founders": [
      {
        id: "lead-001",
        name: "Alice Chen",
        email: "alice@techstartup.io",
        phone: "+1-555-0101",
        title: "Founder",
        company: "TechVenture Inc",
        website: "techventure.io",
        linkedin: "linkedin.com/in/alicechen",
        industry: "SaaS",
        verificationScore: 0.92,
        source: "api",
        discoveredAt: Date.now() - 86400000,
        metadata: { companySize: 50, fundingStage: "Series A", location: "San Francisco" },
      },
      {
        id: "lead-002",
        name: "Bob Johnson",
        email: "bob@innovate.tech",
        phone: "+1-555-0102",
        title: "CTO",
        company: "Innovate Labs",
        website: "innovatelabs.tech",
        linkedin: "linkedin.com/in/bobjohnson",
        industry: "AI/ML",
        verificationScore: 0.85,
        source: "linkedin",
        discoveredAt: Date.now() - 172800000,
        metadata: { companySize: 120, fundingStage: "Series B", location: "Austin" },
      },
    ],
    "enterprise-buyers": [
      {
        id: "lead-003",
        name: "Carol Martinez",
        email: "cmartinez@enterprise.corp",
        phone: "+1-555-0103",
        title: "VP Product",
        company: "Enterprise Corp",
        website: "enterprise.corp",
        linkedin: "linkedin.com/in/carolmartinez",
        industry: "Enterprise Software",
        verificationScore: 0.88,
        source: "directory",
        discoveredAt: Date.now() - 259200000,
        metadata: { companySize: 5000, industry: "Fortune 500", location: "New York" },
      },
    ],
  };

  return {
    id: "lead-gen-mvp-ref",
    label: "MVP Lead Generation (Reference)",
    capabilities: ["email-finder", "b2b-scraping", "linkedin-sourcing"],

    generateLeads: async (criteria: LeadCriteria) => {
      // Simulate API call with mock data
      await new Promise((resolve) => setTimeout(resolve, 500));

      const key = criteria.industry?.toLowerCase().replace(/\s+/g, "-") || "tech-founders";
      const candidateLeads = mockLeadsDatabase[key] || mockLeadsDatabase["tech-founders"];

      // Filter by criteria
      let filtered = candidateLeads;
      if (criteria.company) {
        filtered = filtered.filter((l) =>
          l.company?.toLowerCase().includes(criteria.company!.toLowerCase()),
        );
      }
      if (criteria.title) {
        filtered = filtered.filter((l) =>
          l.title?.toLowerCase().includes(criteria.title!.toLowerCase()),
        );
      }

      const limit = criteria.limit || 10;
      const results = filtered.slice(0, limit);

      return {
        criteria,
        leads: results,
        totalGenerated: results.length,
        validatedLeads: Math.floor(results.length * 0.85), // 85% validation rate
        crm: {
          platform: "hubspot",
          uploadedCount: 0,
          errors: [],
        },
        timestamp: Date.now(),
      };
    },

    validateLead: async (lead: GeneratedLead) => {
      // Simulate validation
      await new Promise((resolve) => setTimeout(resolve, 100));
      return lead.verificationScore > 0.8;
    },

    uploadToCRM: async (leads, _crmPlatform, _config) => {
      // Simulate CRM upload
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        uploaded: leads.length,
        errors: [],
      };
    },
  };
};
