import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ScriptRequest } from "./types";

const execFileAsync = promisify(execFile);

export class ScriptEngine {
  async run(request: ScriptRequest): Promise<Record<string, unknown>> {
    if (request.shell === "powershell") {
      const { stdout, stderr } = await execFileAsync("powershell.exe", ["-Command", request.command], {
        windowsHide: true
      });
      return { stdout, stderr };
    }

    const { stdout, stderr } = await execFileAsync("bash", ["-lc", request.command]);
    return { stdout, stderr };
  }
}
