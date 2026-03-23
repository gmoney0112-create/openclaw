import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class TestRunner {
  async run(command = "node", args: string[] = []): Promise<{ passed: boolean; stdout: string; stderr: string }> {
    try {
      const { stdout, stderr } = await execFileAsync(command, args, { windowsHide: true });
      return { passed: true, stdout, stderr };
    } catch (error) {
      const stdout = typeof error === "object" && error && "stdout" in error ? String((error as { stdout?: string }).stdout ?? "") : "";
      const stderr = typeof error === "object" && error && "stderr" in error ? String((error as { stderr?: string }).stderr ?? "") : "";
      return { passed: false, stdout, stderr };
    }
  }
}
