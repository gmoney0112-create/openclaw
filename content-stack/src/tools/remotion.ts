import { execa } from 'execa';
import { join, resolve } from 'path';
import { mkdirSync } from 'fs';

const REMOTION_DIR = resolve(new URL('../../remotion', import.meta.url).pathname);

export type CompositionId = 'TitleCard' | 'LowerThird' | 'Outro';

export interface RenderOptions {
  compositionId: CompositionId;
  outputPath: string;
  props?: Record<string, unknown>;
  durationInFrames?: number;
  fps?: number;
  width?: number;
  height?: number;
}

/** Render a Remotion composition to an MP4 file. */
export async function render(opts: RenderOptions): Promise<string> {
  mkdirSync(join(opts.outputPath, '..'), { recursive: true });

  const args = [
    'remotion', 'render',
    join(REMOTION_DIR, 'src/index.ts'),
    opts.compositionId,
    opts.outputPath,
  ];

  if (opts.props) {
    args.push('--props', JSON.stringify(opts.props));
  }
  if (opts.durationInFrames) {
    args.push('--frames', `0-${opts.durationInFrames - 1}`);
  }

  await execa('npx', args, { cwd: REMOTION_DIR });
  return opts.outputPath;
}

/** Render a title card (text overlay on color background). */
export async function titleCard(
  text: string,
  outputPath: string,
  opts: { subtitle?: string; durationSeconds?: number; colorHex?: string } = {},
): Promise<string> {
  return render({
    compositionId: 'TitleCard',
    outputPath,
    props: {
      title: text,
      subtitle: opts.subtitle ?? '',
      color: opts.colorHex ?? '#0f172a',
    },
    durationInFrames: Math.round((opts.durationSeconds ?? 3) * 30),
    fps: 30,
    width: 1080,
    height: 1920,
  });
}

/** Render a lower-third name/label strip. */
export async function lowerThird(
  label: string,
  outputPath: string,
  durationSeconds = 4,
): Promise<string> {
  return render({
    compositionId: 'LowerThird',
    outputPath,
    props: { label },
    durationInFrames: Math.round(durationSeconds * 30),
    fps: 30,
    width: 1080,
    height: 1920,
  });
}
