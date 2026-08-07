import { join } from 'path';
import { mkdirSync } from 'fs';
import * as ffmpegTool from '../tools/ffmpeg.js';
import * as whisper from '../tools/whisper.js';
import { config } from '../config.js';
import type { PipelineState, Script, VideoAsset, FinalVideo, CaptionSegment } from '../types.js';

/**
 * Phase 4: Edit — assemble clips, burn captions, generate thumbnail.
 */
export async function runEdit(state: PipelineState, script: Script, assets: VideoAsset[]): Promise<FinalVideo> {
  const editDir = join(state.outputDir, 'edit', script.format);
  mkdirSync(editDir, { recursive: true });

  const rawOutputPath = join(editDir, 'raw.mp4');
  const captionedPath = join(editDir, 'captioned.mp4');
  const thumbnailPath = join(editDir, 'thumbnail.jpg');

  // 1. Concatenate available clips (title card first, then b-roll)
  const titleCards = assets.filter((a) => a.type === 'title-card');
  const broll = assets.filter((a) => a.type === 'broll' || a.type === 'footage');
  const ordered = [...titleCards, ...broll];

  if (ordered.length === 0) {
    throw new Error('No video assets available to edit. Ensure Remotion or Higgsfield produced clips.');
  }

  await ffmpegTool.concat({
    clips: ordered.map((a) => a.path),
    outputPath: rawOutputPath,
  });

  // 2. Generate captions
  let captions: CaptionSegment[] = [];
  if (config.openai.apiKey) {
    try {
      const tx = await whisper.transcribe(rawOutputPath);
      captions = tx.segments;
    } catch {
      // Non-fatal; captions optional
    }
  } else {
    // Synthesize basic captions from script body
    captions = scriptToSegments(script);
  }

  // 3. Burn captions
  if (captions.length > 0) {
    const srtPath = join(editDir, 'captions.srt');
    await ffmpegTool.burnCaptions({
      videoPath: rawOutputPath,
      segments: captions,
      outputPath: captionedPath,
      fontName: 'Arial',
      fontSize: script.format === 'short' ? 32 : 24,
    });
  }

  // 4. Thumbnail
  await ffmpegTool.thumbnail({ videoPath: rawOutputPath, outputPath: thumbnailPath });

  const finalPath = captions.length > 0 ? captionedPath : rawOutputPath;

  return {
    path: finalPath,
    format: script.format,
    duration: ordered.reduce((sum, a) => sum + a.duration, 0),
    captionsPath: captions.length > 0 ? join(editDir, 'captions.srt') : '',
    thumbnailPath,
  };
}

/** Rough synthetic captions derived from the script body when Whisper is unavailable. */
function scriptToSegments(script: Script): CaptionSegment[] {
  const segments: CaptionSegment[] = [];
  const wordsPerSecond = 2.5;
  let t = 0;

  const allText = [script.hook, ...script.body, script.cta];
  for (const paragraph of allText) {
    const words = paragraph.split(/\s+/);
    // Split into ~10-word caption chunks
    for (let i = 0; i < words.length; i += 10) {
      const chunk = words.slice(i, i + 10).join(' ');
      const duration = chunk.split(/\s+/).length / wordsPerSecond;
      segments.push({ start: t, end: t + duration, text: chunk });
      t += duration;
    }
  }

  return segments;
}
