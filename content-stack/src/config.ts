import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

loadEnv({ path: resolve(process.cwd(), '.env') });

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}\nCopy .env.example → .env and fill it in.`);
  return val;
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const config = {
  anthropic: {
    apiKey: required('ANTHROPIC_API_KEY'),
    model: optional('ANTHROPIC_MODEL', 'claude-opus-4-8'),
  },
  openai: {
    apiKey: optional('OPENAI_API_KEY'),
  },
  apify: {
    apiKey: optional('APIFY_API_KEY'),
    baseUrl: 'https://api.apify.com/v2',
  },
  higgsfield: {
    apiKey: optional('HIGGSFIELD_API_KEY'),
    baseUrl: 'https://api.higgsfield.ai/v1',
  },
  resend: {
    apiKey: optional('RESEND_API_KEY'),
    fromEmail: optional('RESEND_FROM_EMAIL', 'noreply@example.com'),
  },
  notion: {
    apiKey: optional('NOTION_API_KEY'),
    calendarDatabaseId: optional('NOTION_CALENDAR_DATABASE_ID'),
  },
  vercel: {
    token: optional('VERCEL_TOKEN'),
    orgId: optional('VERCEL_ORG_ID'),
    projectName: optional('VERCEL_PROJECT_NAME', 'content-landing'),
  },
  output: {
    dir: optional('OUTPUT_DIR', './output'),
  },
};
