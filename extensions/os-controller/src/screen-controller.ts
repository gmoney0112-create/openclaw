import { Buffer } from "node:buffer";
import type { ScreenRequest } from "./types";

const ONE_PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn2tY4AAAAASUVORK5CYII=";

export class ScreenController {
  async handle(request: ScreenRequest): Promise<Record<string, unknown>> {
    switch (request.action) {
      case "screenshot":
        return {
          mime: "image/png",
          data: ONE_PIXEL_PNG_BASE64,
          bytes: Buffer.from(ONE_PIXEL_PNG_BASE64, "base64").length
        };
      case "click_at_coords":
        return { clicked: true, x: request.x ?? 0, y: request.y ?? 0 };
      case "type_text":
        return { typed: true, text: request.text ?? "" };
      case "scroll":
        return { scrolled: true, amount: request.amount ?? 0 };
      case "find_image_on_screen":
        return { found: false, imagePath: request.imagePath ?? null };
      default:
        throw new Error(`Unsupported screen action: ${request.action}`);
    }
  }
}
