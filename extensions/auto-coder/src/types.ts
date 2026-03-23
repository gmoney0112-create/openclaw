export interface AnalyzeRequest {
  log: string;
}

export interface AnalyzeResult {
  file: string;
  line: number;
  error: string;
}

export interface PatchRequest {
  file: string;
  error: string;
  line?: number;
}

export interface PatchResult {
  file: string;
  patch: string;
  applied: boolean;
}

export interface DeployRequest {
  description: string;
  approved: boolean;
}

export interface AutoCoderHistoryEntry {
  id: string;
  action: "analyze" | "patch" | "test" | "deploy";
  status: "success" | "error" | "blocked";
  message: string;
  createdAt: string;
}
