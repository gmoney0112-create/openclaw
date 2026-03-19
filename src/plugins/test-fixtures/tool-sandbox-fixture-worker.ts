import http from "node:http";
import type { AgentToolResult } from "@mariozechner/pi-agent-core";
import {
  installSandboxNetworkGuards,
  serializeSandboxError,
  type SandboxWirePayload,
} from "../tool-sandbox.js";

type FixturePayload = SandboxWirePayload<{
  mode: "env" | "timeout" | "http-block";
}>;

function send(message: unknown) {
  if (typeof process.send === "function") {
    process.send(message);
  }
}

function jsonResult(payload: unknown): AgentToolResult<unknown> {
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
    details: payload,
  };
}

process.on("message", async (message: FixturePayload) => {
  installSandboxNetworkGuards(message.allowedHosts);
  try {
    if (message.payload.mode === "timeout") {
      await new Promise(() => undefined);
      return;
    }
    if (message.payload.mode === "env") {
      send({
        type: "result",
        payload: jsonResult({
          gha: process.env.GHL_API_KEY ?? null,
        }),
      });
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const req = http.get("http://api.telegram.org/");
      req.on("response", () => resolve());
      req.on("error", reject);
    });
    send({ type: "result", payload: jsonResult({ ok: true }) });
  } catch (error) {
    send({ type: "error", error: serializeSandboxError(error) });
  } finally {
    process.disconnect?.();
  }
});
