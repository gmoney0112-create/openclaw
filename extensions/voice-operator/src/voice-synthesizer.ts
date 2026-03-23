import type { SpeakRequest, SpeakResult } from "./types";

const SILENT_MP3_BASE64 =
  "SUQzAwAAAAAAT1RJVDIAAAAZAAAASGV5IE9wZW5DbGF3IHZvaWNlIHJlc3BvbnNlAAAA";

export class VoiceSynthesizer {
  async speak(request: SpeakRequest): Promise<SpeakResult> {
    return {
      mime: "audio/mpeg",
      audio_base64: SILENT_MP3_BASE64,
      provider: request.text ? "mock-elevenlabs" : "mock-elevenlabs"
    };
  }
}
