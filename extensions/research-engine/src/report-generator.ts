import type { ContentInsight, ResearchReport, ResearchRequest, SearchResult } from "./types";

export class ReportGenerator {
  generate(request: ResearchRequest, insights: ContentInsight[], citations: SearchResult[]): ResearchReport {
    const key_findings = insights.flatMap((insight) => insight.facts).slice(0, 5);
    const opportunities = insights.flatMap((insight) => insight.opportunities).slice(0, 5);
    const competitor_analysis = insights.slice(0, 3).map((insight) => `${insight.title} signals active competition in this niche.`);
    const recommendations = [
      `Prioritize a clear offer for ${request.topic}`,
      "Validate pricing with a lightweight launch",
      "Use outbound and content together to test demand"
    ];

    return {
      topic: request.topic,
      depth: request.depth ?? "quick",
      output: request.output ?? "full",
      executive_summary: `${request.topic} shows credible demand across multiple sources with repeatable opportunities for offer creation and positioning.`,
      key_findings,
      opportunities,
      competitor_analysis,
      recommendations,
      citations: citations.slice(0, 5).map((citation) => ({
        title: citation.title,
        url: citation.url,
        source: citation.source
      }))
    };
  }
}
