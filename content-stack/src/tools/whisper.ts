import OpenAI from 'openai';
import { createReadStream } from 'fs';
import { config } from '../config.js';
import type { CaptionSegment } from '../types.js';

let _client: OpenAI | null = null;

function client(): OpenAI {
  if (!config.openai.apiKey) throw new Error('OPENAI_API_KEY is required for Whisper transcription');
  if (!_client) _client = new OpenAI({ apiKey: config.openai.apiKey });
  return _client;
}

export interface TranscriptionResult {
  text: string;
  segments: CaptionSegment[];
  language: string;
}

export async function transcribe(audioPath: string): Promise<TranscriptionResult> {
  const resp = await client().audio.transcriptions.create({
    file: createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });

  return {
    text: resp.text,
    language: resp.language ?? 'en',
    segments: (resp.segments ?? []).map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    })),
  };
}
