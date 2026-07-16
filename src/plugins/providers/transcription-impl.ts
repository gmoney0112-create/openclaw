// MVP Implementation: Realtime Transcription Provider
import type { RealtimeTranscriptionProviderPlugin } from "../plugin-sdk/realtime-transcription.js";

export const createMvpTranscriptionProvider = (): RealtimeTranscriptionProviderPlugin => {
  return {
    id: "transcription-mvp-ref",
    label: "MVP Transcription (Reference)",
    capabilities: ["speech-to-text", "real-time-streaming"],

    transcribe: async (_audioBuffer: ArrayBuffer) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        text: "Sample transcribed text from audio input.",
        confidence: 0.92,
        language: "en",
        duration: 5,
      };
    },

    startLiveTranscription: async () => {
      return {
        sessionId: `session-${Date.now()}`,
        status: "active",
      };
    },

    stopLiveTranscription: async (sessionId: string) => {
      return {
        sessionId,
        finalTranscript: "Complete transcription of live session.",
        wordCount: 150,
        duration: 60,
      };
    },
  };
};
