import axios from "axios";
import { randomUUID } from "node:crypto";
import { WorkflowLibrary } from "./workflow-library";
import type { HttpClient, TriggerRequest, TriggerResponse } from "./types";

class AxiosHttpClient implements HttpClient {
  async post<T>(url: string, body: unknown, options?: { timeout?: number; headers?: Record<string, string> }): Promise<{ status: number; data: T }> {
    const response = await axios.post<T>(url, body, {
      timeout: options?.timeout,
      headers: options?.headers
    });
    return { status: response.status, data: response.data };
  }

  async get<T>(url: string, options?: { timeout?: number; headers?: Record<string, string> }): Promise<{ status: number; data: T }> {
    const response = await axios.get<T>(url, {
      timeout: options?.timeout,
      headers: options?.headers
    });
    return { status: response.status, data: response.data };
  }
}

export class WorkflowTrigger {
  constructor(
    private readonly library: WorkflowLibrary,
    private readonly httpClient: HttpClient = new AxiosHttpClient()
  ) {}

  async trigger(request: TriggerRequest): Promise<TriggerResponse> {
    const validation = this.library.validatePayload(request.workflow_name, request.payload);
    if (!validation.valid) {
      throw new Error(`Missing required fields: ${validation.missing_fields.join(", ")}`);
    }

    const workflow = this.library.getWorkflow(request.workflow_name);
    if (!workflow.webhook_url) {
      throw new Error(`Webhook URL is not configured for workflow: ${request.workflow_name}`);
    }

    try {
      const result = await this.httpClient.post<Record<string, unknown>>(workflow.webhook_url, request.payload, {
        timeout: workflow.timeout_ms,
        headers: {
          "Content-Type": "application/json"
        }
      });

      const execution_id = String(result.data.execution_id ?? result.data.id ?? randomUUID());
      console.log(
        `[workflow-engine] triggered=${request.workflow_name} payload_keys=${Object.keys(request.payload).join(",")}`
      );

      return {
        execution_id,
        workflow_name: request.workflow_name,
        status: "queued",
        started_at: new Date().toISOString()
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? 500;
        const body = typeof error.response?.data === "string" ? error.response.data : JSON.stringify(error.response?.data ?? {});
        throw new Error(`Trigger failed with status ${status}: ${body}`);
      }

      throw error;
    }
  }
}

export { AxiosHttpClient };
