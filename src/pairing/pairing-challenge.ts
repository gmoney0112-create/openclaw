import { buildPairingReply } from "./pairing-messages.js";

type PairingMeta = Record<string, string | undefined>;

export type PairingChallengeParams = {
  channel: string;
  senderId: string;
  senderIdLine: string;
  meta?: PairingMeta;
  upsertPairingRequest: (params: {
    id: string;
    meta?: PairingMeta;
  }) => Promise<{ code: string; created: boolean }>;
  sendPairingReply: (text: string) => Promise<void>;
  buildReplyText?: (params: { code: string; senderIdLine: string }) => string;
  onCreated?: (params: { code: string }) => void;
  onReplyError?: (err: unknown) => void;
};

/**
 * Shared pairing challenge issuance for DM pairing policy pathways.
 * Ensures every channel follows the same create-if-missing + reply flow.
 */
/**
 * Partially applies the per-channel identity (channel name + request store)
 * so call sites only need to supply the per-message fields.
 */
export function createChannelPairingChallengeIssuer(base: {
  channel: string;
  upsertPairingRequest: PairingChallengeParams["upsertPairingRequest"];
}) {
  return (params: Omit<PairingChallengeParams, "channel" | "upsertPairingRequest">) =>
    issuePairingChallenge({ ...base, ...params });
}

export async function issuePairingChallenge(
  params: PairingChallengeParams,
): Promise<{ created: boolean; code?: string }> {
  const { code, created } = await params.upsertPairingRequest({
    id: params.senderId,
    meta: params.meta,
  });
  if (!created) {
    return { created: false };
  }
  params.onCreated?.({ code });
  const replyText =
    params.buildReplyText?.({ code, senderIdLine: params.senderIdLine }) ??
    buildPairingReply({
      channel: params.channel,
      idLine: params.senderIdLine,
      code,
    });
  try {
    await params.sendPairingReply(replyText);
  } catch (err) {
    params.onReplyError?.(err);
  }
  return { created: true, code };
}
