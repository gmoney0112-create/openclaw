# Voice Operator

Voice interface service for OpenClaw.

## Features

- Audio upload transcription endpoint
- Text-to-speech endpoint
- WebSocket voice streaming bridge
- Lightweight browser client for mic capture and playback

## Endpoints

- `POST /voice/transcribe`
- `POST /voice/speak`
- `GET /voice/health`
- `GET /voice/client`
- WebSocket `/voice/stream`

## Environment

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `MULTI_AGENT_URL`
