import { config } from '../config.js';

const BASE_URL = config.apify.baseUrl;

function apiKey(): string {
  if (!config.apify.apiKey) {
    throw new Error('APIFY_API_KEY is required for research. Sign up at console.apify.com.');
  }
  return config.apify.apiKey;
}

export interface ScrapeResult {
  url: string;
  title: string;
  text: string;
}

export interface TrendResult {
  keyword: string;
  interest: number; // 0–100
  relatedQueries: string[];
}

/**
 * Run an Apify actor and return its dataset output.
 * @param actorId  e.g. "apify/google-trends-scraper"
 * @param input    actor-specific input object
 */
async function runActor<T>(actorId: string, input: Record<string, unknown>): Promise<T[]> {
  // Start the run
  const startResp = await fetch(
    `${BASE_URL}/acts/${encodeURIComponent(actorId)}/runs?token=${apiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  );

  if (!startResp.ok) {
    const err = await startResp.text();
    throw new Error(`Apify run failed: ${startResp.status} ${err}`);
  }

  const { data: run } = (await startResp.json()) as { data: { id: string; defaultDatasetId: string } };

  // Poll until finished
  const deadline = Date.now() + 3 * 60 * 1000;
  while (Date.now() < deadline) {
    await sleep(4000);
    const statusResp = await fetch(`${BASE_URL}/actor-runs/${run.id}?token=${apiKey()}`);
    const { data: status } = (await statusResp.json()) as { data: { status: string } };
    if (status.status === 'SUCCEEDED') break;
    if (status.status === 'FAILED' || status.status === 'ABORTED') {
      throw new Error(`Apify run ${run.id} ended with status: ${status.status}`);
    }
  }

  // Fetch dataset items
  const dataResp = await fetch(
    `${BASE_URL}/datasets/${run.defaultDatasetId}/items?token=${apiKey()}&format=json`,
  );
  const items = (await dataResp.json()) as T[];
  return items;
}

/** Scrape Google Trends for a keyword. */
export async function trends(keyword: string): Promise<TrendResult[]> {
  const items = await runActor<Record<string, unknown>>('apify/google-trends-scraper', {
    searchTerms: [keyword],
    geo: 'US',
    timeRange: 'now 7-d',
  });

  return items.map((item) => ({
    keyword: String(item['keyword'] ?? keyword),
    interest: Number(item['value'] ?? 0),
    relatedQueries: Array.isArray(item['relatedQueries'])
      ? (item['relatedQueries'] as string[])
      : [],
  }));
}

/** Scrape YouTube transcript + metadata for a given video URL. */
export async function youtubeTranscript(videoUrl: string): Promise<string> {
  const items = await runActor<Record<string, unknown>>('bernardo/youtube-scraper', {
    startUrls: [{ url: videoUrl }],
    maxResults: 1,
    downloadSubtitles: true,
  });

  const first = items[0];
  if (!first) return '';
  return String(first['subtitles'] ?? first['description'] ?? '');
}

/** Web scrape a list of URLs and return cleaned text. */
export async function scrapePages(urls: string[]): Promise<ScrapeResult[]> {
  const items = await runActor<Record<string, unknown>>('apify/cheerio-scraper', {
    startUrls: urls.map((url) => ({ url })),
    pageFunction: `async function pageFunction({ $, request }) {
      return { url: request.url, title: $('title').text(), text: $('body').text().slice(0, 5000) };
    }`,
  });

  return items.map((item) => ({
    url: String(item['url'] ?? ''),
    title: String(item['title'] ?? ''),
    text: String(item['text'] ?? ''),
  }));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
