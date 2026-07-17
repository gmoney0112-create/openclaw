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
