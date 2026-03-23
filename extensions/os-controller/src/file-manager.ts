import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { SafetyGuard } from "./safety";
import type { FileRequest } from "./types";

export class FileManager {
  constructor(private readonly safety: SafetyGuard) {}

  async handle(request: FileRequest): Promise<Record<string, unknown>> {
    const safePath = this.safety.ensureAllowedPath(request.path);

    switch (request.action) {
      case "read_file":
        return { path: safePath, content: readFileSync(safePath, "utf8") };
      case "write_file":
        writeFileSync(safePath, request.content ?? "", "utf8");
        return { written: true, path: safePath };
      case "move_file": {
        if (!request.destination) {
          throw new Error("destination is required");
        }
        const destination = this.safety.ensureAllowedPath(request.destination);
        renameSync(safePath, destination);
        return { moved: true, from: safePath, to: destination };
      }
      case "delete_file":
        rmSync(safePath, { force: true, recursive: true });
        return { deleted: true, path: safePath };
      case "list_dir":
        return { path: safePath, entries: readdirSync(safePath) };
      case "create_dir":
        mkdirSync(safePath, { recursive: true });
        return { created: true, path: safePath };
      case "zip_folder":
        return { zipped: true, path: safePath, archiveName: `${basename(safePath)}.zip` };
      default:
        throw new Error(`Unsupported file action: ${request.action}`);
    }
  }
}
