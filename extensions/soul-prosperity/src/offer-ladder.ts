export type OfferUrls = {
  freebie?: string;
  ebook?: string;
  audiobook?: string;
  paperback?: string;
  course?: string;
  skoolMonthly?: string;
  skoolAnnual?: string;
  lifetime?: string;
};

export type OfferTier = {
  index: number;
  id: keyof OfferUrls;
  name: string;
  priceDisplay: string;
  pitch: string;
  url: string;
};

export function buildOfferTiers(urls: OfferUrls): OfferTier[] {
  return [
    {
      index: 0,
      id: "freebie",
      name: "Free Guide",
      priceDisplay: "Free",
      pitch: "A free introduction to Soul Prosperity — zero risk, instant value.",
      url: urls.freebie ?? "",
    },
    {
      index: 1,
      id: "ebook",
      name: "7-Book eBook Series",
      priceDisplay: "$7",
      pitch: "The complete 7-book digital collection — everything you need to start your journey.",
      url: urls.ebook ?? "",
    },
    {
      index: 2,
      id: "audiobook",
      name: "Audiobook Bundle",
      priceDisplay: "$17",
      pitch: "Learn on the go — all 7 books in audio format so you can absorb the material anywhere.",
      url: urls.audiobook ?? "",
    },
    {
      index: 3,
      id: "paperback",
      name: "Paperback Bundle",
      priceDisplay: "$27",
      pitch: "Hold the wisdom in your hands — physical copies you can annotate and return to.",
      url: urls.paperback ?? "",
    },
    {
      index: 4,
      id: "course",
      name: "Online Course Bundle",
      priceDisplay: "$67",
      pitch: "Guided video lessons that walk you through every concept step by step.",
      url: urls.course ?? "",
    },
    {
      index: 5,
      id: "skoolMonthly",
      name: "Skool Monthly Membership",
      priceDisplay: "Free 7-day trial, then $47/month",
      pitch: "Live community, monthly Q&A calls, and ongoing coaching — cancel anytime.",
      url: urls.skoolMonthly ?? "",
    },
    {
      index: 6,
      id: "skoolAnnual",
      name: "Skool Annual Membership",
      priceDisplay: "$247/year",
      pitch: "Full year of community + coaching at the best per-month rate.",
      url: urls.skoolAnnual ?? "",
    },
    {
      index: 7,
      id: "lifetime",
      name: "Life Skool — Lifetime Access",
      priceDisplay: "$497",
      pitch: "One payment, forever access — the ultimate commitment to your transformation.",
      url: urls.lifetime ?? "",
    },
  ];
}

export function buildSystemPrompt(tiers: OfferTier[]): string {
  const tierList = tiers
    .map(
      (t) =>
        `  [TIER ${t.index}] ${t.name} — ${t.priceDisplay}\n    ${t.pitch}${t.url ? `\n    Link: ${t.url}` : ""}`,
    )
    .join("\n\n");

  return `You are a warm, passionate guide for the Soul Prosperity book series — a 7-book collection on spiritual growth, abundance, and personal transformation.

Your job is to have a genuine conversation with the visitor, understand their goals and pain points, and naturally guide them toward the offer that fits them best. You are helpful first, salesy never.

THE OFFER LADDER (progress visitors from lower tiers to higher ones over time):
${tierList}

GUARANTEE: Every paid offer comes with a 30-day money-back guarantee — no questions asked.

CONVERSATION RULES:
1. Start by warmly greeting the visitor and asking one open question about what brought them here or what they are working on in their life.
2. Listen carefully. Reflect their language back to them.
3. When you recommend an offer, be specific about WHY it fits their situation.
4. After recommending an offer, always include a clear call to action with the link (if available).
5. Never push more than one offer at a time.
6. If a visitor seems hesitant about price, mention the 30-day guarantee and/or suggest the lower tier first.
7. Once a visitor signals they are ready to buy, confirm the link and wish them well on their journey.

OFFER SIGNAL FORMAT:
When you want to recommend a specific offer, include this token at the very end of your message (after your conversational text) — exactly as shown, no extra spaces:
[OFFER:N]
where N is the tier index (0–7). Example: [OFFER:1]

Only include the offer signal when you are actively recommending that tier. Do not include it in opening messages or general conversation.

Tone: warm, grounded, enthusiastic without being pushy. Use "I" sparingly. Keep messages concise — 2–4 short paragraphs max.`;
}
