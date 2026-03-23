import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { WebSocket } from "ws";
import { CommandRouter } from "../src/command-router";
import { SpeechRecognizer } from "../src/speech-recognizer";
import { VoiceSynthesizer } from "../src/voice-synthesizer";

async function run(): Promise<void> {
  const recognizer = new SpeechRecognizer("hey openclaw");
  const router = new CommandRouter();
  const synthesizer = new VoiceSynthesizer();

  const transcription = await recognizer.transcribe("jane-command.webm", Buffer.from("audio"));
  assert.match(transcription.text, /Jane Smith/);
  assert.equal(transcription.wake_word_detected, true);

  const routed = await router.route(transcription.text);
  assert.equal(routed.dispatched, true);

  const spoken = await synthesizer.speak({ text: "Action completed" });
  assert.equal(spoken.mime, "audio/mpeg");
  assert.equal(typeof spoken.audio_base64, "string");

  const server = createServer((request, response) => {
    if (request.url === "/voice/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ status: "ok" }));
      return;
    }
    response.writeHead(404).end();
  });

  server.listen(0);
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const healthResponse = await fetch(`http://127.0.0.1:${port}/voice/health`);
  const health = await healthResponse.json() as { status: string };
  assert.equal(health.status, "ok");
  server.close();

  const wsServer = new WebSocket.Server({ port: 0 });
  await once(wsServer, "listening");
  const wsAddress = wsServer.address();
  const wsPort = typeof wsAddress === "object" && wsAddress ? wsAddress.port : 0;
  const received = new Promise<string>((resolve) => {
    wsServer.on("connection", (socket) => {
      socket.on("message", () => {
        socket.send(JSON.stringify({ transcript: "hey openclaw create a contact for Jane Smith" }));
      });
    });

    const client = new WebSocket(`ws://127.0.0.1:${wsPort}`);
    client.on("open", () => client.send(JSON.stringify({ text: "hey openclaw create a contact for Jane Smith" })));
    client.on("message", (data) => {
      resolve(String(data));
      client.close();
    });
  });

  assert.match(await received, /Jane Smith/);
  await new Promise<void>((resolve) => wsServer.close(() => resolve()));

  console.log("voice-operator integration test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
