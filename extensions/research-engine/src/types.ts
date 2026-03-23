export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  score: number;
}

export interface ScrapedDocument {
  url: string;
  title: string;
  content: string;
  source: string;
}

export interface ContentInsight {
  url: string;
  title: string;
  facts: string[];
  opportunities: string[];
  stats: string[];
}

export interface ResearchRequest {
  topic: string;
  depth?: "quick" | "deep";
  output?: "summary" | "full";
}

export interface ResearchReport {
  topic: string;
  depth: "quick" | "deep";
  output: "summary" | "full";
  executive_summary: string;
  key_findings: string[];
  opportunities: string[];
  competitor_analysis: string[];
  recommendations: string[];
  citations: Array<{ title: string; url: string; source: string }>;
}

export interface SearchProvider {
  search(topic: string, maxResults: number): Promise<SearchResult[]>;
}

export interface Scraper {
  scrape(results: SearchResult[]): Promise<ScrapedDocument[]>;
}

export interface Analyzer {
  analyze(topic: string, docs: ScrapedDocument[]): Promise<ContentInsight[]>;
}
