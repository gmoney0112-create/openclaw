import { join } from "node:path";
import type { SkillRegistry } from "./skill-registry";
import type { SkillRunRequest, SkillRunResponse } from "./types";

type SkillModule = {
  run: (toolName: string, params: Record<string, unknown>) => Promise<Record<string, unknown>>;
};

export class SkillRunner {
  constructor(private readonly registry: SkillRegistry) {}

  async run(request: SkillRunRequest): Promise<SkillRunResponse> {
    const record = this.registry.get(request.skill_name);
    const tool = record.manifest.tools.find((candidate) => candidate.name === request.tool_name);
    if (!tool) {
      throw new Error(`Tool not found: ${request.tool_name}`);
    }

    const modulePath = join(record.directory, "run.js");
    const skillModule = (await import(modulePath)) as SkillModule;
    const result = await skillModule.run(request.tool_name, request.params);

    return {
      skill: request.skill_name,
      tool: request.tool_name,
      result
    };
  }
}
