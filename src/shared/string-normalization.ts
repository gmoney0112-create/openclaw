export function normalizeStringEntries(list?: ReadonlyArray<unknown>) {
  return (list ?? []).map((entry) => String(entry).trim()).filter(Boolean);
}

export function normalizeStringEntriesLower(list?: ReadonlyArray<unknown>) {
  return normalizeStringEntries(list).map((entry) => entry.toLowerCase());
}

export function normalizeHyphenSlug(raw?: string | null) {
  const trimmed = raw?.trim().toLowerCase() ?? "";
  if (!trimmed) {
    return "";
  }
  const dashed = trimmed.replace(/\s+/g, "-");
  const cleaned = dashed.replace(/[^a-z0-9#@._+-]+/g, "-");
  return cleaned.replace(/-{2,}/g, "-").replace(/^[-.]+|[-.]+$/g, "");
}

export function normalizeAtHashSlug(raw?: string | null) {
  const trimmed = raw?.trim().toLowerCase() ?? "";
  if (!trimmed) {
    return "";
  }
  const withoutPrefix = trimmed.replace(/^[@#]+/, "");
  const dashed = withoutPrefix.replace(/[\s_]+/g, "-");
  const cleaned = dashed.replace(/[^a-z0-9-]+/g, "-");
  return cleaned.replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
}

/** Trim a value to a non-empty string, or undefined if it isn't a usable string. */
export function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

/** Trim + lowercase a value, returning "" if it isn't a usable string. */
export function normalizeLowercaseStringOrEmpty(value: unknown): string {
  return normalizeOptionalString(value)?.toLowerCase() ?? "";
}

/** Trim + lowercase a value, or undefined if it isn't a usable string. */
export function normalizeOptionalLowercaseString(value: unknown): string | undefined {
  return normalizeOptionalString(value)?.toLowerCase();
}

/** Read a raw value as a non-empty trimmed string, or undefined otherwise. */
export function readStringValue(value: unknown): string | undefined {
  return normalizeOptionalString(value);
}

/** Read a field off a plain object as a non-empty trimmed string, or undefined otherwise. */
export function readStringField(
  obj: Record<string, unknown> | undefined | null,
  key: string,
): string | undefined {
  return normalizeOptionalString(obj?.[key]);
}

/** Cast a value to a plain object record if it is one (not an array, not null), else undefined. */
export function asOptionalRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
