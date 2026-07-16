import { describe, it, expect, beforeEach } from "vitest";
import { createMvpLeadGenerationProvider } from "./lead-generation-impl.js";

describe("MVP Lead Generation Provider", () => {
  let provider: ReturnType<typeof createMvpLeadGenerationProvider>;

  beforeEach(() => {
    provider = createMvpLeadGenerationProvider();
  });

  it("should have correct metadata", () => {
    expect(provider.id).toBe("lead-gen-mvp-ref");
    expect(provider.label).toContain("Lead Generation");
    expect(provider.capabilities).toContain("email-finder");
  });

  it("should generate leads based on criteria", async () => {
    const result = await provider.generateLeads({
      industry: "SaaS",
      limit: 10,
      includeEmail: true,
    });

    expect(result.leads).toBeDefined();
    expect(Array.isArray(result.leads)).toBe(true);
    expect(result.criteria.industry).toBe("SaaS");
    expect(result.timestamp).toBeGreaterThan(0);
  });

  it("should return CRM integration info", async () => {
    const result = await provider.generateLeads({
      industry: "SaaS",
      limit: 5,
    });

    expect(result.crm).toBeDefined();
    expect(result.crm.platform).toBe("hubspot");
    expect(result.crm.uploadedCount).toBe(0);
  });

  it("should validate leads with verification score", async () => {
    const result = await provider.generateLeads({
      industry: "SaaS",
      limit: 1,
    });

    const lead = result.leads[0];
    if (lead) {
      const isValid = await provider.validateLead(lead);
      expect(typeof isValid).toBe("boolean");
      // Lead with score 0.85+ should be valid
      if (lead.verificationScore > 0.8) {
        expect(isValid).toBe(true);
      }
    }
  });

  it("should upload leads to CRM", async () => {
    const result = await provider.generateLeads({
      industry: "SaaS",
      limit: 5,
    });

    const uploadResult = await provider.uploadToCRM!(result.leads, "hubspot", {});
    expect(uploadResult.uploaded).toBe(result.leads.length);
    expect(Array.isArray(uploadResult.errors)).toBe(true);
  });

  it("should filter leads by company name", async () => {
    const result = await provider.generateLeads({
      company: "Tech",
      limit: 10,
    });

    // Should filter to relevant companies
    result.leads.forEach((lead) => {
      if (lead.company) {
        expect(lead.company.toLowerCase()).toContain("tech");
      }
    });
  });

  it("should filter leads by title", async () => {
    const result = await provider.generateLeads({
      title: "founder",
      limit: 10,
    });

    result.leads.forEach((lead) => {
      if (lead.title) {
        expect(lead.title.toLowerCase()).toContain("founder");
      }
    });
  });

  it("should respect limit parameter", async () => {
    const limit = 3;
    const result = await provider.generateLeads({
      industry: "SaaS",
      limit,
    });

    expect(result.leads.length).toBeLessThanOrEqual(limit);
  });

  it("should include email and phone when requested", async () => {
    const result = await provider.generateLeads({
      industry: "SaaS",
      includeEmail: true,
      includePhone: true,
      limit: 5,
    });

    result.leads.forEach((lead) => {
      expect(lead.email).toBeDefined();
      expect(lead.phone).toBeDefined();
    });
  });

  it("should return lead with all required fields", async () => {
    const result = await provider.generateLeads({
      industry: "SaaS",
      limit: 1,
    });

    const lead = result.leads[0];
    expect(lead.id).toBeDefined();
    expect(lead.name).toBeDefined();
    expect(lead.verificationScore).toBeGreaterThanOrEqual(0);
    expect(lead.verificationScore).toBeLessThanOrEqual(1);
    expect(lead.source).toBeDefined();
    expect(lead.discoveredAt).toBeGreaterThan(0);
  });

  it("should calculate validation rate", async () => {
    const result = await provider.generateLeads({
      industry: "SaaS",
      limit: 10,
    });

    const validatedCount = result.validatedLeads;
    expect(validatedCount).toBeLessThanOrEqual(result.leads.length);
    expect(validatedCount).toBeGreaterThan(0);
  });
});
