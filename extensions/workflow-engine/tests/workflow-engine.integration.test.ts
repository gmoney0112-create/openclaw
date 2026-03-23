import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { ResultParser } from "../src/result-parser";
import { StatusPoller } from "../src/status-poller";
import type { HttpClient, N8nExecutionShape } from "../src/types";
import { WorkflowLibrary } from "../src/workflow-library";
import { WorkflowTrigger } from "../src/workflow-trigger";

type MockConfig = {
  n8n_base_url: string;
  workflows: Record<string, {
    webhook_url: string;
    description: string;
    required_fields: string[];
    timeout_ms: number;
  }>;
};

class MockHttpClient implements HttpClient {
  constructor(
    private readonly handlers: {
      post?: (url: string, body: unknown) => Promise<{ status: number; data: unknown }>;
      get?: (url: string) => Promise<{ status: number; data: unknown }>;
    }
  ) {}

  async post<T>(url: string, body: unknown): Promise<{ status: number; data: T }> {
    if (!this.handlers.post) {
      throw new Error("POST handler missing");
    }
    return this.handlers.post(url, body) as Promise<{ status: number; data: T }>;
  }

  async get<T>(url: string): Promise<{ status: number; data: T }> {
    if (!this.handlers.get) {
      throw new Error("GET handler missing");
    }
    return this.handlers.get(url) as Promise<{ status: number; data: T }>;
  }
}

async function run(): Promise<void> {
  const config: MockConfig = {
    n8n_base_url: "https://example.n8n.cloud",
    workflows: {
      create_ghl_contact: {
        webhook_url: "https://example.n8n.cloud/webhook/contact",
        description: "Create a new contact in GoHighLevel",
        required_fields: ["email", "firstName", "lastName"],
        timeout_ms: 30000
      },
      create_ghl_opportunity: {
        webhook_url: "https://example.n8n.cloud/webhook/opportunity",
        description: "Create an opportunity in GHL pipeline",
        required_fields: ["contactId", "pipelineId", "monetaryValue"],
        timeout_ms: 30000
      },
      generate_stripe_payment_link: {
        webhook_url: "https://example.n8n.cloud/webhook/stripe",
        description: "Generate a Stripe payment link",
        required_fields: ["amount", "productName", "customerEmail"],
        timeout_ms: 30000
      },
      send_onboarding_email_sequence: {
        webhook_url: "https://example.n8n.cloud/webhook/onboarding",
        description: "Trigger the 9-email onboarding sequence",
        required_fields: ["contactId", "tier"],
        timeout_ms: 15000
      },
      launch_marketing_campaign: {
        webhook_url: "https://example.n8n.cloud/webhook/campaign",
        description: "Launch a GHL marketing campaign",
        required_fields: ["campaignId", "contactIds"],
        timeout_ms: 30000
      },
      update_crm_stage: {
        webhook_url: "https://example.n8n.cloud/webhook/stage",
        description: "Move a contact to a new pipeline stage",
        required_fields: ["contactId", "pipelineId", "stageId"],
        timeout_ms: 15000
      }
    }
  };

  const library = new WorkflowLibrary(config);

  const workflow = library.getWorkflow("create_ghl_contact");
  assert.equal(workflow.required_fields.length, 3, "workflow definition should include required fields");

  const invalid = library.validatePayload("create_ghl_contact", { email: "test@test.com" });
  assert.equal(invalid.valid, false, "missing fields should fail validation");
  if (!invalid.valid) {
    assert.deepEqual(invalid.missing_fields, ["firstName", "lastName"], "missing fields should be reported");
  }

  const valid = library.validatePayload("create_ghl_contact", {
    email: "test@test.com",
    firstName: "Test",
    lastName: "User"
  });
  assert.equal(valid.valid, true, "complete payload should pass validation");

  const successfulTrigger = new WorkflowTrigger(
    library,
    new MockHttpClient({
      post: async () => ({
        status: 200,
        data: { execution_id: "exec-123" }
      })
    })
  );
  const triggerResponse = await successfulTrigger.trigger({
    workflow_name: "create_ghl_contact",
    payload: { email: "test@test.com", firstName: "Test", lastName: "User" }
  });
  assert.equal(triggerResponse.execution_id, "exec-123", "trigger should return execution id");

  const failingTrigger = new WorkflowTrigger(
    library,
    new MockHttpClient({
      post: async () => {
        throw new Error("Trigger failed with status 500: internal");
      }
    })
  );
  await assert.rejects(
    () => failingTrigger.trigger({
      workflow_name: "create_ghl_contact",
      payload: { email: "test@test.com", firstName: "Test", lastName: "User" }
    }),
    /500/,
    "trigger should surface failing status"
  );

  let pollCount = 0;
  const successfulPoller = new StatusPoller(
    library,
    new ResultParser(),
    new MockHttpClient({
      get: async () => {
        pollCount += 1;
        const running: N8nExecutionShape = { id: "exec-1", status: "running", finished: false };
        const success: N8nExecutionShape = {
          id: "exec-1",
          status: "success",
          finished: true,
          startedAt: new Date(Date.now() - 1000).toISOString(),
          stoppedAt: new Date().toISOString(),
          data: {
            resultData: {
              runData: {
                Done: [
                  {
                    data: {
                      main: [[{ json: { ok: true } }]]
                    }
                  }
                ]
              }
            }
          }
        };
        return {
          status: 200,
          data: pollCount === 1 ? running : success
        };
      }
    })
  );
  const polled = await successfulPoller.poll("exec-1", 2500);
  assert.equal(polled.status, "success", "poller should return success after workflow completes");

  const timeoutPoller = new StatusPoller(
    library,
    new ResultParser(),
    new MockHttpClient({
      get: async () => ({
        status: 200,
        data: { id: "exec-timeout", status: "running", finished: false }
      })
    })
  );
  const timeoutResult = await timeoutPoller.poll("exec-timeout", 50);
  assert.equal(timeoutResult.status, "error", "poller should return timeout error");
  assert.match(timeoutResult.error_message ?? "", /timed out/i, "timeout should be reported");

  const server = createServer((request, response) => {
    if (request.url === "/workflow/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({
        status: "ok",
        n8n_reachable: false,
        workflow_count: library.listWorkflows().length
      }));
      return;
    }

    if (request.url === "/workflow/list") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(library.listWorkflows()));
      return;
    }

    response.writeHead(404).end();
  });

  server.listen(0);
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  const healthResponse = await fetch(`http://127.0.0.1:${port}/workflow/health`);
  const healthJson = await healthResponse.json() as { status: string };
  assert.equal(healthJson.status, "ok", "health endpoint should return ok");

  const listResponse = await fetch(`http://127.0.0.1:${port}/workflow/list`);
  const listJson = await listResponse.json() as Array<unknown>;
  assert.equal(listJson.length, 6, "list endpoint should return six workflows");

  server.close();

  console.log("workflow-engine integration test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
