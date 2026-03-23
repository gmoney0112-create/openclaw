import config from "../config.json";
import type { WorkflowDefinition } from "./types";

type ConfigShape = {
  n8n_base_url: string;
  workflows: Record<string, Omit<WorkflowDefinition, "name">>;
};

const ENV_WEBHOOK_MAP: Record<string, string> = {
  create_ghl_contact: "WORKFLOW_WEBHOOK_CREATE_GHL_CONTACT",
  create_ghl_opportunity: "WORKFLOW_WEBHOOK_CREATE_GHL_OPPORTUNITY",
  generate_stripe_payment_link: "WORKFLOW_WEBHOOK_GENERATE_STRIPE_PAYMENT_LINK",
  send_onboarding_email_sequence: "WORKFLOW_WEBHOOK_SEND_ONBOARDING_EMAIL_SEQUENCE",
  launch_marketing_campaign: "WORKFLOW_WEBHOOK_LAUNCH_MARKETING_CAMPAIGN",
  update_crm_stage: "WORKFLOW_WEBHOOK_UPDATE_CRM_STAGE"
};

export class WorkflowLibrary {
  private readonly config: ConfigShape;

  constructor(configOverride?: ConfigShape) {
    this.config = configOverride ?? (config as ConfigShape);
  }

  getWorkflow(name: string): WorkflowDefinition {
    const definition = this.config.workflows[name];
    if (!definition) {
      throw new Error(`Unknown workflow: ${name}`);
    }

    const envKey = ENV_WEBHOOK_MAP[name];
    const webhook_url = (envKey ? process.env[envKey] : undefined) ?? definition.webhook_url;

    return {
      name,
      description: definition.description,
      required_fields: definition.required_fields,
      timeout_ms: definition.timeout_ms,
      webhook_url
    };
  }

  listWorkflows(): WorkflowDefinition[] {
    return Object.keys(this.config.workflows).map((name) => this.getWorkflow(name));
  }

  validatePayload(name: string, payload: Record<string, unknown>): { valid: true } | { valid: false; missing_fields: string[] } {
    const workflow = this.getWorkflow(name);
    const missing_fields = workflow.required_fields.filter((field) => {
      const value = payload[field];
      return value === undefined || value === null || value === "";
    });

    if (missing_fields.length > 0) {
      return { valid: false, missing_fields };
    }

    return { valid: true };
  }

  getBaseUrl(): string {
    return process.env.N8N_WEBHOOK_BASE_URL ?? this.config.n8n_base_url;
  }
}
