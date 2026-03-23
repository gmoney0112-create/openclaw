import type { AgentExecutionResult, Department, DepartmentAgent } from "./types";

abstract class BaseAgent implements DepartmentAgent {
  constructor(
    public readonly department: Department,
    public readonly tools: string[]
  ) {}

  protected async respond(command: string, tool_used: string, extra?: Record<string, unknown>): Promise<AgentExecutionResult> {
    return {
      summary: `${this.department} agent handled: ${command}`,
      tool_used,
      details: {
        command,
        department: this.department,
        ...extra
      }
    };
  }

  abstract execute(command: string): Promise<AgentExecutionResult>;
}

export class MarketingAgent extends BaseAgent {
  constructor() {
    super("marketing", ["browser_action", "post_social", "send_email", "create_ad"]);
  }

  async execute(command: string): Promise<AgentExecutionResult> {
    return this.respond(command, "create_ad", { campaignPlan: true });
  }
}

export class SalesAgent extends BaseAgent {
  constructor() {
    super("sales", ["create_ghl_contact", "create_ghl_opportunity", "generate_stripe_link", "trigger_sequence"]);
  }

  async execute(command: string): Promise<AgentExecutionResult> {
    return this.respond(command, "create_ghl_contact", { crmUpdate: true, opportunityCreated: true });
  }
}

export class ResearchAgent extends BaseAgent {
  constructor() {
    super("research", ["web_search", "scrape_url", "analyze_competitors", "generate_report"]);
  }

  async execute(command: string): Promise<AgentExecutionResult> {
    return this.respond(command, "generate_report", { reportReady: true, turnaroundSeconds: 12 });
  }
}

export class OpsAgent extends BaseAgent {
  constructor() {
    super("ops", ["trigger_workflow", "deploy_railway", "manage_files", "run_script"]);
  }

  async execute(command: string): Promise<AgentExecutionResult> {
    return this.respond(command, "trigger_workflow", { workflowTriggered: true });
  }
}

export class SupportAgent extends BaseAgent {
  constructor() {
    super("support", ["lookup_ghl_contact", "send_reply", "search_faq", "escalate_to_human"]);
  }

  async execute(command: string): Promise<AgentExecutionResult> {
    return this.respond(command, "send_reply", { replyPrepared: true });
  }
}

export function createDepartmentAgents(): Record<Department, DepartmentAgent> {
  return {
    marketing: new MarketingAgent(),
    sales: new SalesAgent(),
    research: new ResearchAgent(),
    ops: new OpsAgent(),
    support: new SupportAgent()
  };
}
