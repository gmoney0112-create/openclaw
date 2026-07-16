// Compat surface: openclaw/plugin-sdk/growth-hacking
// Provides stable types and registry for autonomous growth hacking.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Growth channels for audience expansion. */
export type GrowthChannel =
  | "twitter"
  | "linkedin"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "blog"
  | "email"
  | "custom";

/** Growth hacking strategies. */
export type GrowthStrategy =
  | "viral-content"
  | "engagement"
  | "follower-growth"
  | "traffic-drive"
  | "conversion"
  | "retention"
  | "custom";

/** Growth hacking configuration. */
export type GrowthConfig = {
  channels: GrowthChannel[];
  strategies: GrowthStrategy[];
  targetAudience?: string;
  dailyPostsPerChannel?: number;
  contentCategories?: string[];
  hashtagStrategy?: "trending" | "niche" | "mixed";
  engagementHours?: number[]; // hours to post
  metadata?: Record<string, unknown>;
};

/** Generated growth content. */
export type GrowthContent = {
  id: string;
  channel: GrowthChannel;
  strategy: GrowthStrategy;
  content: string;
  media?: Buffer;
  hashtags: string[];
  scheduledAt?: number;
  status: "draft" | "scheduled" | "published";
  metrics?: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
  };
};

/** Growth metrics and analytics. */
export type GrowthMetrics = {
  channel: GrowthChannel;
  followers?: number;
  followerGrowth?: number;
  engagement?: number; // percentage
  reach?: number;
  traffic?: number;
  conversions?: number;
  period: { start: number; end: number };
};

/** Growth campaign results. */
export type GrowthCampaignResult = {
  campaignId: string;
  config: GrowthConfig;
  contentGenerated: number;
  contentPublished: number;
  metrics: GrowthMetrics[];
  topPerformingContent: GrowthContent[];
  recommendations: string[];
  timestamp: number;
};

/** A provider that automates audience growth. */
export type GrowthHackingProvider = {
  id: string;
  label: string;
  capabilities: string[]; // e.g., ['viral-posting', 'engagement-automation', 'trend-monitoring']
  generateContent: (config: GrowthConfig) => Promise<GrowthContent[]>;
  publishContent: (content: GrowthContent) => Promise<{ published: boolean; url?: string }>;
  monitorMetrics: (channels: GrowthChannel[]) => Promise<GrowthMetrics[]>;
  analyzeCompetitors: (
    competitors: string[],
  ) => Promise<{ content: GrowthContent[]; opportunities: string[] }>;
  identifyTrends: () => Promise<{ trends: string[]; opportunities: GrowthContent[] }>;
  runCampaign: (config: GrowthConfig) => Promise<GrowthCampaignResult>;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, GrowthHackingProvider>();

/** Register a growth-hacking provider. */
export function registerGrowthHackingProvider(provider: GrowthHackingProvider): void {
  _registry.set(provider.id, provider);
}

/** Retrieve a registered growth-hacking provider by ID. */
export function getGrowthHackingProvider(id: string): GrowthHackingProvider | null {
  return _registry.get(id) ?? null;
}

/** List all registered growth-hacking providers. */
export function listGrowthHackingProviders(): GrowthHackingProvider[] {
  return [..._registry.values()];
}
