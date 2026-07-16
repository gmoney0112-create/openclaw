import { describe, it, expect, beforeEach } from "vitest";
import { createMvpSalesAutomationProvider } from "./sales-automation-impl.js";

describe("MVP Sales Automation Provider", () => {
  let provider: ReturnType<typeof createMvpSalesAutomationProvider>;

  beforeEach(() => {
    provider = createMvpSalesAutomationProvider();
  });

  it("should have correct metadata", () => {
    expect(provider.id).toBe("sales-automation-mvp-ref");
    expect(provider.label).toContain("Sales Automation");
    expect(provider.capabilities).toContain("cold-email");
  });

  it("should launch a sales campaign", async () => {
    const result = await provider.launchCampaign({
      type: "cold-email",
      name: "Test Campaign",
      leadIds: ["lead-1", "lead-2", "lead-3"],
      templates: {
        default: "Hello {{name}}, interested?",
      },
      personalization: true,
    });

    expect(result.campaignId).toBeDefined();
    expect(result.campaignId).toContain("campaign-");
  });

  it("should qualify leads", async () => {
    const leadId = "test-lead-123";
    const qualification = await provider.qualifyLead(leadId, {});

    expect(["not-qualified", "mql", "sql", "ready-to-close"]).toContain(qualification);
  });

  it("should cache lead qualification", async () => {
    const leadId = "test-lead-cache";
    const first = await provider.qualifyLead(leadId, {});
    const second = await provider.qualifyLead(leadId, {});

    // Should return same qualification (cached)
    expect(first).toBe(second);
  });

  it("should send direct messages", async () => {
    const message = await provider.sendMessage("lead-123", "Hello there!", "email");

    expect(message.id).toBeDefined();
    expect(message.leadId).toBe("lead-123");
    expect(message.content).toBe("Hello there!");
    expect(message.channel).toBe("email");
    expect(message.status).toBe("sent");
  });

  it("should process campaign responses", async () => {
    const campaign = await provider.launchCampaign({
      type: "cold-email",
      name: "Response Test",
      leadIds: Array.from({ length: 10 }, (_, i) => `lead-${i}`),
    });

    const responses = await provider.processResponses(campaign.campaignId);

    expect(Array.isArray(responses)).toBe(true);
    expect(responses.length).toBeGreaterThan(0);
    expect(responses.length).toBeLessThanOrEqual(10);

    responses.forEach((resp) => {
      expect(resp.id).toBeDefined();
      expect(["positive", "neutral", "negative"]).toContain(resp.sentiment);
      expect(["not-qualified", "mql", "sql", "ready-to-close"]).toContain(resp.qualification);
    });
  });

  it("should track campaign results", async () => {
    const campaign = await provider.launchCampaign({
      type: "follow-up",
      name: "Results Test",
      leadIds: ["lead-1", "lead-2"],
    });

    const results = await provider.getCampaignResults(campaign.campaignId);

    expect(results.campaignId).toBe(campaign.campaignId);
    expect(results.messagesSent).toBe(2);
    expect(results.responseRate).toBeGreaterThanOrEqual(0);
    expect(results.responseRate).toBeLessThanOrEqual(1);
    expect(results.timestamp).toBeGreaterThan(0);
  });

  it("should handle campaign follow-up actions", async () => {
    const campaign = await provider.launchCampaign({
      type: "cold-email",
      name: "Follow-up Test",
      leadIds: ["lead-1", "lead-2", "lead-3"],
    });

    const results = await provider.getCampaignResults(campaign.campaignId);

    expect(results.nextActions).toBeDefined();
    expect(Array.isArray(results.nextActions)).toBe(true);
    expect(results.nextActions.length).toBeGreaterThan(0);
  });

  it("should differentiate SQL from MQL leads", async () => {
    const campaign = await provider.launchCampaign({
      type: "cold-email",
      name: "Qualification Test",
      leadIds: Array.from({ length: 100 }, (_, i) => `lead-${i}`),
    });

    const responses = await provider.processResponses(campaign.campaignId);

    const sqlLeads = responses.filter((r) => r.qualification === "sql");
    const mqlLeads = responses.filter((r) => r.qualification === "mql");

    expect(sqlLeads.length + mqlLeads.length).toBeGreaterThan(0);
  });

  it("should mark followup requirements correctly", async () => {
    const campaign = await provider.launchCampaign({
      type: "cold-email",
      name: "Followup Test",
      leadIds: Array.from({ length: 20 }, (_, i) => `lead-${i}`),
    });

    const responses = await provider.processResponses(campaign.campaignId);

    responses.forEach((resp) => {
      // SQL leads should require follow-up
      if (resp.qualification === "sql") {
        expect(resp.requiresFollowup).toBe(true);
      }
    });
  });

  it("should handle missing campaign gracefully", async () => {
    await expect(provider.getCampaignResults("nonexistent-campaign")).rejects.toThrow();
  });

  it("should support multiple templates", async () => {
    const campaign = await provider.launchCampaign({
      type: "cold-email",
      name: "Multi-template Test",
      leadIds: ["lead-1", "lead-2"],
      templates: {
        default: "Default template",
        premium: "Premium template",
        budget: "Budget template",
      },
    });

    expect(campaign.campaignId).toBeDefined();
  });
});
