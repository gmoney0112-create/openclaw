import { execa } from 'execa';
import { join, basename, extname } from 'path';
import { mkdirSync } from 'fs';
import type { CaptionSegment } from '../types.js';

export interface ConcatOptions {
  clips: string[];        // ordered list of video file paths
  outputPath: string;
  audioPath?: string;     // background music/voiceover to mix in
  audioVolume?: number;   // 0–1, default 0.3 for background music
}

export interface CaptionOptions {
  videoPath: string;
  segments: CaptionSegment[];
  outputPath: string;
  fontName?: string;
  fontSize?: number;
}

export interface ThumbnailOptions {
  videoPath: string;
  outputPath: string;
  timestampSeconds?: number;
}

/** Concatenate multiple clips into one video. */
export async function concat(opts: ConcatOptions): Promise<string> {
  mkdirSync(join(opts.outputPath, '..'), { recursive: true });

  // Write concat list file
  const listPath = opts.outputPath.replace(extname(opts.outputPath), '.txt');
  const listContent = opts.clips.map((c) => `file '${c}'`).join('\n');
  const { writeFileSync } = await import('fs');
  writeFileSync(listPath, listContent, 'utf8');

  if (opts.audioPath) {
    await execa('ffmpeg', [
      '-y',
      '-f', 'concat', '-safe', '0', '-i', listPath,
      '-i', opts.audioPath,
      '-filter_complex', `[1:a]volume=${opts.audioVolume ?? 0.3}[bg];[0:a][bg]amix=inputs=2:duration=first[aout]`,
      '-map', '0:v', '-map', '[aout]',
      '-c:v', 'copy', '-c:a', 'aac',
      opts.outputPath,
    ]);
  } else {
    await execa('ffmpeg', [
      '-y',
      '-f', 'concat', '-safe', '0', '-i', listPath,
      '-c', 'copy',
      opts.outputPath,
    ]);
  }

  return opts.outputPath;
}

/** Burn subtitles into video using an SRT file. */
export async function burnCaptions(opts: CaptionOptions): Promise<string> {
  // Write SRT file
  const srtPath = opts.outputPath.replace(extname(opts.outputPath), '.srt');
  writeSrt(srtPath, opts.segments);

  const font = opts.fontName ?? 'Arial';
  const size = opts.fontSize ?? 24;

  await execa('ffmpeg', [
    '-y',
    '-i', opts.videoPath,
    '-vf', `subtitles=${srtPath}:force_style='FontName=${font},FontSize=${size},Alignment=2,PrimaryColour=&Hffffff&,OutlineColour=&H000000&,Outline=2'`,
    '-c:a', 'copy',
    opts.outputPath,
  ]);

  return opts.outputPath;
}

/** Extract a thumbnail frame from a video. */
export async function thumbnail(opts: ThumbnailOptions): Promise<string> {
  const ts = opts.timestampSeconds ?? 3;
  await execa('ffmpeg', [
    '-y',
    '-ss', String(ts),
    '-i', opts.videoPath,
    '-frames:v', '1',
    '-q:v', '2',
    opts.outputPath,
  ]);
  return opts.outputPath;
}

/** Convert audio to specified format. */
export async function convertAudio(inputPath: string, outputPath: string): Promise<string> {
  await execa('ffmpeg', ['-y', '-i', inputPath, outputPath]);
  return outputPath;
}

function writeSrt(path: string, segments: CaptionSegment[]): void {
  const { writeFileSync } = require('fs');
  const content = segments
    .map((seg, i) => `${i + 1}\n${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}\n${seg.text}\n`)
    .join('\n');
  writeFileSync(path, content, 'utf8');
}

function toSrtTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.round((secs % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}
