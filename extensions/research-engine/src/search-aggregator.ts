import type { SearchProvider, SearchResult } from "./types";

export class SearchAggregator {
  constructor(private readonly providers: SearchProvider[]) {}

  async search(topic: string, maxResults: number): Promise<SearchResult[]> {
    const results = await Promise.all(this.providers.map((provider) => provider.search(topic, maxResults)));
    const merged = results.flat();
    const deduped = new Map<string, SearchResult>();

    for (const result of merged) {
      const existing = deduped.get(result.url);
      if (!existing || existing.score < result.score) {
        deduped.set(result.url, result);
      }
    }

    return [...deduped.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }
}

export class MockSearchProvider implements SearchProvider {
  constructor(private readonly source: string) {}

  async search(topic: string, maxResults: number): Promise<SearchResult[]> {
    return Array.from({ length: maxResults }, (_, index) => ({
      title: `${topic} result ${index + 1}`,
      url: `https://${this.source}.example.com/${encodeURIComponent(topic)}/${index + 1}`,
      snippet: `${topic} market trend ${index + 1}`,
      source: this.source,
      score: maxResults - index
    }));
  }
}
