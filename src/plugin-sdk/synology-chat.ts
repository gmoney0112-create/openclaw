// Narrow plugin-sdk surface for the bundled synology-chat plugin.
// Keep this list additive and scoped to symbols used under extensions/synology-chat.

export { setAccountEnabledInConfigSection } from "../channels/plugins/config-helpers.js";
export { buildChannelConfigSchema } from "./channel-plugin-common.js";
export type { ChannelSetupAdapter } from "../channels/plugins/types.adapters.js";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
  requestBodyErrorToText,
} from "../infra/http-body.js";
export { emptyPluginConfigSchema } from "../plugins/config-schema.js";
export { registerPluginHttpRoute } from "../plugins/http-registry.js";
export type { OpenClawConfig } from "../config/config.js";
export type { PluginRuntime } from "./core.js";
export type { OpenClawPluginApi } from "./core.js";
export { DEFAULT_ACCOUNT_ID } from "../routing/session-key.js";
export type { FixedWindowRateLimiter } from "./webhook-memory-guards.js";
export { createFixedWindowRateLimiter } from "./webhook-memory-guards.js";
export {
  synologyChatSetupAdapter,
  synologyChatSetupWizard,
} from "../../extensions/synology-chat/setup-api.js";
