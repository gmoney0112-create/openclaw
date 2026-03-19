const PII_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/gi, "[REDACTED]"],
  [/\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g, "[REDACTED]"],
  [/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED]"],
];

function scrubString(text: string): string {
  return PII_PATTERNS.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    text,
  );
}

export function scrubPiiValue<T>(value: T): T {
  if (typeof value === "string") {
    return scrubString(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => scrubPiiValue(entry)) as T;
  }
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      output[key] = scrubPiiValue(entry);
    }
    return output as T;
  }
  return value;
}
