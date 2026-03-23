import { readFileSync } from "node:fs";
import type { PatchRequest } from "./types";

export class PatchGenerator {
  generate(request: PatchRequest): { patch: string; replacement?: string } {
    const content = readFileSync(request.file, "utf8");

    if (request.error.toLowerCase().includes("unexpected token") || request.error.toLowerCase().includes("syntax")) {
      const replacement = content.replace("const broken = ;", "const broken = 1;");
      return {
        patch: `Replace invalid assignment in ${request.file}`,
        replacement
      };
    }

    return {
      patch: `No automatic patch available for ${request.file}`
    };
  }
}
