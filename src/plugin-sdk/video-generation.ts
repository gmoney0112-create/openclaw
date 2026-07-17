export type GeneratedVideoAsset = {
  buffer: Buffer;
  mimeType: string;
  fileName?: string;
};

export type VideoGenerationRequestAsset = {
  buffer?: Buffer;
  mimeType?: string;
  url?: string;
};

export type VideoGenerationRequest = {
  cfg?: unknown;
  agentDir?: string;
  authStore?: unknown;
  model?: string;
  prompt?: string;
  inputImages?: VideoGenerationRequestAsset[];
  inputVideos?: VideoGenerationRequestAsset[];
  size?: string;
  durationSeconds?: number;
  request?: unknown;
  [key: string]: unknown;
};

export type VideoGenerationProvider = {
  id: string;
  label: string;
  defaultModel?: string;
  models?: string[];
  isConfigured?: (params: { agentDir?: string }) => boolean;
  capabilities?: Record<string, unknown>;
  generateVideo: (
    req: VideoGenerationRequest,
  ) => Promise<GeneratedVideoAsset | { assets?: GeneratedVideoAsset[] }>;
};

// Dashscope Wan video generation constants
export const DEFAULT_DASHSCOPE_WAN_VIDEO_MODEL = "wan2.6-t2v";

export const DASHSCOPE_WAN_VIDEO_MODELS = [
  { id: "wan2.6-t2v", label: "Wan 2.6 (Text-to-Video)" },
  { id: "wan2.6-i2v", label: "Wan 2.6 (Image-to-Video)" },
  { id: "wan2.6-r2v-flash", label: "Wan 2.6 (Reference Video)" },
];

export const DASHSCOPE_WAN_VIDEO_CAPABILITIES = {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportedDurationSeconds: [6, 8, 10],
    aspectRatios: ["16:9", "9:16"],
    supportsAspectRatio: false,
    supportsAudio: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 10,
    supportedDurationSeconds: [6, 8, 10],
    supportsAudio: true,
  },
};

export const DEFAULT_VIDEO_GENERATION_TIMEOUT_MS = 300000;
