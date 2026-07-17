// MVP Implementation: Voice Interface Provider
import type { VoiceInterfaceProvider } from "../plugin-sdk/voice.js";

export const createMvpVoiceInterfaceProvider = (): VoiceInterfaceProvider => {
  const sessions = new Map<
    string,
    { isListening: boolean; isSpeaking: boolean; transcript: string }
  >();

  return {
    id: "voice-mvp-ref",
    label: "MVP Voice Interface (Reference)",
    capabilities: ["speech-recognition", "text-to-speech"],

    startListening: async (sessionId?: string) => {
      const id = sessionId || `voice-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      sessions.set(id, { isListening: true, isSpeaking: false, transcript: "" });
      return id;
    },

    stopListening: async (sessionId: string) => {
      const session = sessions.get(sessionId);
      if (session) {
        session.isListening = false;
        return { transcript: "This is a sample transcription", confidence: 0.92 };
      }
      return { transcript: "", confidence: 0 };
    },

    speak: async (sessionId: string, text: string) => {
      const session = sessions.get(sessionId);
      if (session) {
        session.isSpeaking = true;
        await new Promise((resolve) => setTimeout(resolve, text.split(" ").length * 100));
        session.isSpeaking = false;
      }
    },

    getSession: async (sessionId: string) => {
      return sessions.get(sessionId) || { isListening: false, isSpeaking: false, transcript: "" };
    },

    setLanguage: async (_sessionId: string, _language: string) => {
      return true;
    },
  };
};
