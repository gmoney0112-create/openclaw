import { readFileSync, writeFileSync } from "node:fs";

export class PatchApplicator {
  apply(file: string, replacement?: string): boolean {
    if (!replacement) {
      return false;
    }

    const before = readFileSync(file, "utf8");
    if (before === replacement) {
      return false;
    }

    writeFileSync(file, replacement, "utf8");
    return true;
  }
}
