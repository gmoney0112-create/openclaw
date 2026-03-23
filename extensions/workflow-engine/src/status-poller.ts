import { ResultParser } from "./result-parser";
import { WorkflowLibrary } from "./workflow-library";
import type { ExecutionResult, HttpClient, N8nExecutionShape } from "./types";
import { AxiosHttpClient } from "./workflow-trigger";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class StatusPoller {
  constructor(
    private readonly library: WorkflowLibrary,
    private readonly parser: ResultParser = new ResultParser(),
    private readonly httpClient: HttpClient = new AxiosHttpClient()
  ) {}

  async poll(executionId: string, timeoutMs = 60000): Promise<ExecutionResult> {
    const startedAt = Date.now();
    const apiKey = process.env.N8N_API_KEY ?? "";
    const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined;
    const url = `${this.library.getBaseUrl()}/api/v1/executions/${executionId}`;

    while (Date.now() - startedAt < timeoutMs) {
      const response = await this.httpClient.get<N8nExecutionShape>(url, {
        timeout: 5000,
        headers
      });
      const execution = response.data;
      const parsed = this.parser.parse(execution);

      if (execution.status === "success" || execution.status === "error" || execution.finished) {
        return parsed;
      }

      await sleep(2000);
    }

    return {
      execution_id: executionId,
      status: "error",
      output: {},
      error_message: `Polling timed out after ${timeoutMs}ms`,
      duration_ms: timeoutMs
    };
  }
}
