import { definePluginEntry, type OpenClawPluginApi } from "./api.js";
import { createChatHandler } from "./src/chat-handler.js";
import { buildOfferTiers, type OfferUrls } from "./src/offer-ladder.js";

type PluginConfig = {
  anthropicApiKey: string;
  allowedOrigins?: string[];
  offerUrls?: OfferUrls;
};

export default definePluginEntry({
  id: "soul-prosperity",
  name: "Soul Prosperity",
  description: "AI-powered offer-ladder sales bot for the Soul Prosperity book series.",

  async register(api: OpenClawPluginApi) {
    const cfg = api.pluginConfig as PluginConfig;

    if (!cfg?.anthropicApiKey) {
      api.logger.warn?.("[soul-prosperity] anthropicApiKey is not configured — skipping");
      return;
    }

    const tiers = buildOfferTiers(cfg.offerUrls ?? {});
    const allowedOrigins = cfg.allowedOrigins ?? ["https://gmoney0112-create.github.io"];

    const handler = createChatHandler({ anthropicApiKey: cfg.anthropicApiKey, allowedOrigins, tiers });

    api.registerHttpRoute({
      path: "/plugins/soul-prosperity/chat",
      auth: "plugin",
      match: "exact",
      handler,
    });

    api.logger.info?.(
      `[soul-prosperity] chat endpoint registered at /plugins/soul-prosperity/chat`,
    );
  },
});
