import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import config from "./config.json";
import { SkillInstaller } from "./src/skill-installer";
import { SkillRegistry } from "./src/skill-registry";
import { SkillRunner } from "./src/skill-runner";
import type { SkillInstallerRequest, SkillRunRequest } from "./src/types";

const port = Number(process.env.PORT ?? config.port ?? 3105);
const skillsDir = resolve(__dirname, config.skills_dir);
const registry = new SkillRegistry(skillsDir);
registry.load();
const installer = new SkillInstaller(skillsDir, registry);
const runner = new SkillRunner(registry);

async function readJson<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? (JSON.parse(raw) as T) : ({} as T);
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

    if (method === "GET" && url.pathname === "/skills/catalog") {
      sendJson(response, 200, registry.list().map((record) => record.manifest));
      return;
    }

    if (method === "POST" && url.pathname === "/skills/install") {
      const body = await readJson<SkillInstallerRequest>(request);
      const result = await installer.install(body);
      sendJson(response, 200, result);
      return;
    }

    if (method === "POST" && url.pathname === "/skills/run") {
      const body = await readJson<SkillRunRequest>(request);
      const result = await runner.run(body);
      sendJson(response, 200, result);
      return;
    }

    if (method === "GET" && url.pathname === "/skills/health") {
      sendJson(response, 200, {
        status: "ok",
        skills_dir: skillsDir,
        skills_dir_exists: existsSync(skillsDir),
        skill_count: registry.list().length
      });
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendJson(response, 500, { error: message });
  }
});

server.listen(port, () => {
  console.log(`Skill loader listening on port ${port}`);
});

export { installer, registry, runner, server, skillsDir };
