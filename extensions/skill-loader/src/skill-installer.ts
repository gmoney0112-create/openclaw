import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import AdmZip from "adm-zip";
import { SkillRegistry } from "./skill-registry";
import type { SkillInstallerRequest, SkillManifest } from "./types";

const execFileAsync = promisify(execFile);

export class SkillInstaller {
  constructor(
    private readonly skillsDir: string,
    private readonly registry: SkillRegistry
  ) {}

  async install(request: SkillInstallerRequest): Promise<{ installed: true; skill: string }> {
    if (!existsSync(request.zip_path)) {
      throw new Error(`Zip file not found: ${request.zip_path}`);
    }

    const zip = new AdmZip(request.zip_path);
    const firstEntry = zip.getEntries().find((entry) => entry.entryName.endsWith("skill.json"));
    if (!firstEntry) {
      throw new Error("skill.json not found in zip");
    }

    const manifest = JSON.parse(firstEntry.getData().toString("utf8")) as SkillManifest;
    this.registry.validateManifest(manifest);

    const targetDir = join(this.skillsDir, manifest.name);
    mkdirSync(targetDir, { recursive: true });
    zip.extractAllTo(targetDir, true);

    const normalizedManifestPath = existsSync(join(targetDir, "skill.json"))
      ? join(targetDir, "skill.json")
      : join(targetDir, manifest.name, "skill.json");

    const normalizedDir = normalizedManifestPath.replace(/\\skill\.json$/, "");
    const installScript = existsSync(join(normalizedDir, "install.ps1"))
      ? { file: "powershell.exe", args: ["-ExecutionPolicy", "Bypass", "-File", join(normalizedDir, "install.ps1")] }
      : existsSync(join(normalizedDir, "install.sh"))
        ? { file: "bash", args: [join(normalizedDir, "install.sh")] }
        : undefined;

    if (installScript) {
      await execFileAsync(installScript.file, installScript.args, { cwd: normalizedDir });
    }

    this.registry.load();
    return { installed: true, skill: JSON.parse(readFileSync(normalizedManifestPath, "utf8")).name as string };
  }
}
