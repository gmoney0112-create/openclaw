import * as claude from '../tools/claude.js';
import type { PipelineState, Script, ContentFormat, ResearchResult } from '../types.js';

const SYSTEM = `You are an expert content scriptwriter who specializes in viral short-form and long-form video content.
You understand hooks, pacing, storytelling, and platform-specific best practices (YouTube, Instagram Reels, TikTok).
Always return valid JSON.`;

/** Phase 2: Generate scripts from research. */
export async function runGenerate(state: PipelineState): Promise<Script[]> {
  const research = state.research!;
  const formats: ContentFormat[] = state.format === 'both' ? ['short', 'long'] : [state.format];
  return Promise.all(formats.map((fmt) => generateScript(research, fmt)));
}

async function generateScript(research: ResearchResult, format: ContentFormat): Promise<Script> {
  const isShort = format === 'short';

  const prompt = `Write a ${isShort ? 'short-form (60 seconds, 150 words)' : 'long-form (10 minutes, 1500 words)'} video script about: "${research.topic}"

Target audience: ${research.targetAudience}
Key trends to address: ${research.trends.slice(0, 5).join('; ')}
SEO keywords to weave in: ${research.keywords.slice(0, 8).join(', ')}

Return a JSON object with:
{
  "title": "Video title (hook-style, under 70 chars)",
  "hook": "${isShort ? 'Opening 3-second hook line' : 'Opening 30-second hook paragraph'}",
  "body": ["array", "of", "${isShort ? '5–8' : '10–15'}", "script", "sections/paragraphs"],
  "cta": "Call to action at the end",
  "keywords": ["top", "keywords", "array"],
  "hashtags": ["#relevant", "#hashtags", "8–12 items"],
  "estimatedDuration": ${isShort ? 60 : 600},
  "format": "${format}"
}`;

  const script = await claude.askJson<Omit<Script, 'format'>>(SYSTEM, prompt);
  return { ...script, format };
}
