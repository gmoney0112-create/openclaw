import { join } from 'path';
import { mkdirSync } from 'fs';
import * as yt from '../tools/ytdlp.js';
import * as whisper from '../tools/whisper.js';
import * as apify from '../tools/apify.js';
import * as claude from '../tools/claude.js';
import type { PipelineState, ResearchResult, TranscribedContent } from '../types.js';
import { config } from '../config.js';

const SYSTEM = `You are a content research analyst. Extract key insights, trends, and content angles from the provided transcripts and trend data. Return structured JSON.`;

/**
 * Phase 1: Research
 * - Fetch Google Trends via Apify
 * - Find top YouTube videos on the topic
 * - Download audio and transcribe with Whisper
 * - Synthesize findings with Claude
 */
export async function runResearch(state: PipelineState): Promise<ResearchResult> {
  const rawDir = join(state.outputDir, 'research');
  mkdirSync(rawDir, { recursive: true });

  // 1. Trend data
  let trendData: apify.TrendResult[] = [];
  if (config.apify.apiKey) {
    trendData = await apify.trends(state.topic).catch(() => []);
  }

  // 2. Find relevant YouTube videos (top 3)
  const videoUrls = await yt.search(`${state.topic} explained`, 3).catch(() => [] as string[]);

  // 3. Download audio + transcribe
  const transcripts: TranscribedContent[] = [];
  for (const url of videoUrls.slice(0, 3)) {
    try {
      const dl = await yt.download({ url, outputDir: rawDir, audioOnly: true, maxDurationSeconds: 1800 });
      if (config.openai.apiKey) {
        const tx = await whisper.transcribe(dl.filePath);
        transcripts.push({ source: url, transcript: tx.text, duration: dl.duration });
      } else {
        // Fallback: try Apify YouTube scraper for transcripts
        const tx = await apify.youtubeTranscript(url).catch(() => '');
        transcripts.push({ source: url, transcript: tx, duration: dl.duration });
      }
    } catch {
      // Non-fatal — continue with remaining videos
    }
  }

  // 4. Claude synthesizes everything
  const combinedText = [
    `Topic: ${state.topic}`,
    `Trend data: ${JSON.stringify(trendData.slice(0, 10))}`,
    `Transcripts:\n${transcripts.map((t) => `Source: ${t.source}\n${t.transcript.slice(0, 3000)}`).join('\n\n---\n\n')}`,
  ].join('\n\n');

  const result = await claude.askJson<Omit<ResearchResult, 'transcripts'>>(
    SYSTEM,
    `Based on the following research data, extract:
- trends: array of trending angles/questions about this topic (8–12 items)
- references: array of the source URLs used
- keywords: array of SEO keywords (10–15 items)
- targetAudience: one sentence describing who this content is for

Research data:
${combinedText}`,
  );

  return { ...result, topic: state.topic, transcripts };
}
