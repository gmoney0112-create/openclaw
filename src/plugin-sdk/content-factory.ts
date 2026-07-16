// Compat surface: openclaw/plugin-sdk/content-factory
// Provides stable types and registry for autonomous marketing content generation.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Content types the factory can generate. */
export type ContentType =
  | "blog"
  | "video"
  | "podcast"
  | "social"
  | "email"
  | "whitepaper"
  | "case-study"
  | "custom";

/** Content generation request. */
export type ContentBrief = {
  topic: string;
  audience?: string;
  tone?: string;
  format?: string;
  keywords?: string[];
  length?: number;
  style?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

/** Generated content asset. */
export type GeneratedContent = {
  id: string;
  type: ContentType;
  title: string;
  body: string;
  media?: {
    type: "image" | "video" | "audio";
    url: string;
    duration?: number;
  }[];
  hashtags?: string[];
  seoScore?: number;
  metadata?: Record<string, unknown>;
  generatedAt: number;
  publishDate?: number;
};

/** Content performance metrics. */
export type ContentMetrics = {
  views?: number;
  clicks?: number;
  engagement?: number; // 0-1
  shareCount?: number;
  sentiment?: "positive" | "neutral" | "negative";
  conversionRate?: number;
  timestamp: number;
};

/** Content variation for testing. */
export type ContentVariation = {
  id: string;
  parentId: string;
  type: ContentType;
  title: string;
  body: string;
  differencesSummary: string;
};

/** SEO optimization result. */
export type SEOOptimization = {
  keywords: Array<{ keyword: string; density: number }>;
  readability: number; // 0-100
  suggestions: string[];
  score: number; // 0-100
};

/** A provider that generates marketing content. */
export type ContentFactoryProvider = {
  id: string;
  label: string;
  capabilities: string[]; // e.g., ['blog-generation', 'social-content', 'video-scripting']
  generateContent: (brief: ContentBrief) => Promise<GeneratedContent>;
  optimizeForSEO: (content: GeneratedContent) => Promise<SEOOptimization>;
  generateVariations?: (content: GeneratedContent, count: number) => Promise<ContentVariation[]>;
  schedulePosts?: (
    content: GeneratedContent[],
    schedule: Record<string, unknown>,
  ) => Promise<{ scheduled: number; errors: string[] }>;
  analyzePerformance?: (contentId: string) => Promise<ContentMetrics>;
  batchGenerate?: (briefs: ContentBrief[]) => Promise<GeneratedContent[]>;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, ContentFactoryProvider>();

/** Register a content-factory provider. */
export function registerContentFactoryProvider(provider: ContentFactoryProvider): void {
  _registry.set(provider.id, provider);
}

/** Retrieve a registered content-factory provider by ID. */
export function getContentFactoryProvider(id: string): ContentFactoryProvider | null {
  return _registry.get(id) ?? null;
}

/** List all registered content-factory providers. */
export function listContentFactoryProviders(): ContentFactoryProvider[] {
  return [..._registry.values()];
}
