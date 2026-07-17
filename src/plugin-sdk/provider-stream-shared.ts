import type { StreamFn } from "@mariozechner/pi-agent-core";

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
