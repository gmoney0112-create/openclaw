import { execa } from 'execa';
import { join } from 'path';
import { mkdirSync } from 'fs';

export interface DownloadOptions {
  url: string;
  outputDir: string;
  audioOnly?: boolean;
  maxDurationSeconds?: number;
}

export interface DownloadResult {
  filePath: string;
  title: string;
  duration: number;
}

export async function download(opts: DownloadOptions): Promise<DownloadResult> {
  mkdirSync(opts.outputDir, { recursive: true });

  const template = join(opts.outputDir, '%(title)s.%(ext)s');
  const args = [opts.url, '-o', template, '--print-json', '--no-playlist', '--quiet'];

  if (opts.audioOnly) {
    args.push('--extract-audio', '--audio-format', 'mp3');
  }
  if (opts.maxDurationSeconds) {
    args.push('--match-filter', `duration <= ${opts.maxDurationSeconds}`);
  }

  const { stdout } = await execa('yt-dlp', args);
  // yt-dlp prints one JSON object per downloaded file; take the last line
  const lastLine = stdout.trim().split('\n').filter(Boolean).pop() ?? '{}';
  const info = JSON.parse(lastLine) as Record<string, unknown>;
  const ext = opts.audioOnly ? 'mp3' : String(info['ext'] ?? 'mp4');
  const title = String(info['title'] ?? 'video');

  return {
    filePath: join(opts.outputDir, `${title}.${ext}`),
    title,
    duration: Number(info['duration'] ?? 0),
  };
}

/** Return YouTube URLs matching a search query. */
export async function search(query: string, limit = 5): Promise<string[]> {
  const { stdout } = await execa('yt-dlp', [
    `ytsearch${limit}:${query}`,
    '--get-url',
    '--no-playlist',
    '--quiet',
  ]);
  return stdout.split('\n').filter(Boolean);
}
