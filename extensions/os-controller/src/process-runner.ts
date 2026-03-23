import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { SafetyGuard } from "./safety";
import type { ProcessRequest } from "./types";

const execFileAsync = promisify(execFile);

export class ProcessRunner {
  constructor(private readonly safety: SafetyGuard) {}

  async handle(request: ProcessRequest): Promise<Record<string, unknown>> {
    switch (request.action) {
      case "run_script":
        return this.runPowerShell(request.command ?? "");
      case "launch_app": {
        if (!request.app) {
          throw new Error("app is required");
        }
        const app = this.safety.ensureAllowedApp(request.app);
        return { launched: true, app };
      }
      case "kill_process":
        return { killed: true, name: request.name ?? null };
      case "list_processes": {
        const result = await this.runPowerShell("Get-Process | Select-Object -First 10 ProcessName,Id | ConvertTo-Json -Compress");
        return { processes: JSON.parse(String(result.stdout ?? "[]")) };
      }
      default:
        throw new Error(`Unsupported process action: ${request.action}`);
    }
  }

  private async runPowerShell(command: string): Promise<Record<string, unknown>> {
    const { stdout, stderr } = await execFileAsync("powershell.exe", ["-Command", command], {
      windowsHide: true
    });

    return {
      stdout,
      stderr
    };
  }
}
