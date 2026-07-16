// MVP Implementation: Sales Automation Provider
// Reference implementation for autonomous sales campaign execution

import type {
  SalesAutomationProvider,
  SalesCampaignConfig,
  SalesMessage,
  LeadResponse,
  SalesCampaignResult,
  LeadQualification,
} from "../plugin-sdk/sales-automation.js";

/** Reference sales automation provider for MVP */
export const createMvpSalesAutomationProvider = (): SalesAutomationProvider => {
  const campaignState = new Map<string, SalesCampaignResult>();
  const leadQualifications = new Map<string, LeadQualification>();
  const messagesSent = new Map<string, SalesMessage[]>();

  return {
    id: "sales-automation-mvp-ref",
    label: "MVP Sales Automation (Reference)",
    capabilities: ["cold-email", "follow-up-automation", "lead-qualification"],

    launchCampaign: async (config: SalesCampaignConfig) => {
      const campaignId = `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // Initialize campaign
      campaignState.set(campaignId, {
        campaignId,
        config,
        messagesSent: config.leadIds.length,
        responses: [],
        responseRate: 0,
        qualifiedLeads: 0,
        nextActions: ["Monitor responses", "Track engagement metrics"],
        timestamp: Date.now(),
      });

      // Simulate sending messages
      const messages: SalesMessage[] = [];
      config.leadIds.forEach((leadId, index) => {
        messages.push({
          id: `msg-${campaignId}-${index}`,
          leadId,
          campaignId,
          type: config.type,
          content:
            config.templates?.default || `Hello, interested in learning more about our solution?`,
          channel: "email",
          sentAt: Date.now() + index * 1000, // Stagger sends
          status: "sent",
        });
      });

      messagesSent.set(campaignId, messages);
      return { campaignId };
    },

    qualifyLead: async (leadId: string, _context) => {
      // Check if already qualified
      if (leadQualifications.has(leadId)) {
        return leadQualifications.get(leadId)!;
      }

      // Simulate qualification logic
      const random = Math.random();
      let qualification: LeadQualification;

      if (random < 0.1) {
        qualification = "ready-to-close";
      } else if (random < 0.3) {
        qualification = "sql"; // Sales Qualified Lead
      } else if (random < 0.6) {
        qualification = "mql"; // Marketing Qualified Lead
      } else {
        qualification = "not-qualified";
      }

      leadQualifications.set(leadId, qualification);
      return qualification;
    },

    sendMessage: async (leadId: string, content: string, channel: string) => {
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      return {
        id: messageId,
        leadId,
        campaignId: "direct",
        type: "custom",
        content,
        channel: channel as "email" | "linkedin" | "phone" | "sms",
        sentAt: Date.now(),
        status: "sent",
      };
    },

    processResponses: async (campaignId: string) => {
      const campaign = campaignState.get(campaignId);
      if (!campaign) {
        return [];
      }

      // Simulate receiving responses
      const responseRate = 0.3; // 30% response rate
      const messageCount = campaign.messagesSent;
      const responseCount = Math.floor(messageCount * responseRate);

      const responses: LeadResponse[] = [];
      for (let i = 0; i < responseCount; i++) {
        const qualification = Math.random() < 0.5 ? "sql" : "mql";
        responses.push({
          id: `resp-${campaignId}-${i}`,
          messageId: `msg-${campaignId}-${i}`,
          leadId: `lead-${i}`,
          content: `Response message ${i + 1}`,
          sentiment: Math.random() < 0.7 ? "positive" : "neutral",
          qualification,
          receivedAt: Date.now() + Math.random() * 86400000,
          requiresFollowup: qualification === "sql",
        });
      }

      // Update campaign
      campaign.responses = responses;
      campaign.responseRate = responseRate;
      campaign.qualifiedLeads = responses.filter((r) => r.qualification === "sql").length;
      campaign.nextActions = ["Send follow-up emails", "Schedule calls with SQL leads"];
      campaign.timestamp = Date.now();

      return responses;
    },

    getCampaignResults: async (campaignId: string) => {
      const result = campaignState.get(campaignId);
      if (!result) {
        throw new Error(`Campaign ${campaignId} not found`);
      }
      return result;
    },
  };
};
