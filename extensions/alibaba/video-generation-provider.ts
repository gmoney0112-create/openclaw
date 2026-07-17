import { isProviderApiKeyConfigured } from "openclaw/plugin-sdk/provider-auth";
import { resolveApiKeyForProvider } from "openclaw/plugin-sdk/provider-auth-runtime";
import { resolveProviderHttpRequestConfig } from "openclaw/plugin-sdk/provider-http";
import type {
  VideoGenerationProvider,
  VideoGenerationRequest,
  VideoGenerationResult,
} from "openclaw/plugin-sdk/video-generation";

const DEFAULT_ALIBABA_VIDEO_BASE_URL = "https://dashscope-intl.aliyuncs.com";
const DEFAULT_ALIBABA_VIDEO_MODEL = "wan2.6-t2v";

const DASHSCOPE_WAN_VIDEO_MODELS = ["wan2.6-t2v", "wan2.6-i2v", "wan2.6-r2v-flash"];

const DASHSCOPE_WAN_VIDEO_CAPABILITIES = {
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

const DEFAULT_VIDEO_GENERATION_TIMEOUT_MS = 300000;

function resolveAlibabaVideoBaseUrl(req: VideoGenerationRequest): string {
  return req.cfg?.models?.providers?.alibaba?.baseUrl?.trim() || DEFAULT_ALIBABA_VIDEO_BASE_URL;
}

function resolveDashscopeAigcApiBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/u, "");
}

export function buildAlibabaVideoGenerationProvider(): VideoGenerationProvider {
  return {
    id: "alibaba",
    label: "Alibaba Model Studio",
    defaultModel: DEFAULT_ALIBABA_VIDEO_MODEL,
    models: [...DASHSCOPE_WAN_VIDEO_MODELS],
    isConfigured: ({ agentDir }) =>
      isProviderApiKeyConfigured({
        provider: "alibaba",
        agentDir,
      }),
    capabilities: DASHSCOPE_WAN_VIDEO_CAPABILITIES,
    async generateVideo(req): Promise<VideoGenerationResult> {
      const fetchFn = fetch;
      const auth = await resolveApiKeyForProvider({
        provider: "alibaba",
        cfg: req.cfg,
        agentDir: req.agentDir,
        store: req.authStore,
      });
      if (!auth.apiKey) {
        throw new Error("Alibaba Model Studio API key missing");
      }

      const requestBaseUrl = resolveAlibabaVideoBaseUrl(req);
      const { baseUrl, allowPrivateNetwork, headers, dispatcherPolicy } =
        resolveProviderHttpRequestConfig({
          baseUrl: requestBaseUrl,
          defaultBaseUrl: DEFAULT_ALIBABA_VIDEO_BASE_URL,
          defaultHeaders: {
            Authorization: `Bearer ${auth.apiKey}`,
            "Content-Type": "application/json",
            "X-DashScope-Async": "enable",
          },
          provider: "alibaba",
          capability: "video",
          transport: "http",
        });

      const model = req.model?.trim() || DEFAULT_ALIBABA_VIDEO_MODEL;
      throw new Error(
        "Alibaba video generation not fully implemented: runDashscopeVideoGenerationTask unavailable",
      );
    },
  };
}
