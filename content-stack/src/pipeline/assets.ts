import { join } from 'path';
import { mkdirSync } from 'fs';
import * as higgsfield from '../tools/higgsfield.js';
import * as remotion from '../tools/remotion.js';
import * as claude from '../tools/claude.js';
import { config } from '../config.js';
import type { PipelineState, Script, VideoAsset } from '../types.js';

/**
 * Phase 3: Generate visual assets.
 * - Higgsfield: AI b-roll clips
 * - Remotion: animated title cards & lower-thirds
 */
export async function runAssets(state: PipelineState, script: Script): Promise<VideoAsset[]> {
  const assetsDir = join(state.outputDir, 'assets', script.format);
  mkdirSync(assetsDir, { recursive: true });

  const assets: VideoAsset[] = [];

  // Generate b-roll prompts from script body
  const brollPrompts = await generateBrollPrompts(script);

  // 1. Higgsfield b-roll clips (up to 3 per video)
  if (config.higgsfield.apiKey) {
    for (const [i, prompt] of brollPrompts.slice(0, 3).entries()) {
      try {
        const result = await higgsfield.generate({
          prompt,
          style: 'cinematic',
          durationSeconds: 5,
          aspectRatio: script.format === 'short' ? '9:16' : '16:9',
        });
        const filePath = await higgsfield.downloadVideo(
          result.videoUrl,
          assetsDir,
          `broll-${i}`,
        );
        assets.push({ path: filePath, type: 'broll', duration: result.duration, tags: [prompt.slice(0, 30)] });
      } catch {
        // Non-fatal; Higgsfield may be unavailable
      }
    }
  }

  // 2. Remotion title card
  try {
    const titlePath = join(assetsDir, 'title-card.mp4');
    await remotion.titleCard(script.title, titlePath, {
      subtitle: script.hook,
      durationSeconds: 3,
    });
    assets.push({ path: titlePath, type: 'title-card', duration: 3, tags: ['intro'] });
  } catch {
    // Remotion not set up yet — skip
  }

  return assets;
}

async function generateBrollPrompts(script: Script): Promise<string[]> {
  const prompts = await claude.askJson<string[]>(
    'You are a video director. Generate cinematic b-roll shot descriptions.',
    `Given this script body, generate 3–5 short, vivid b-roll prompts (one sentence each, cinematic style) that visually support the content.
Script body: ${script.body.join(' ').slice(0, 2000)}
Return a JSON array of strings.`,
  );
  return prompts;
}
