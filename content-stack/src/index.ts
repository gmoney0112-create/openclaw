#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { runPipeline } from './pipeline/index.js';
import type { ContentFormat } from './types.js';

const program = new Command();

program
  .name('content-stack')
  .description('Automated content pipeline: research → script → video → distribute')
  .version('0.1.0');

program
  .command('run <topic>')
  .description('Run the full content pipeline for a topic')
  .option('-f, --format <format>', 'Content format: short, long, or both', 'both')
  .option('-o, --output <dir>', 'Output directory (default: ./output/<topic>)')
  .option('--emails <list>', 'Comma-separated subscriber emails to notify')
  .option('--skip-research', 'Skip research phase (use if you have existing data)')
  .option('--skip-assets', 'Skip asset generation (skip Higgsfield/Remotion)')
  .option('--skip-distribute', 'Skip distribution (Vercel/Resend/Notion)')
  .action(async (topic: string, opts: {
    format: string;
    output?: string;
    emails?: string;
    skipResearch?: boolean;
    skipAssets?: boolean;
    skipDistribute?: boolean;
  }) => {
    const format = opts.format as ContentFormat;
    if (!['short', 'long', 'both'].includes(format)) {
      console.error(chalk.red('--format must be short, long, or both'));
      process.exit(1);
    }

    try {
      await runPipeline({
        topic,
        format,
        outputDir: opts.output,
        subscriberEmails: opts.emails?.split(',').map((e) => e.trim()),
        skipResearch: opts.skipResearch,
        skipAssets: opts.skipAssets,
        skipDistribute: opts.skipDistribute,
      });
    } catch (err) {
      console.error(chalk.red(`\nPipeline error: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('research <topic>')
  .description('Research phase only — save results to output dir')
  .option('-o, --output <dir>', 'Output directory')
  .action(async (topic: string, opts: { output?: string }) => {
    const { runResearch } = await import('./pipeline/research.js');
    const { config } = await import('./config.js');
    const { mkdirSync } = await import('fs');
    const { join } = await import('path');

    const outputDir = opts.output ?? join(config.output.dir, topic.toLowerCase().replace(/\s+/g, '-'));
    mkdirSync(outputDir, { recursive: true });

    try {
      const result = await runResearch({ topic, format: 'both', outputDir });
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(chalk.red(`Research error: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('script <topic>')
  .description('Generate scripts only (no video production)')
  .option('-f, --format <format>', 'Content format: short, long, or both', 'both')
  .action(async (topic: string, opts: { format: string }) => {
    const { runGenerate } = await import('./pipeline/generate.js');
    const { config } = await import('./config.js');
    const { mkdirSync } = await import('fs');
    const { join } = await import('path');

    const outputDir = join(config.output.dir, topic.toLowerCase().replace(/\s+/g, '-'));
    mkdirSync(outputDir, { recursive: true });

    try {
      const scripts = await runGenerate({ topic, format: opts.format as ContentFormat, outputDir });
      for (const s of scripts) {
        console.log(chalk.bold(`\n=== ${s.format.toUpperCase()} SCRIPT: ${s.title} ===`));
        console.log(chalk.dim('Hook:'), s.hook);
        console.log(chalk.dim('Body:'));
        s.body.forEach((p, i) => console.log(`  [${i + 1}] ${p}`));
        console.log(chalk.dim('CTA:'), s.cta);
        console.log(chalk.dim('Hashtags:'), s.hashtags.join(' '));
      }
    } catch (err) {
      console.error(chalk.red(`Script error: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program.parse();
