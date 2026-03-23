import type { ScrapedDocument, Scraper, SearchResult } from "./types";

export class WebScraper implements Scraper {
  async scrape(results: SearchResult[]): Promise<ScrapedDocument[]> {
    return results.map((result) => ({
      url: result.url,
      title: result.title,
      source: result.source,
      content: `${result.title} says the market is growing, automation demand is rising, and niche operators are profitable.`
    }));
  }
}
