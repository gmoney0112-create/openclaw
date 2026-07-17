import type { ReplyPayload } from "../auto-reply/types.js";
import { createReplyPrefixOptions, type ReplyPrefixOptions } from "../channels/reply-prefix.js";
import { createTypingCallbacks, type CreateTypingCallbacksParams } from "../channels/typing.js";
import type { OpenClawConfig } from "../config/config.js";

export * from "./channel-runtime.js";
export { createReplyPrefixContext, createReplyPrefixOptions } from "../channels/reply-prefix.js";

export type ChannelReplyPipeline = ReplyPrefixOptions & {
  typingCallbacks?: ReturnType<typeof createTypingCallbacks>;
  transformReplyPayload?: (payload: ReplyPayload) => ReplyPayload;
};

/**
 * Bundles the reply-prefix (identity/model-context) and typing-indicator
 * building blocks that every channel's reply dispatcher needs, so channels
 * don't each hand-assemble the same pair of calls.
 */
export function createChannelReplyPipeline(params: {
  cfg: OpenClawConfig;
  agentId: string;
  channel: string;
  accountId?: string;
  typing?: CreateTypingCallbacksParams;
  transformReplyPayload?: (payload: ReplyPayload) => ReplyPayload;
}): ChannelReplyPipeline {
  const prefixOptions = createReplyPrefixOptions({
    cfg: params.cfg,
    agentId: params.agentId,
    channel: params.channel,
    accountId: params.accountId,
  });
  const typingCallbacks = params.typing ? createTypingCallbacks(params.typing) : undefined;
  return {
    ...prefixOptions,
    typingCallbacks,
    transformReplyPayload: params.transformReplyPayload,
  };
}
