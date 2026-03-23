import type { Analyzer, ContentInsight, ScrapedDocument } from "./types";

export class ContentAnalyzer implements Analyzer {
  async analyze(topic: string, docs: ScrapedDocument[]): Promise<ContentInsight[]> {
    return docs.map((doc, index) => ({
      url: doc.url,
      title: doc.title,
      facts: [
        `${topic} demand is visible in ${doc.source}`,
        `${doc.title} highlights recurring buyer interest`
      ],
      opportunities: [
        `Offer a premium ${topic} product for niche operators`,
        `Package a done-for-you service around ${topic}`
      ],
      stats: [
        `Source rank ${index + 1}`,
        "Growing automation demand"
      ]
    }));
  }
}
