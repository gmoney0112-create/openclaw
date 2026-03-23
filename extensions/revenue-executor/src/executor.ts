import type {
  HttpClient,
  RevenueAction,
  RevenueEndpoints,
  RevenueExecuteRequest,
  RevenueExecutionResult,
  RevenueServiceHealth
} from "./types";

const SUPPORTED_ACTIONS: RevenueAction[] = [
  "llm_complete",
  "workflow_trigger",
  "agent_dispatch",
  "skills_run",
  "research_run",
  "browser_action",
  "os_process",
  "voice_transcribe",
  "autocoder_analyze"
];

type DispatchTarget = {
  endpoint: keyof RevenueEndpoints;
  path: string;
  payload: Record<string, unknown>;
};

function stringifyContext(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }
  return JSON.stringify(input ?? {});
}

export class RevenueExecutor {
  constructor(
    private readonly endpoints: RevenueEndpoints,
    private readonly httpClient: HttpClient,
    private readonly memoryTopK: number
  ) {}

  static supportedActions(): RevenueAction[] {
    return [...SUPPORTED_ACTIONS];
  }

  getEndpoints(): RevenueEndpoints {
    return this.endpoints;
  }

  async execute(request: RevenueExecuteRequest): Promise<RevenueExecutionResult> {
    if (!SUPPORTED_ACTIONS.includes(request.action)) {
      throw new Error(`Unsupported action: ${request.action}`);
    }

    const contextText = stringifyContext(request.context ?? request.payload);
    const memoryBefore = await this.httpClient.post<unknown>(this.endpoints.memory, "/memory/retrieve", {
      query: contextText,
      top_k: this.memoryTopK,
      tags: ["revenue"]
    });

    const dispatch = this.resolveDispatch(request, memoryBefore);
    const actionResult = await this.httpClient.post<unknown>(
      this.endpoints[dispatch.endpoint],
      dispatch.path,
      dispatch.payload
    );

    const memoryAfter = await this.httpClient.post<unknown>(this.endpoints.memory, "/memory/store", {
      content: this.executionSummary(request, actionResult),
      tags: ["revenue", request.action],
      source: "revenue-executor",
      session_id: request.session_id
    });

    return {
      action: request.action,
      session_id: request.session_id,
      memory_before: memoryBefore,
      dispatched_to: this.endpoints[dispatch.endpoint],
      dispatched_path: dispatch.path,
      dispatched_payload: dispatch.payload,
      action_result: actionResult,
      memory_after: memoryAfter
    };
  }

  async health(): Promise<RevenueServiceHealth> {
    const checks: Record<string, "ok" | "error"> = {};
    const targets: Array<{ key: keyof RevenueEndpoints; path: string }> = [
      { key: "browser", path: "/browser/health" },
      { key: "llm", path: "/llm/health" },
      { key: "memory", path: "/memory/health" },
      { key: "workflow", path: "/workflow/health" },
      { key: "agent", path: "/agent/health" },
      { key: "skills", path: "/skills/health" },
      { key: "research", path: "/research/health" },
      { key: "os", path: "/os/health" },
      { key: "voice", path: "/voice/health" },
      { key: "autocoder", path: "/autocoder/health" }
    ];

    await Promise.all(
      targets.map(async (target) => {
        try {
          await this.httpClient.get<unknown>(this.endpoints[target.key], target.path);
          checks[target.key] = "ok";
        } catch {
          checks[target.key] = "error";
        }
      })
    );

    return {
      status: "ok",
      endpoints: this.endpoints,
      checks
    };
  }

  private resolveDispatch(request: RevenueExecuteRequest, memoryBefore: unknown): DispatchTarget {
    const payload = request.payload ?? {};

    switch (request.action) {
      case "llm_complete": {
        const prompt = typeof payload.prompt === "string" ? payload.prompt : stringifyContext(payload);
        const taskType = typeof payload.task_type === "string" ? payload.task_type : "sales";
        return {
          endpoint: "llm",
          path: "/llm/complete",
          payload: {
            task_type: taskType,
            prompt: this.withMemoryPrompt(prompt, memoryBefore),
            max_tokens: payload.max_tokens,
            temperature: payload.temperature,
            system_prompt: payload.system_prompt
          }
        };
      }
      case "workflow_trigger": {
        return {
          endpoint: "workflow",
          path: "/workflow/trigger",
          payload: {
            workflow_name: payload.workflow_name,
            payload: payload.payload ?? {}
          }
        };
      }
      case "agent_dispatch": {
        return {
          endpoint: "agent",
          path: "/agent/dispatch",
          payload: {
            command: payload.command ?? stringifyContext(payload)
          }
        };
      }
      case "skills_run": {
        return {
          endpoint: "skills",
          path: "/skills/run",
          payload: {
            skill_name: payload.skill_name,
            tool_name: payload.tool_name,
            params: payload.params ?? {}
          }
        };
      }
      case "research_run": {
        return {
          endpoint: "research",
          path: "/research/run",
          payload: {
            topic: payload.topic ?? stringifyContext(payload),
            depth: payload.depth ?? "quick",
            output: payload.output ?? "summary"
          }
        };
      }
      case "browser_action": {
        return {
          endpoint: "browser",
          path: "/browser/action",
          payload: {
            sessionId: payload.sessionId,
            action: payload.action,
            params: payload.params ?? {}
          }
        };
      }
      case "os_process": {
        return {
          endpoint: "os",
          path: "/os/process",
          payload: {
            action: payload.action ?? "run",
            command: payload.command,
            args: payload.args ?? []
          }
        };
      }
      case "voice_transcribe": {
        return {
          endpoint: "voice",
          path: "/voice/transcribe",
          payload: {
            text: payload.text ?? "hey openclaw"
          }
        };
      }
      case "autocoder_analyze": {
        return {
          endpoint: "autocoder",
          path: "/autocoder/analyze",
          payload: {
            log: payload.log ?? ""
          }
        };
      }
      default:
        throw new Error(`Unhandled action: ${request.action}`);
    }
  }

  private withMemoryPrompt(prompt: string, memoryBefore: unknown): string {
    return [
      "You are executing a revenue operation.",
      `Existing context: ${JSON.stringify(memoryBefore)}`,
      `Operator request: ${prompt}`
    ].join("\n\n");
  }

  private executionSummary(request: RevenueExecuteRequest, result: unknown): string {
    return JSON.stringify({
      action: request.action,
      session_id: request.session_id,
      payload: request.payload,
      result
    });
  }
}
