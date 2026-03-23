import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import Ajv from "ajv";
import semver from "semver";
import { skillManifestSchema } from "./skill-schema";
import type { SkillManifest, SkillRecord } from "./types";

export class SkillRegistry {
  private readonly ajv = new Ajv();
  private readonly validate = this.ajv.compile(skillManifestSchema);
  private records = new Map<string, SkillRecord>();

  constructor(private readonly skillsDir: string) {}

  load(): SkillRecord[] {
    this.records = new Map();
    for (const entry of readdirSync(this.skillsDir)) {
      const directory = join(this.skillsDir, entry);
      if (!statSync(directory).isDirectory()) {
        continue;
      }
      const manifestPath = join(directory, "skill.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as SkillManifest;
      if (!this.validate(manifest)) {
        throw new Error(`Invalid skill manifest for ${entry}`);
      }
      if (!semver.valid(manifest.version)) {
        throw new Error(`Invalid version for ${manifest.name}`);
      }
      this.records.set(manifest.name, { manifest, directory });
    }

    return this.list();
  }

  list(): SkillRecord[] {
    return [...this.records.values()].sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
  }

  get(name: string): SkillRecord {
    const record = this.records.get(name);
    if (!record) {
      throw new Error(`Unknown skill: ${name}`);
    }
    return record;
  }

  validateManifest(manifest: SkillManifest): void {
    if (!this.validate(manifest)) {
      throw new Error("Invalid skill manifest");
    }
    if (!semver.valid(manifest.version)) {
      throw new Error(`Invalid version for ${manifest.name}`);
    }
  }
}
