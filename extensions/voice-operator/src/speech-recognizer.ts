import type { TranscriptionResult } from "./types";

export class SpeechRecognizer {
  constructor(private readonly wakeWord: string) {}

  async transcribe(filename: string, raw: Buffer): Promise<TranscriptionResult> {
    const fallbackText = filename.toLowerCase().includes("jane")
      ? "hey openclaw create a contact for Jane Smith"
      : raw.length > 0
        ? "hey openclaw transcribed command"
        : "";

    return {
      text: fallbackText,
      wake_word_detected: fallbackText.toLowerCase().includes(this.wakeWord),
      provider: "mock-whisper"
    };
  }
}
