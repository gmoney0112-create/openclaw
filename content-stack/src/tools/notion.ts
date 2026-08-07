import { Client } from '@notionhq/client';
import { config } from '../config.js';
import type { ContentFormat, Script } from '../types.js';

let _client: Client | null = null;

function client(): Client {
  if (!config.notion.apiKey) {
    throw new Error('NOTION_API_KEY is required. Create an integration at notion.so → Settings → Connections.');
  }
  if (!_client) _client = new Client({ auth: config.notion.apiKey });
  return _client;
}

function dbId(): string {
  if (!config.notion.calendarDatabaseId) {
    throw new Error('NOTION_CALENDAR_DATABASE_ID is required.');
  }
  return config.notion.calendarDatabaseId;
}

export interface CalendarEntry {
  title: string;
  topic: string;
  format: ContentFormat;
  status: 'Draft' | 'In Progress' | 'Ready' | 'Published';
  publishDate?: string; // ISO date string e.g. "2026-06-10"
  videoUrl?: string;
  landingPageUrl?: string;
  hashtags?: string[];
  keywords?: string[];
}

/** Add a new content entry to the Notion calendar database. */
export async function addEntry(entry: CalendarEntry): Promise<{ id: string; url: string }> {
  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: entry.title } }] },
    Topic: { rich_text: [{ text: { content: entry.topic } }] },
    Format: { select: { name: entry.format === 'both' ? 'Short + Long' : entry.format === 'short' ? 'Short-form' : 'Long-form' } },
    Status: { status: { name: entry.status } },
  };

  if (entry.publishDate) {
    properties['Publish Date'] = { date: { start: entry.publishDate } };
  }
  if (entry.videoUrl) {
    properties['Video URL'] = { url: entry.videoUrl };
  }
  if (entry.landingPageUrl) {
    properties['Landing Page'] = { url: entry.landingPageUrl };
  }
  if (entry.hashtags?.length) {
    properties['Hashtags'] = {
      multi_select: entry.hashtags.map((tag) => ({ name: tag.replace(/^#/, '') })),
    };
  }
  if (entry.keywords?.length) {
    properties['Keywords'] = {
      rich_text: [{ text: { content: entry.keywords.join(', ') } }],
    };
  }

  const page = await client().pages.create({
    parent: { database_id: dbId() },
    properties: properties as Parameters<Client['pages']['create']>[0]['properties'],
  });

  return { id: page.id, url: (page as { url?: string }).url ?? '' };
}

/** Update the status of an existing calendar entry. */
export async function updateStatus(
  pageId: string,
  status: CalendarEntry['status'],
): Promise<void> {
  await client().pages.update({
    page_id: pageId,
    properties: { Status: { status: { name: status } } } as Parameters<Client['pages']['update']>[0]['properties'],
  });
}

/** Build a Notion calendar entry from a generated script. */
export function entryFromScript(script: Script): CalendarEntry {
  return {
    title: script.title,
    topic: script.keywords.slice(0, 3).join(', '),
    format: script.format,
    status: 'In Progress',
    hashtags: script.hashtags,
    keywords: script.keywords,
  };
}
