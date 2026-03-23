import { ContentAnalyzer } from "./content-analyzer";
import { ReportGenerator } from "./report-generator";
import { MockSearchProvider, SearchAggregator } from "./search-aggregator";
import type { Analyzer, ResearchReport, ResearchRequest, Scraper } from "./types";
import { WebScraper } from "./web-scraper";

export class ResearchOrchestrator {
  constructor(
    private readonly aggregator = new SearchAggregator([
      new MockSearchProvider("tavily"),
      new MockSearchProvider("searxng")
    ]),
    private readonly scraper: Scraper = new WebScraper(),
    private readonly analyzer: Analyzer = new ContentAnalyzer(),
    private readonly reportGenerator = new ReportGenerator()
  ) {}

  async run(request: ResearchRequest): Promise<ResearchReport> {
    const maxResults = request.depth === "deep" ? 8 : 5;
    const searchResults = await this.aggregator.search(request.topic, maxResults);
    const docs = await this.scraper.scrape(searchResults);
    const insights = await this.analyzer.analyze(request.topic, docs);
    return this.reportGenerator.generate(request, insights, searchResults);
  }
}
