import { isAllowedParsedChatSender } from "./allow-from.js";

export * from "../channels/targets.js";
export { normalizeChannelId } from "../channels/plugins/index.js";

/** Shared "chat-aware" messaging target shapes for iMessage/BlueBubbles-style channels. */
export type ParsedChatTarget =
  | { kind: "chat_id"; chatId: number }
  | { kind: "chat_guid"; chatGuid: string }
  | { kind: "chat_identifier"; chatIdentifier: string };

export type ParsedChatAllowTarget = ParsedChatTarget;

export type ChatTargetPrefixesParams = {
  trimmed: string;
  lower: string;
  chatIdPrefixes: string[];
  chatGuidPrefixes: string[];
  chatIdentifierPrefixes: string[];
};

export type ServicePrefix<TService extends string = string> = {
  prefix: string;
  service: TService;
};

export type ChatSenderAllowParams = {
  allowFrom: Array<string | number>;
  sender: string;
  chatId?: number | null;
  chatGuid?: string | null;
  chatIdentifier?: string | null;
};

function matchChatIdPrefix(
  params: ChatTargetPrefixesParams,
): { kind: "chat_id"; chatId: number } | undefined {
  for (const prefix of params.chatIdPrefixes) {
    if (params.lower.startsWith(prefix)) {
      const value = params.trimmed.slice(prefix.length).trim();
      const chatId = Number.parseInt(value, 10);
      if (!Number.isFinite(chatId)) {
        throw new Error(`invalid chat id: ${value}`);
      }
      return { kind: "chat_id", chatId };
    }
  }
  return undefined;
}

function matchChatGuidPrefix(
  params: ChatTargetPrefixesParams,
): { kind: "chat_guid"; chatGuid: string } | undefined {
  for (const prefix of params.chatGuidPrefixes) {
    if (params.lower.startsWith(prefix)) {
      const value = params.trimmed.slice(prefix.length).trim();
      if (!value) {
        throw new Error("chat guid is required");
      }
      return { kind: "chat_guid", chatGuid: value };
    }
  }
  return undefined;
}

function matchChatIdentifierPrefix(
  params: ChatTargetPrefixesParams,
): { kind: "chat_identifier"; chatIdentifier: string } | undefined {
  for (const prefix of params.chatIdentifierPrefixes) {
    if (params.lower.startsWith(prefix)) {
      const value = params.trimmed.slice(prefix.length).trim();
      if (!value) {
        throw new Error("chat identifier is required");
      }
      return { kind: "chat_identifier", chatIdentifier: value };
    }
  }
  return undefined;
}

/** Parse a `chat_id:`/`chat_guid:`/`chat_identifier:`-prefixed target, throwing on a malformed value. */
export function parseChatTargetPrefixesOrThrow(
  params: ChatTargetPrefixesParams,
): ParsedChatTarget | null {
  return (
    matchChatIdPrefix(params) ??
    matchChatGuidPrefix(params) ??
    matchChatIdentifierPrefix(params) ??
    null
  );
}

/** Lenient variant of `parseChatTargetPrefixesOrThrow` for matching allowlist entries: never throws. */
export function parseChatAllowTargetPrefixes(
  params: ChatTargetPrefixesParams,
): ParsedChatAllowTarget | null {
  try {
    return parseChatTargetPrefixesOrThrow(params);
  } catch {
    return null;
  }
}

/** Resolve a `service:`-prefixed target, recursing into chat-target parsing when the remainder looks chat-shaped. */
export function resolveServicePrefixedChatTarget<
  TTarget,
  TService extends string = string,
>(params: {
  trimmed: string;
  lower: string;
  servicePrefixes: ServicePrefix<TService>[];
  chatIdPrefixes: string[];
  chatGuidPrefixes: string[];
  chatIdentifierPrefixes: string[];
  parseTarget: (raw: string) => TTarget;
}): TTarget | null {
  for (const { prefix, service } of params.servicePrefixes) {
    if (!params.lower.startsWith(prefix)) {
      continue;
    }
    const remainder = params.trimmed.slice(prefix.length).trim();
    if (!remainder) {
      continue;
    }
    const remainderLower = remainder.toLowerCase();
    const isChatTarget =
      params.chatIdPrefixes.some((p) => remainderLower.startsWith(p)) ||
      params.chatGuidPrefixes.some((p) => remainderLower.startsWith(p)) ||
      params.chatIdentifierPrefixes.some((p) => remainderLower.startsWith(p));
    if (isChatTarget) {
      return params.parseTarget(remainder);
    }
    return { kind: "handle", to: remainder, service } as unknown as TTarget;
  }
  return null;
}

/** Resolve a `service:`-prefixed target using a caller-supplied predicate for "looks like a chat target". */
export function resolveServicePrefixedTarget<TTarget, TService extends string = string>(params: {
  trimmed: string;
  lower: string;
  servicePrefixes: ServicePrefix<TService>[];
  isChatTarget: (remainderLower: string) => boolean;
  parseTarget: (raw: string) => TTarget;
}): TTarget | null {
  for (const { prefix, service } of params.servicePrefixes) {
    if (!params.lower.startsWith(prefix)) {
      continue;
    }
    const remainder = params.trimmed.slice(prefix.length).trim();
    if (!remainder) {
      continue;
    }
    if (params.isChatTarget(remainder.toLowerCase())) {
      return params.parseTarget(remainder);
    }
    return { kind: "handle", to: remainder, service } as unknown as TTarget;
  }
  return null;
}

/** Resolve a `service:`-prefixed allowlist entry by delegating the remainder to the channel's allow-target parser. */
export function resolveServicePrefixedAllowTarget<
  TAllowTarget,
  TService extends string = string,
>(params: {
  trimmed: string;
  lower: string;
  servicePrefixes: ServicePrefix<TService>[];
  parseAllowTarget: (raw: string) => TAllowTarget;
}): TAllowTarget | null {
  for (const { prefix } of params.servicePrefixes) {
    if (!params.lower.startsWith(prefix)) {
      continue;
    }
    const remainder = params.trimmed.slice(prefix.length).trim();
    if (!remainder) {
      continue;
    }
    return params.parseAllowTarget(remainder);
  }
  return null;
}

/** Same as `resolveServicePrefixedAllowTarget`, kept as a distinct name for channels whose allow-target parser also handles chat prefixes on the remainder. */
export function resolveServicePrefixedOrChatAllowTarget<
  TAllowTarget,
  TService extends string = string,
>(
  params: ChatTargetPrefixesParams & {
    servicePrefixes: ServicePrefix<TService>[];
    parseAllowTarget: (raw: string) => TAllowTarget;
  },
): TAllowTarget | null {
  return resolveServicePrefixedAllowTarget(params);
}

/** Build a chat-aware sender allowlist matcher from a channel's sender normalizer and allow-target parser. */
export function createAllowedChatSenderMatcher<
  TParsed extends ParsedChatAllowTarget | { kind: "handle"; handle: string },
>(config: {
  normalizeSender: (sender: string) => string;
  parseAllowTarget: (entry: string) => TParsed;
}): (params: ChatSenderAllowParams) => boolean {
  return (params) =>
    isAllowedParsedChatSender({
      ...params,
      normalizeSender: config.normalizeSender,
      parseAllowTarget: config.parseAllowTarget,
    });
}
