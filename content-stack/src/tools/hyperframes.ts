/**
 * Hyperframes: HTML → MP4 converter.
 * Renders an HTML animation frame-by-frame via a headless browser,
 * then encodes the frames into a video with ffmpeg.
 */
import { execa } from 'execa';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

export interface HtmlToVideoOptions {
  /** HTML string (full document or body content) to animate. */
  html: string;
  outputPath: string;
  durationSeconds: number;
  fps?: number;
  width?: number;
  height?: number;
}

/**
 * Convert an HTML animation to MP4.
 * Requires: Chrome/Chromium and ffmpeg on PATH.
 * Uses `puppeteer` if installed, otherwise falls back to `chromium-browser --headless`.
 */
export async function htmlToVideo(opts: HtmlToVideoOptions): Promise<string> {
  const fps = opts.fps ?? 30;
  const width = opts.width ?? 1080;
  const height = opts.height ?? 1920;
  const totalFrames = Math.round(opts.durationSeconds * fps);
  const workDir = join(tmpdir(), `hyperframes-${randomBytes(6).toString('hex')}`);

  mkdirSync(workDir, { recursive: true });

  try {
    const htmlPath = join(workDir, 'frame.html');
    writeFileSync(htmlPath, wrapHtml(opts.html, width, height));

    // Try puppeteer first, fall back to headless chrome CLI
    let screenshotFn: (frameIndex: number, outputPath: string) => Promise<void>;
    try {
      screenshotFn = await makePuppeteerScreenshotter(htmlPath, fps, width, height);
    } catch {
      screenshotFn = makeChromeScreenshotter(htmlPath, fps, width, height);
    }

    for (let i = 0; i < totalFrames; i++) {
      const framePath = join(workDir, `frame-${String(i).padStart(6, '0')}.png`);
      await screenshotFn(i, framePath);
    }

    // Encode frames to video
    await execa('ffmpeg', [
      '-y',
      '-framerate', String(fps),
      '-i', join(workDir, 'frame-%06d.png'),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-crf', '18',
      opts.outputPath,
    ]);

    return opts.outputPath;
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

async function makePuppeteerScreenshotter(
  htmlPath: string,
  fps: number,
  width: number,
  height: number,
): Promise<(frame: number, out: string) => Promise<void>> {
  // Dynamic import so the tool works without puppeteer installed
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(`file://${htmlPath}`);

  return async (frameIndex: number, outputPath: string) => {
    const timeMs = (frameIndex / fps) * 1000;
    await page.evaluate((t: number) => {
      // Advance any CSS animations/Web Animations API to the given time
      document.getAnimations().forEach((a) => { a.currentTime = t; });
    }, timeMs);
    await page.screenshot({ path: outputPath as `${string}.png`, type: 'png' });
  };
}

function makeChromeScreenshotter(
  htmlPath: string,
  fps: number,
  width: number,
  height: number,
): (frame: number, out: string) => Promise<void> {
  // Headless Chrome screenshot via CLI — only captures frame 0 accurately;
  // for animations this is a best-effort fallback.
  return async (_frameIndex: number, outputPath: string) => {
    await execa('chromium-browser', [
      '--headless',
      '--disable-gpu',
      `--window-size=${width},${height}`,
      `--screenshot=${outputPath}`,
      `file://${htmlPath}`,
    ]);
  };
}

function wrapHtml(html: string, width: number, height: number): string {
  if (html.includes('<html')) return html;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${width}px; height: ${height}px; overflow: hidden; }
</style>
</head>
<body>${html}</body>
</html>`;
}
