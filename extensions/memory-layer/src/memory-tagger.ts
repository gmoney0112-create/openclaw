const TAG_RULES: Record<string, string[]> = {
  sales: ["sale", "revenue", "pitch", "close", "funnel", "offer", "upsell", "stripe", "payment"],
  marketing: ["campaign", "ad", "email", "social", "content", "brand", "audience", "traffic"],
  crm: ["contact", "lead", "customer", "client", "ghl", "pipeline", "opportunity"],
  strategy: ["strategy", "plan", "goal", "vision", "roadmap", "quarter", "objective"],
  user: ["i am", "my name", "i work", "i need", "my business", "i want"],
  product: ["product", "course", "service", "offer", "price", "feature", "benefit"]
};

export class MemoryTagger {
  tag(content: string): string[] {
    const normalized = content.toLowerCase();
    const tags = Object.entries(TAG_RULES)
      .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))
      .map(([tag]) => tag);

    return tags.length > 0 ? tags : ["general"];
  }
}
