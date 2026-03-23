import type { ExecutionResult, N8nExecutionShape } from "./types";

function extractOutput(execution: N8nExecutionShape): Record<string, unknown> {
  const runData = execution.data?.resultData?.runData;
  if (!runData) {
    return {};
  }

  for (const nodeRuns of Object.values(runData)) {
    for (const run of nodeRuns) {
      const firstItem = run.data?.main?.[0]?.[0]?.json;
      if (firstItem) {
        return firstItem;
      }
    }
  }

  return {};
}

export class ResultParser {
  parse(n8nExecution: N8nExecutionShape): ExecutionResult {
    const startedAt = n8nExecution.startedAt ? Date.parse(n8nExecution.startedAt) : 0;
    const stoppedAt = n8nExecution.stoppedAt ? Date.parse(n8nExecution.stoppedAt) : Date.now();
    const duration_ms = startedAt > 0 ? Math.max(0, stoppedAt - startedAt) : 0;

    const status = n8nExecution.status === "error" || n8nExecution.error || n8nExecution.data?.resultData?.error
      ? "error"
      : "success";

    return {
      execution_id: String(n8nExecution.id ?? ""),
      status,
      output: status === "success" ? extractOutput(n8nExecution) : {},
      error_message: status === "error"
        ? n8nExecution.data?.resultData?.error?.message ?? n8nExecution.error ?? "Execution failed"
        : undefined,
      duration_ms
    };
  }
}
