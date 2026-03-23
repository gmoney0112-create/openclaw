import type { AnalyzeResult } from "./types";

export class CodeAnalyzer {
  analyze(log: string): AnalyzeResult {
    const match = log.match(/([A-Za-z]:\\[^:\r\n]+|[^:\r\n]+\.(?:ts|js|py)):(\d+):?\d*/);
    const errorMatch = log.match(/(SyntaxError|TypeError|ReferenceError|Error):\s*(.+)/);

    return {
      file: match?.[1] ?? "unknown",
      line: Number(match?.[2] ?? "1"),
      error: errorMatch ? `${errorMatch[1]}: ${errorMatch[2]}` : log.trim()
    };
  }
}
