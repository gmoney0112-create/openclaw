import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { FileManager } from "../src/file-manager";
import { ProcessRunner } from "../src/process-runner";
import { SafetyGuard } from "../src/safety";
import { ScreenController } from "../src/screen-controller";
import { ScriptEngine } from "../src/script-engine";

async function run(): Promise<void> {
  const approvedDir = resolve(__dirname, "../approved");
  mkdirSync(approvedDir, { recursive: true });
  const safety = new SafetyGuard([approvedDir], ["powershell.exe", "notepad.exe"]);
  const fileManager = new FileManager(safety);
  const processRunner = new ProcessRunner(safety);
  const screenController = new ScreenController();
  const scriptEngine = new ScriptEngine();

  const filePath = resolve(approvedDir, "test.txt");
  await fileManager.handle({ action: "write_file", path: filePath, content: "hello world" });
  const readResult = await fileManager.handle({ action: "read_file", path: filePath });
  assert.equal(readResult.content, "hello world");
  const deleteResult = await fileManager.handle({ action: "delete_file", path: filePath });
  assert.equal(deleteResult.deleted, true);

  await assert.rejects(
    () => fileManager.handle({ action: "write_file", path: "C:\\not-approved\\test.txt", content: "nope" }),
    /outside approved directories/i
  );

  const screenshot = await screenController.handle({ action: "screenshot" });
  assert.equal(screenshot.mime, "image/png");
  assert.equal(typeof screenshot.data, "string");

  const scriptResult = await scriptEngine.run({ shell: "powershell", command: "Write-Output 'ok'" });
  assert.match(String(scriptResult.stdout), /ok/);

  const processResult = await processRunner.handle({ action: "list_processes" });
  assert.equal(Array.isArray(processResult.processes), true);

  console.log("os-controller integration test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
