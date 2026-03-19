import { validateJsonSchemaValue } from "../plugins/schema-validator.js";

const DANGEROUS_VALUE_PATTERNS = ["__proto__", "eval(", "<script"];

export type OutputGuardResult = { valid: true } | { valid: false; reason: string };

function containsDangerousValue(value: unknown): boolean {
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    return DANGEROUS_VALUE_PATTERNS.some((pattern) => lowered.includes(pattern.toLowerCase()));
  }
  if (Array.isArray(value)) {
    return value.some((entry) => containsDangerousValue(entry));
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (containsDangerousValue(key) || containsDangerousValue(entry)) {
        return true;
      }
    }
  }
  return false;
}

function normalizeSchema(schema: unknown): Record<string, unknown> | null {
  return schema && typeof schema === "object" && !Array.isArray(schema)
    ? (schema as Record<string, unknown>)
    : null;
}

export function guardOutputToolCall(params: {
  toolName: string;
  args: unknown;
  schema?: unknown;
}): OutputGuardResult {
  const toolName = params.toolName.trim();
  if (!toolName) {
    return { valid: false, reason: "unknown_tool" };
  }
  if (containsDangerousValue(params.args)) {
    return { valid: false, reason: "dangerous_payload" };
  }
  const schema = normalizeSchema(params.schema);
  if (!schema) {
    return { valid: true };
  }
  const validation = validateJsonSchemaValue({
    schema,
    cacheKey: `tool-output-guard:${toolName}`,
    value: params.args ?? {},
  });
  if (!validation.ok) {
    return { valid: false, reason: validation.errors[0]?.text ?? "invalid_tool_args" };
  }
  return { valid: true };
}
