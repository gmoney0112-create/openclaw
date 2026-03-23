export interface SkillToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface SkillManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  tools: SkillToolDefinition[];
  dependencies: string[];
}

export interface SkillRecord {
  manifest: SkillManifest;
  directory: string;
}

export interface SkillRunRequest {
  skill_name: string;
  tool_name: string;
  params: Record<string, unknown>;
}

export interface SkillRunResponse {
  skill: string;
  tool: string;
  result: Record<string, unknown>;
}

export interface SkillInstallerRequest {
  zip_path: string;
}
