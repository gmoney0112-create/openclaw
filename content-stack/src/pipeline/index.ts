import { mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { config } from '../config.js';
import { runResearch } from './research.js';
import { runGenerate } from './generate.js';
import { runAssets } from './assets.js';
import { runEdit } from './edit.js';
import { runDistribute } from './distribute.js';
import type { ContentFormat, PipelineState } from '../types.js';

export interface RunOptions {
  topic: string;
  format: ContentFormat;
  outputDir?: string;
  subscriberEmails?: string[];
  skipResearch?: boolean;
  skipAssets?: boolean;
  skipDistribute?: boolean;
}

export async function runPipeline(opts: RunOptions): Promise<PipelineState> {
  const outputDir = opts.outputDir ?? join(config.output.dir, slugify(opts.topic));
  mkdirSync(outputDir, { recursive: true });

  const state: PipelineState = {
    topic: opts.topic,
    format: opts.format,
    outputDir,
  };

  console.log(chalk.bold(`\nContent Stack Pipeline`));
  console.log(chalk.dim(`Topic: ${opts.topic} | Format: ${opts.format}`));
  console.log(chalk.dim(`Output: ${outputDir}\n`));

  // === Phase 1: Research ===
  if (!opts.skipResearch) {
    const spinner = ora('Phase 1/5 Research …').start();
    try {
      state.research = await runResearch(state);
      spinner.succeed(chalk.green(`Research complete — ${state.research.trends.length} trends, ${state.research.transcripts.length} transcripts`));
    } catch (err) {
      spinner.fail(`Research failed: ${(err as Error).message}`);
      throw err;
    }
  }

  // === Phase 2: Script Generation ===
  {
    const spinner = ora('Phase 2/5 Generating scripts …').start();
    try {
      const scripts = await runGenerate(state);
      state.script = scripts[0]; // primary script; all formats stored in outputDir
      spinner.succeed(chalk.green(`Script ready: "${state.script.title}"`));
    } catch (err) {
      spinner.fail(`Script generation failed: ${(err as Error).message}`);
      throw err;
    }
  }

  // === Phase 3: Assets ===
  if (!opts.skipAssets) {
    const spinner = ora('Phase 3/5 Generating assets (b-roll, animations) …').start();
    try {
      state.assets = await runAssets(state, state.script!);
      spinner.succeed(chalk.green(`Assets ready: ${state.assets.length} clips`));
    } catch (err) {
      spinner.warn(`Assets phase skipped: ${(err as Error).message}`);
      state.assets = [];
    }
  } else {
    state.assets = [];
  }

  // === Phase 4: Edit ===
  if (state.assets.length > 0) {
    const spinner = ora('Phase 4/5 Editing video …').start();
    try {
      state.finalVideo = await runEdit(state, state.script!, state.assets);
      spinner.succeed(chalk.green(`Edit complete: ${state.finalVideo.path}`));
    } catch (err) {
      spinner.warn(`Edit skipped: ${(err as Error).message}`);
    }
  } else {
    console.log(chalk.yellow('Phase 4/5 Edit — skipped (no assets)'));
  }

  // === Phase 5: Distribute ===
  if (!opts.skipDistribute) {
    const spinner = ora('Phase 5/5 Distributing …').start();
    try {
      state.distribution = await runDistribute(
        state,
        state.script!,
        state.finalVideo!,
        opts.subscriberEmails ?? [],
      );
      spinner.succeed(chalk.green('Distribution complete'));
    } catch (err) {
      spinner.warn(`Distribution skipped: ${(err as Error).message}`);
    }
  }

  // Summary
  console.log(chalk.bold('\nDone!'));
  if (state.finalVideo) console.log(`  Video:        ${state.finalVideo.path}`);
  if (state.distribution?.landingPageUrl) console.log(`  Landing page: ${state.distribution.landingPageUrl}`);
  if (state.distribution?.notionEntryUrl) console.log(`  Notion:       ${state.distribution.notionEntryUrl}`);

  return state;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
