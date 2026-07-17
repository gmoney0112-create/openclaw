const TELEGRAM_REQUEST_TIMEOUTS_MS = {
  // Bound startup/control-plane calls so the gateway cannot report Telegram as
  // healthy while provider startup is still hung on Bot API setup.
  deletewebhook: 15_000,
  getme: 15_000,
  getupdates: 45_000,
  setwebhook: 15_000,
  // Media uploads legitimately take longer than a plain text send.
  sendanimation: 60_000,
  sendaudio: 60_000,
  senddocument: 60_000,
  sendmediagroup: 60_000,
  sendphoto: 60_000,
  sendvideo: 60_000,
  sendvoice: 60_000,
} as const;

// Applied to every other Bot API method (sendMessage, editMessageText,
// deleteMessage, setMessageReaction, answerCallbackQuery, getChat, ...) so a
// stalled connection to api.telegram.org can never hang a request forever.
// Without this, a single wedged send permanently blocks that chat's
// sequentialize lane (see sequential-key.ts) since no reply, including the
// generic error fallback, can ever be sent to unblock it.
const DEFAULT_TELEGRAM_REQUEST_TIMEOUT_MS = 30_000;

export function resolveTelegramRequestTimeoutMs(method: string | null): number | undefined {
  if (!method) {
    return undefined;
  }
  return (
    TELEGRAM_REQUEST_TIMEOUTS_MS[method as keyof typeof TELEGRAM_REQUEST_TIMEOUTS_MS] ??
    DEFAULT_TELEGRAM_REQUEST_TIMEOUT_MS
  );
}
