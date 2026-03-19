const MAX_INPUT_CHARS = 500;
const MAX_BASE64_CHARS = 200;

const INJECTION_PATTERNS = [
  /ignore (previous|prior|all) instructions/i,
  /disregard your (system|instructions|prompt)/i,
  /override (your|the) (system|instructions|prompt)/i,
  /you are now (a|an|the)/i,
  /new (persona|role|identity)/i,
  /pretend (you are|to be)/i,
];

const SCRIPT_TAG_RE = /<\s*script\b/i;
const HTML_TAG_RE = /<[^>]+>/;
const BASE64_RE = /\b(?:[A-Za-z0-9+/]{4}){50,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?\b/;

export type InputGuardResult = { safe: true } | { safe: false; reason: string };

export function guardInput(message: string): InputGuardResult {
  const trimmed = message.trim();
  if (!trimmed) {
    return { safe: false, reason: "empty_message" };
  }
  if (trimmed.length > MAX_INPUT_CHARS) {
    return { safe: false, reason: "too_long" };
  }
  if (SCRIPT_TAG_RE.test(trimmed)) {
    return { safe: false, reason: "script_tag" };
  }
  if (HTML_TAG_RE.test(trimmed)) {
    return { safe: false, reason: "html_content" };
  }
  if (BASE64_RE.test(trimmed)) {
    const match = trimmed.match(BASE64_RE)?.[0] ?? "";
    if (match.length > MAX_BASE64_CHARS) {
      return { safe: false, reason: "base64_payload" };
    }
  }
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { safe: false, reason: "injection_attempt" };
    }
  }
  return { safe: true };
}
