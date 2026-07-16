export type GeneratedMusicAsset = {
  buffer: Buffer;
  mimeType: string;
  fileName?: string;
};

export type MusicGenerationRequestAsset = {
  buffer?: Buffer;
  mimeType?: string;
  url?: string;
};

export type MusicGenerationRequest = {
  cfg?: unknown;
  agentDir?: string;
  authStore?: unknown;
  model?: string;
  prompt?: string;
  inputAudio?: MusicGenerationRequestAsset[];
  durationSeconds?: number;
  genreStyle?: string;
  request?: unknown;
  [key: string]: unknown;
};

export type MusicGenerationProvider = {
  id: string;
  label: string;
  defaultModel?: string;
  models?: string[];
  isConfigured?: (params: { agentDir?: string }) => boolean;
  capabilities?: Record<string, unknown>;
  generateMusic: (req: MusicGenerationRequest) => Promise<unknown>;
};
