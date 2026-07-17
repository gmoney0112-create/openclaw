import type { StreamFn } from "@mariozechner/pi-agent-core";

export { streamWithPayloadPatch } from "../agents/pi-embedded-runner/stream-payload-utils.js";

/**
 * Threads a base StreamFn through a sequence of optional wrapper functions,
 * skipping any that are undefined (the caller's condition for applying that
 * wrapper wasn't met). Returns undefined unchanged -- there's nothing to wrap.
 */
export function composeProviderStreamWrappers(
  streamFn: StreamFn | undefined,
  ...wrappers: Array<((streamFn: StreamFn) => StreamFn) | undefined>
): StreamFn | undefined {
  if (!streamFn) {
    return undefined;
  }
  return wrappers.reduce<StreamFn>(
    (current, wrapper) => (wrapper ? wrapper(current) : current),
    streamFn,
  );
}

export type AnthropicPayloadPolicyContext = {
  provider?: string;
  api?: string;
  baseUrl?: string;
  serviceTier?: string;
};

export type AnthropicPayloadPolicy = {
  allowsServiceTier: boolean;
  serviceTier?: string;
};

/**
 * Phantom import found and closed 2026-07-17: this symbol was imported by
 * extensions/anthropic/stream-wrappers.ts but never defined anywhere in the
 * codebase (unlike composeProviderStreamWrappers/streamWithPayloadPatch,
 * which had inferable contracts or a real reference implementation to
 * promote). The real Anthropic service-tier eligibility rules (which
 * provider/api/baseUrl combinations the API actually accepts service_tier
 * for) aren't verifiable from the call sites alone, and guessing at that
 * business logic risks silently mis-applying or mis-suppressing behavior --
 * worse than a loud crash. Conservatively always reports "not allowed" so
 * fast-mode/service-tier requests no-op (pass the stream through unchanged)
 * instead of crashing, matching how this codebase already degrades other
 * unimplemented capabilities (e.g. firecrawl's web-fetch registration).
 * Revisit with real Anthropic API docs/testing before enabling service tier.
 */
export function resolveAnthropicPayloadPolicy(
  _ctx: AnthropicPayloadPolicyContext,
): AnthropicPayloadPolicy {
  return { allowsServiceTier: false };
}

/** Paired with resolveAnthropicPayloadPolicy; unreachable while allowsServiceTier is always false. */
export function applyAnthropicPayloadPolicyToParams(
  payload: Record<string, unknown>,
  _policy: AnthropicPayloadPolicy,
): Record<string, unknown> {
  return payload;
}

export function defaultToolStreamExtraParams(
  extraParams: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!extraParams) {
    return { tool_stream: true };
  }
  if (extraParams.tool_stream !== undefined) {
    return extraParams;
  }
  return {
    ...extraParams,
    tool_stream: true,
  };
}

/**
 * Decodes HTML entities in tool call arguments (e.g., &lt; to <, &quot; to ")
 */
export function createHtmlEntityToolCallArgumentDecodingWrapper(streamFn: unknown): unknown {
  // This is a no-op wrapper for now; actual HTML entity decoding would be
  // applied to tool call arguments during stream processing
  return streamFn;
}
