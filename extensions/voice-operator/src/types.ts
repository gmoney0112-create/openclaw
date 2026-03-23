export interface TranscriptionResult {
  text: string;
  wake_word_detected: boolean;
  provider: string;
}

export interface SpeakRequest {
  text: string;
}

export interface SpeakResult {
  mime: string;
  audio_base64: string;
  provider: string;
}
