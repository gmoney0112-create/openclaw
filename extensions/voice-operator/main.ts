import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { WebSocketServer } from "ws";
import config from "./config.json";
import { CommandRouter } from "./src/command-router";
import { SpeechRecognizer } from "./src/speech-recognizer";
import type { SpeakRequest } from "./src/types";
import { VoiceSynthesizer } from "./src/voice-synthesizer";

const port = Number(process.env.PORT ?? config.port ?? 3108);
const recognizer = new SpeechRecognizer(config.wake_word);
const synthesizer = new VoiceSynthesizer();
const router = new CommandRouter();
const clientHtmlPath = existsSync(resolve(__dirname, "public/client.html"))
  ? resolve(__dirname, "public/client.html")
  : resolve(__dirname, "../public/client.html");
const clientHtml = readFileSync(clientHtmlPath, "utf8");

async function readJson<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? (JSON.parse(raw) as T) : ({} as T);
}

async function readBuffer(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

function parseUrl(request: IncomingMessage): URL {
  return new URL(request.url ?? "/", `http://${request.headers.host ?? `localhost:${port}`}`);
}

const server = createServer(async (request, response) => {
  try {
    const method = request.method ?? "GET";
    const url = parseUrl(request);

    if (method === "POST" && url.pathname === "/voice/transcribe") {
      const audio = await readBuffer(request);
      const filename = request.headers["x-file-name"]?.toString() ?? "audio.webm";
      const result = await recognizer.transcribe(filename, audio);
      sendJson(response, 200, result);
      return;
    }

    if (method === "POST" && url.pathname === "/voice/speak") {
      const body = await readJson<SpeakRequest>(request);
      const result = await synthesizer.speak(body);
      sendJson(response, 200, result);
      return;
    }

    if (method === "GET" && url.pathname === "/voice/client") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(clientHtml);
      return;
    }

    if (method === "GET" && url.pathname === "/voice/health") {
      sendJson(response, 200, {
        status: "ok",
        wake_word: config.wake_word,
        elevenlabs_voice_id: process.env.ELEVENLABS_VOICE_ID ?? null,
        multi_agent_url: process.env.MULTI_AGENT_URL ?? null
      });
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendJson(response, 500, { error: message });
  }
});

const wss = new WebSocketServer({ noServer: true });
wss.on("connection", (socket) => {
  socket.on("message", async (message) => {
    try {
      const payload = JSON.parse(message.toString()) as { text?: string };
      const transcript = payload.text ?? "hey openclaw voice command";
      const routed = await router.route(transcript);
      const spoken = await synthesizer.speak({ text: `Received: ${routed.command ?? transcript}` });
      socket.send(JSON.stringify({
        transcript,
        routed,
        audio_base64: spoken.audio_base64
      }));
    } catch (error) {
      socket.send(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }));
    }
  });
});

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `localhost:${port}`}`);
  if (url.pathname !== "/voice/stream") {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

server.listen(port, () => {
  console.log(`Voice operator listening on port ${port}`);
});

export { server, wss };
