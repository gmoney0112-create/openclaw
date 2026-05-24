import type { IncomingMessage, ServerResponse } from "node:http";
import Anthropic from "@anthropic-ai/sdk";
import type { OfferTier } from "./offer-ladder.js";
import { buildSystemPrompt } from "./offer-ladder.js";
import { isRateLimited } from "./rate-limiter.js";
import {
  appendToSession,
  getOrCreateSession,
  getSessionHistory,
  startSessionCleanup,
} from "./session-store.js";

export type ChatHandlerConfig = {
  anthropicApiKey: string;
  allowedOrigins: string[];
  tiers: OfferTier[];
};

type ChatRequest = {
  sessionId: string;
  message: string;
};

type ChatResponse = {
  ok: true;
  reply: string;
  currentTier: number;
  offer?: {
    index: number;
    name: string;
    priceDisplay: string;
    url: string;
  };
};

type ErrorResponse = { ok: false; error: string };

const SESSION_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;
const MESSAGE_MAX_CHARS = 2000;
const OFFER_SIGNAL_RE = /\[OFFER:(\d+)\]\s*$/;

function resolveClientIp(req: IncomingMessage): string {
  const fwd = req.headers["x-forwarded-for"];
  const first = Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0]?.trim();
  return first ?? req.socket.remoteAddress ?? "unknown";
}

function writeJson(
  res: ServerResponse,
  status: number,
  body: ChatResponse | ErrorResponse,
): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    let bytes = 0;
    req.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        reject(new Error("body too large"));
        return;
      }
      data += chunk.toString("utf8");
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function extractOfferSignal(
  text: string,
  tiers: OfferTier[],
): { reply: string; offerIndex: number | null } {
  const match = OFFER_SIGNAL_RE.exec(text);
  if (!match) return { reply: text.trim(), offerIndex: null };
  const idx = parseInt(match[1] ?? "", 10);
  const reply = text.slice(0, match.index).trim();
  if (isNaN(idx) || idx < 0 || idx >= tiers.length) {
    return { reply, offerIndex: null };
  }
  return { reply, offerIndex: idx };
}

export function createChatHandler(config: ChatHandlerConfig) {
  startSessionCleanup();

  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const systemPrompt = buildSystemPrompt(config.tiers);

  const corsHeaders = (origin: string | undefined): Record<string, string> => {
    const allowed =
      origin && config.allowedOrigins.length > 0
        ? config.allowedOrigins.includes(origin)
          ? origin
          : config.allowedOrigins[0] ?? "*"
        : "*";
    return {
      "Access-Control-Allow-Origin": allowed,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };
  };

  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    const origin = Array.isArray(req.headers.origin)
      ? req.headers.origin[0]
      : req.headers.origin;

    // Apply CORS headers to all responses
    for (const [k, v] of Object.entries(corsHeaders(origin))) {
      res.setHeader(k, v);
    }

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return true;
    }

    if (req.method !== "POST") {
      writeJson(res, 405, { ok: false, error: "method not allowed" });
      return true;
    }

    // Rate limit by IP
    const clientIp = resolveClientIp(req);
    if (isRateLimited(clientIp)) {
      writeJson(res, 429, { ok: false, error: "too many requests" });
      return true;
    }

    // Parse request body
    let raw: string;
    try {
      raw = await readBody(req, 8 * 1024);
    } catch {
      writeJson(res, 413, { ok: false, error: "request too large" });
      return true;
    }

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      writeJson(res, 400, { ok: false, error: "invalid JSON" });
      return true;
    }

    if (!body || typeof body !== "object") {
      writeJson(res, 400, { ok: false, error: "invalid request" });
      return true;
    }

    const { sessionId, message } = body as Record<string, unknown>;

    if (typeof sessionId !== "string" || !SESSION_ID_RE.test(sessionId)) {
      writeJson(res, 400, { ok: false, error: "invalid sessionId" });
      return true;
    }

    if (typeof message !== "string" || message.trim().length === 0) {
      writeJson(res, 400, { ok: false, error: "message is required" });
      return true;
    }

    if (message.length > MESSAGE_MAX_CHARS) {
      writeJson(res, 400, { ok: false, error: "message too long" });
      return true;
    }

    const userMessage = message.trim();
    const session = getOrCreateSession(sessionId);
    const history = getSessionHistory(sessionId);

    // Call Claude
    let assistantText: string;
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: userMessage },
        ],
      });

      const block = response.content[0];
      assistantText = block?.type === "text" ? block.text : "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      writeJson(res, 502, { ok: false, error: `AI service error: ${msg}` });
      return true;
    }

    // Extract any offer signal
    const { reply, offerIndex } = extractOfferSignal(assistantText, config.tiers);

    // Advance tier if the recommended offer is higher
    const nextTier = offerIndex !== null ? Math.max(session.currentTier, offerIndex) : session.currentTier;

    appendToSession(sessionId, userMessage, reply, nextTier);

    const offerTier = offerIndex !== null ? config.tiers[offerIndex] : undefined;

    const responseBody: ChatResponse = {
      ok: true,
      reply,
      currentTier: nextTier,
      ...(offerTier
        ? {
            offer: {
              index: offerTier.index,
              name: offerTier.name,
              priceDisplay: offerTier.priceDisplay,
              url: offerTier.url,
            },
          }
        : {}),
    };

    writeJson(res, 200, responseBody);
    return true;
  };
}
