import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { config } from '../config.js';
import type { HiggsFieldGenerationResult } from '../types.js';

const BASE_URL = config.higgsfield.baseUrl;

function headers(): Record<string, string> {
  if (!config.higgsfield.apiKey) {
    throw new Error('HIGGSFIELD_API_KEY is required. Sign up at higgsfield.ai ($15/mo).');
  }
  return {
    Authorization: `Bearer ${config.higgsfield.apiKey}`,
    'Content-Type': 'application/json',
  };
}

export interface GenerateOptions {
  prompt: string;
  style?: 'cinematic' | 'realistic' | 'animated';
  durationSeconds?: number;
  aspectRatio?: '9:16' | '16:9' | '1:1';
}

/** Submit a video generation job and poll until complete. */
export async function generate(opts: GenerateOptions): Promise<HiggsFieldGenerationResult> {
  // Start generation
  const startResp = await fetch(`${BASE_URL}/video/generate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      prompt: opts.prompt,
      style: opts.style ?? 'cinematic',
      duration: opts.durationSeconds ?? 5,
      aspect_ratio: opts.aspectRatio ?? '9:16',
    }),
  });

  if (!startResp.ok) {
    const err = await startResp.text();
    throw new Error(`Higgsfield generate failed: ${startResp.status} ${err}`);
  }

  const { id } = (await startResp.json()) as { id: string };

  // Poll for completion (up to 5 min)
  const deadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < deadline) {
    await sleep(5000);
    const pollResp = await fetch(`${BASE_URL}/video/${id}`, { headers: headers() });
    if (!pollResp.ok) continue;

    const job = (await pollResp.json()) as {
      status: string;
      video_url?: string;
      thumbnail_url?: string;
      duration?: number;
    };

    if (job.status === 'completed' && job.video_url) {
      return {
        id,
        videoUrl: job.video_url,
        thumbnailUrl: job.thumbnail_url ?? '',
        duration: job.duration ?? (opts.durationSeconds ?? 5),
      };
    }
    if (job.status === 'failed') throw new Error(`Higgsfield job ${id} failed`);
  }

  throw new Error(`Higgsfield job ${id} timed out after 5 minutes`);
}

/** Download a Higgsfield video URL to a local file. */
export async function downloadVideo(url: string, outputDir: string, name: string): Promise<string> {
  mkdirSync(outputDir, { recursive: true });
  const dest = join(outputDir, `${name}.mp4`);
  const resp = await fetch(url);
  if (!resp.ok || !resp.body) throw new Error(`Failed to download Higgsfield video: ${resp.status}`);
  await pipeline(resp.body as unknown as NodeJS.ReadableStream, createWriteStream(dest));
  return dest;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
