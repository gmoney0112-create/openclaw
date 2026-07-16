import { createTextPairingAdapter } from "../channels/plugins/pairing-adapters.js";
import type {
  ChannelOutboundAdapter,
  ChannelPairingAdapter,
} from "../channels/plugins/types.adapters.js";
import type { ChannelPlugin } from "../channels/plugins/types.plugin.js";
import { createAttachedChannelResultAdapter } from "./channel-send-result.js";

export {
  DEFAULT_SECRET_FILE_MAX_BYTES,
  loadSecretFileSync,
  readSecretFileSync,
  tryReadSecretFileSync,
} from "../infra/secret-file.js";
export type { SecretFileReadOptions, SecretFileReadResult } from "../infra/secret-file.js";
export { createChannelPluginBase, defineSetupPluginEntry } from "./core.js";
export type { ChannelPlugin } from "../channels/plugins/types.plugin.js";

type TextPairingConfig = Parameters<typeof createTextPairingAdapter>[0];
type PairingInput = ChannelPairingAdapter | { text: TextPairingConfig };
type AttachedResultsConfig = Parameters<typeof createAttachedChannelResultAdapter>[0];
type OutboundInput =
  | ChannelOutboundAdapter
  | { base?: Partial<ChannelOutboundAdapter>; attachedResults?: AttachedResultsConfig };

function resolvePairingAdapter(pairing: PairingInput): ChannelPairingAdapter {
  if ("text" in pairing && pairing.text) {
    return createTextPairingAdapter(pairing.text);
  }
  return pairing as ChannelPairingAdapter;
}

function resolveOutboundAdapter(outbound: OutboundInput): ChannelOutboundAdapter {
  if ("base" in outbound || "attachedResults" in outbound) {
    return {
      ...(outbound.base as ChannelOutboundAdapter | undefined),
      ...(outbound.attachedResults
        ? createAttachedChannelResultAdapter(outbound.attachedResults)
        : {}),
    } as ChannelOutboundAdapter;
  }
  return outbound as ChannelOutboundAdapter;
}

/**
 * Shared factory for chat channel plugins: merges the plugin `base` shape with
 * top-level adapter overrides, translating the `pairing.text` and
 * `outbound.{base,attachedResults}` shorthand into their full adapter forms.
 */
export function createChatChannelPlugin<
  ResolvedAccount = unknown,
  Probe = unknown,
  Audit = unknown,
>(
  params: Partial<ChannelPlugin<ResolvedAccount, Probe, Audit>> & {
    base: Partial<ChannelPlugin<ResolvedAccount, Probe, Audit>>;
    pairing?: PairingInput;
    outbound?: OutboundInput;
  },
): ChannelPlugin<ResolvedAccount, Probe, Audit> {
  const { base, pairing, outbound, ...rest } = params;

  return {
    ...base,
    ...rest,
    ...(pairing ? { pairing: resolvePairingAdapter(pairing) } : {}),
    ...(outbound ? { outbound: resolveOutboundAdapter(outbound) } : {}),
  } as ChannelPlugin<ResolvedAccount, Probe, Audit>;
}
