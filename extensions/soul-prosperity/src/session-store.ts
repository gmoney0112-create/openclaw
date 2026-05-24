type Message = { role: "user" | "assistant"; content: string };

type Session = {
  id: string;
  currentTier: number;
  history: Message[];
  lastActiveAt: number;
};

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_HISTORY = 40; // keep last 20 turns (user+assistant pairs)

const store = new Map<string, Session>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

export function startSessionCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [id, session] of store) {
      if (session.lastActiveAt < cutoff) {
        store.delete(id);
      }
    }
  }, 60 * 60 * 1000); // run every hour
  cleanupTimer.unref?.();
}

export function getOrCreateSession(sessionId: string): Session {
  const existing = store.get(sessionId);
  if (existing) {
    existing.lastActiveAt = Date.now();
    return existing;
  }
  const session: Session = {
    id: sessionId,
    currentTier: 0,
    history: [],
    lastActiveAt: Date.now(),
  };
  store.set(sessionId, session);
  return session;
}

export function appendToSession(
  sessionId: string,
  userMessage: string,
  assistantReply: string,
  nextTier: number,
): void {
  const session = store.get(sessionId);
  if (!session) return;
  session.history.push({ role: "user", content: userMessage });
  session.history.push({ role: "assistant", content: assistantReply });
  // Trim to keep context manageable
  if (session.history.length > MAX_HISTORY) {
    session.history = session.history.slice(-MAX_HISTORY);
  }
  session.currentTier = nextTier;
  session.lastActiveAt = Date.now();
}

export function getSessionHistory(sessionId: string): Message[] {
  return store.get(sessionId)?.history ?? [];
}
