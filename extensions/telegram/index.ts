import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";
import { telegramPlugin } from "./channel-plugin-api.js";
import { setTelegramRuntime } from "./runtime-api.js";

// Use static imports + value-based entry so the bundler wires telegramPlugin and
// setTelegramRuntime into the shared native ESM graph. The previous
// defineBundledChannelEntry path loaded these via jiti at runtime, which (a)
// resolved "./channel-plugin-api.js" against the hoisted chunk location instead of
// this extension dir, and (b) re-instantiated the shared chunks in jiti's separate
// registry (OOM). Passing the imported values avoids both.
export default defineChannelPluginEntry({
  id: "telegram",
  name: "Telegram",
  description: "Telegram channel plugin",
  plugin: telegramPlugin,
  setRuntime: setTelegramRuntime,
});
