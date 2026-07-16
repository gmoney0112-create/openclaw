import type { MsgContext } from "./templating.js";

function formatMediaAttachedLine(params: {
  path: string;
  url?: string;
  type?: string;
  index?: number;
  total?: number;
}): string {
  const prefix =
    typeof params.index === "number" && typeof params.total === "number"
      ? `[media attached ${params.index}/${params.total}: `
      : "[media attached: ";
  const typePart = params.type?.trim() ? ` (${params.type.trim()})` : "";
  const urlRaw = params.url?.trim();
  const urlPart = urlRaw ? ` | ${urlRaw}` : "";
  return `${prefix}${params.path}${typePart}${urlPart}]`;
}

const AUDIO_EXTENSIONS = new Set([
  ".ogg",
  ".opus",
  ".mp3",
  ".m4a",
  ".wav",
  ".webm",
  ".flac",
  ".aac",
  ".wma",
  ".aiff",
  ".alac",
  ".oga",
]);

function isAudioPath(path: string | undefined): boolean {
  if (!path) {
    return false;
  }
  const lower = path.toLowerCase();
  for (const ext of AUDIO_EXTENSIONS) {
    if (lower.endsWith(ext)) {
      return true;
    }
  }
  return false;
}

function isPdfAttachment(path: string | undefined, type: string | undefined): boolean {
  const normalizedType = type?.toLowerCase().trim();
  if (normalizedType === "application/pdf") {
    return true;
  }
  return Boolean(path?.toLowerCase().endsWith(".pdf"));
}

function resolveFileName(filePath: string | undefined): string {
  if (!filePath) {
    return "document.pdf";
  }
  const parts = filePath.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] || "document.pdf";
}

async function summarizePdfAttachment(params: {
  path: string;
  type?: string;
}): Promise<string | undefined> {
  const serviceBase = (process.env.STRATEGY_SERVICE_URL || "http://127.0.0.1:8011").replace(
    /\/+$/,
    "",
  );
  try {
    const fs = await import("node:fs/promises");
    const data = await fs.readFile(params.path);
    const filename = resolveFileName(params.path);
    const form = new FormData();
    form.set(
      "file",
      new Blob([data], { type: params.type?.trim() || "application/pdf" }),
      filename,
    );
    form.set(
      "prompt",
      "Summarize this PDF for the agent. Include the most important exact text when it is short.",
    );
    const response = await fetch(`${serviceBase}/pdf/summarize`, {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      return undefined;
    }
    const payload = (await response.json()) as { doc_id?: unknown; summary?: unknown };
    const summary = typeof payload.summary === "string" ? payload.summary.trim() : "";
    if (!summary) {
      return undefined;
    }
    const docId = typeof payload.doc_id === "string" ? payload.doc_id : undefined;
    return [
      `PDF attachment parsed automatically: ${filename}`,
      docId ? `Document ID: ${docId}` : undefined,
      summary,
    ]
      .filter(Boolean)
      .join("\n");
  } catch {
    return undefined;
  }
}

export async function buildInboundMediaNote(ctx: MsgContext): Promise<string | undefined> {
  const suppressed = new Set<number>();
  const transcribedAudioIndices = new Set<number>();
  if (Array.isArray(ctx.MediaUnderstanding)) {
    for (const output of ctx.MediaUnderstanding) {
      suppressed.add(output.attachmentIndex);
      if (output.kind === "audio.transcription") {
        transcribedAudioIndices.add(output.attachmentIndex);
      }
    }
  }
  if (Array.isArray(ctx.MediaUnderstandingDecisions)) {
    for (const decision of ctx.MediaUnderstandingDecisions) {
      if (decision.outcome !== "success") {
        continue;
      }
      for (const attachment of decision.attachments) {
        if (attachment.chosen?.outcome === "success") {
          suppressed.add(attachment.attachmentIndex);
          if (decision.capability === "audio") {
            transcribedAudioIndices.add(attachment.attachmentIndex);
          }
        }
      }
    }
  }
  const pathsFromArray = Array.isArray(ctx.MediaPaths) ? ctx.MediaPaths : undefined;
  const paths =
    pathsFromArray && pathsFromArray.length > 0
      ? pathsFromArray
      : ctx.MediaPath?.trim()
        ? [ctx.MediaPath.trim()]
        : [];
  if (paths.length === 0) {
    return undefined;
  }

  const urls =
    Array.isArray(ctx.MediaUrls) && ctx.MediaUrls.length === paths.length
      ? ctx.MediaUrls
      : undefined;
  const types =
    Array.isArray(ctx.MediaTypes) && ctx.MediaTypes.length === paths.length
      ? ctx.MediaTypes
      : undefined;
  const hasTranscript = Boolean(ctx.Transcript?.trim());
  const canStripSingleAttachmentByTranscript = hasTranscript && paths.length === 1;

  const entries = paths
    .map((entry, index) => ({
      path: entry ?? "",
      type: types?.[index] ?? ctx.MediaType,
      url: urls?.[index] ?? ctx.MediaUrl,
      index,
    }))
    .filter((entry) => {
      if (suppressed.has(entry.index)) {
        return false;
      }
      const hasPerEntryType = types !== undefined;
      const isAudioByMime = hasPerEntryType && entry.type?.toLowerCase().startsWith("audio/");
      const isAudioEntry = isAudioPath(entry.path) || isAudioByMime;
      if (!isAudioEntry) {
        return true;
      }
      if (
        transcribedAudioIndices.has(entry.index) ||
        (canStripSingleAttachmentByTranscript && entry.index === 0)
      ) {
        return false;
      }
      return true;
    });
  if (entries.length === 0) {
    return undefined;
  }

  const renderedEntries: string[] = [];
  for (const [idx, entry] of entries.entries()) {
    let rendered: string | undefined;
    if (isPdfAttachment(entry.path, entry.type)) {
      rendered = await summarizePdfAttachment({ path: entry.path, type: entry.type });
    }
    if (!rendered) {
      rendered = formatMediaAttachedLine({
        path: entry.path,
        type: entry.type,
        url: entry.url,
        index: entries.length > 1 ? idx + 1 : undefined,
        total: entries.length > 1 ? entries.length : undefined,
      });
    }
    renderedEntries.push(rendered);
  }
  if (renderedEntries.length === 0) {
    return undefined;
  }
  return renderedEntries.join("\n\n");
}
