import type { OpenClawConfig } from "./config.js";

export type ChannelContextVisibilityMode = "default";

/**
 * Resolves how much supplemental context (quoted/forwarded messages) a channel
 * should surface. No config schema exists for this yet, so every call resolves
 * to "default" — this is an intentional no-op stub preserving prior behavior
 * (see evaluateSupplementalContextVisibility) until a real feature is designed.
 */
export function resolveChannelContextVisibilityMode(_params: {
  cfg: OpenClawConfig;
  channel: string;
  accountId?: string;
}): ChannelContextVisibilityMode {
  return "default";
}
