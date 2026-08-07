export type ContentFormat = 'short' | 'long' | 'both';

export interface ResearchResult {
  topic: string;
  trends: string[];
  transcripts: TranscribedContent[];
  references: string[];
  keywords: string[];
  targetAudience: string;
}

export interface TranscribedContent {
  source: string;
  transcript: string;
  duration: number;
}

export interface Script {
  title: string;
  hook: string;
  body: string[];
  cta: string;
  format: ContentFormat;
  keywords: string[];
  estimatedDuration: number; // seconds
  hashtags: string[];
}

export interface VideoAsset {
  path: string;
  type: 'broll' | 'graphic' | 'animation' | 'footage' | 'title-card';
  duration: number;
  tags: string[];
}

export interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface FinalVideo {
  path: string;
  format: ContentFormat;
  duration: number;
  captionsPath: string;
  thumbnailPath: string;
}

export interface DistributionResult {
  landingPageUrl?: string;
  emailsSent?: number;
  notionEntryId?: string;
  notionEntryUrl?: string;
}

export interface PipelineState {
  topic: string;
  format: ContentFormat;
  outputDir: string;
  research?: ResearchResult;
  script?: Script;
  assets?: VideoAsset[];
  finalVideo?: FinalVideo;
  distribution?: DistributionResult;
}

export interface ApifyRunResult {
  id: string;
  status: string;
  output: unknown;
}

export interface HiggsFieldGenerationResult {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
}
