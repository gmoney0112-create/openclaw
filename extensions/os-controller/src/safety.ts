import { mkdirSync, existsSync } from "node:fs";
import { dirname, normalize, resolve } from "node:path";

export class SafetyGuard {
  constructor(
    private readonly allowedDirectories: string[],
    private readonly allowedApps: string[]
  ) {
    for (const directory of allowedDirectories) {
      if (!existsSync(directory)) {
        mkdirSync(directory, { recursive: true });
      }
    }
  }

  ensureAllowedPath(path: string): string {
    const resolved = resolve(path);
    const normalized = normalize(resolved).toLowerCase();
    const allowed = this.allowedDirectories.some((directory) =>
      normalized.startsWith(normalize(resolve(directory)).toLowerCase())
    );

    if (!allowed) {
      throw new Error(`Path is outside approved directories: ${path}`);
    }

    mkdirSync(dirname(resolved), { recursive: true });
    return resolved;
  }

  ensureAllowedApp(app: string): string {
    const normalized = app.toLowerCase();
    const allowed = this.allowedApps.some((candidate) => candidate.toLowerCase() === normalized);
    if (!allowed) {
      throw new Error(`App is not allowlisted: ${app}`);
    }
    return app;
  }
}
