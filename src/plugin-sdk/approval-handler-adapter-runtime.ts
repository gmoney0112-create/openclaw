export const CHANNEL_APPROVAL_NATIVE_RUNTIME_CONTEXT_CAPABILITY =
  "channel-approval-native-runtime-context";

/**
 * Wrap a lazily-loaded channel approval native runtime module behind the same
 * opaque adapter shape as `createChannelApprovalNativeRuntimeAdapter`, so
 * callers can defer importing the heavy runtime module until it's needed.
 */
export function createLazyChannelApprovalNativeRuntimeAdapter<T>(config: T): T {
  return config;
}
