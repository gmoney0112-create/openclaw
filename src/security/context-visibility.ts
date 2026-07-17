import type { ChannelContextVisibilityMode } from "../config/context-visibility.js";

/**
 * Decides whether a quoted/forwarded message's supplemental context should be
 * included for a group message. No visibility mode is configurable yet (see
 * resolveChannelContextVisibilityMode), so this preserves the original
 * sender-allowed-only behavior rather than introducing new filtering.
 */
export function evaluateSupplementalContextVisibility(params: {
  mode: ChannelContextVisibilityMode;
  kind: "quote" | "forwarded";
  senderAllowed: boolean;
}): { include: boolean } {
  return { include: params.senderAllowed };
}
