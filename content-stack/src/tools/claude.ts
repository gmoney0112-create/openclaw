import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

export async function ask(system: string, user: string): Promise<string> {
  const msg = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 8192,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const block = msg.content[0];
  if (block.type !== 'text') throw new Error('Unexpected non-text response from Claude');
  return block.text;
}

export async function askJson<T>(system: string, user: string): Promise<T> {
  const raw = await ask(system, `${user}\n\nRespond with valid JSON only. No markdown fences.`);
  // Strip any accidental markdown fences
  const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  return JSON.parse(cleaned) as T;
}
