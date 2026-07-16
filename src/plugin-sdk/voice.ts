// Compat surface: openclaw/plugin-sdk/voice
// Provides stable types and registry for voice interaction capabilities.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Voice interface configuration. */
export type VoiceConfig = {
  /** Enable speech recognition (voice input). */
  enableInput: boolean;
  /** Enable text-to-speech (voice output). */
  enableOutput: boolean;
  /** Supported languages (e.g., 'en-US', 'es-ES'). */
  languages: string[];
  /** Speech-to-text provider ID. */
  inputProvider?: string;
  /** Text-to-speech provider ID. */
  outputProvider?: string;
  /** Wake word to activate listening (if supported). */
  wakeWord?: string;
  /** Timeout for listening (in milliseconds). */
  timeout?: number;
};

/** Current state of a voice session. */
export type VoiceSession = {
  /** Whether the voice interface is currently listening. */
  isListening: boolean;
  /** Whether the voice interface is currently speaking. */
  isSpeaking: boolean;
  /** Transcribed text from the most recent input. */
  transcript?: string;
  /** Confidence level of the transcription (0-1). */
  confidence?: number;
  /** Current language being used. */
  currentLanguage?: string;
  /** Session start time. */
  startTime?: number;
};

/** A provider that enables voice interaction. */
export type VoiceInterfaceProvider = {
  /** Unique provider identifier. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Voice interface configuration. */
  config: VoiceConfig;
  /** Start listening for voice input. */
  startListening: () => Promise<void>;
  /** Stop listening for voice input. */
  stopListening: () => Promise<void>;
  /** Output text as speech. */
  speak: (text: string, options?: { speed?: number; pitch?: number }) => Promise<void>;
  /** Get the current session state. */
  getSession: () => VoiceSession;
  /** Set the active language. */
  setLanguage?: (language: string) => Promise<void>;
};

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Voice interface event types. */
export type VoiceEventType =
  | "listening_started"
  | "listening_stopped"
  | "speech_recognized"
  | "speech_error"
  | "speaking_started"
  | "speaking_stopped";

/** Voice interface event. */
export type VoiceEvent = {
  type: VoiceEventType;
  timestamp: number;
  transcript?: string;
  confidence?: number;
  error?: string;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, VoiceInterfaceProvider>();
const _listeners: Array<(event: VoiceEvent) => void> = [];

/** Register a voice interface provider. */
export function registerVoiceInterfaceProvider(provider: VoiceInterfaceProvider): void {
  _registry.set(provider.id, provider);
}

/** Retrieve a registered voice interface provider by ID. */
export function getVoiceInterfaceProvider(id: string): VoiceInterfaceProvider | null {
  return _registry.get(id) ?? null;
}

/** List all registered voice interface providers. */
export function listVoiceInterfaceProviders(): VoiceInterfaceProvider[] {
  return [..._registry.values()];
}

/** Subscribe to voice events. */
export function onVoiceEvent(listener: (event: VoiceEvent) => void): () => void {
  _listeners.push(listener);
  return () => {
    const idx = _listeners.indexOf(listener);
    if (idx !== -1) {
      _listeners.splice(idx, 1);
    }
  };
}

/** Emit a voice event (for internal use). */
export function emitVoiceEvent(event: VoiceEvent): void {
  _listeners.forEach((listener) => listener(event));
}
