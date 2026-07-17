// Import from each extension's public api.js/runtime-api.js barrels, not index.js:
// index.js's default export is the wrapped plugin-loader entry (defineBundledChannelEntry
// result), not the raw named ChannelPlugin/setRuntime symbols this module needs. See
// extensions/CLAUDE.md: "If core or core tests need a bundled plugin helper, export it
// from api.ts first instead of letting them deep-import extension internals."
import { bluebubblesPlugin } from "../../../extensions/bluebubbles/api.js";
import { discordPlugin, discordSetupPlugin } from "../../../extensions/discord/api.js";
import { setDiscordRuntime } from "../../../extensions/discord/runtime-api.js";
import { feishuPlugin } from "../../../extensions/feishu/api.js";
import { imessagePlugin, imessageSetupPlugin } from "../../../extensions/imessage/api.js";
import { ircPlugin } from "../../../extensions/irc/api.js";
import { linePlugin, lineSetupPlugin } from "../../../extensions/line/api.js";
import { setLineRuntime } from "../../../extensions/line/runtime-api.js";
import { mattermostPlugin } from "../../../extensions/mattermost/channel-plugin-api.js";
import { nextcloudTalkPlugin } from "../../../extensions/nextcloud-talk/api.js";
import { signalPlugin, signalSetupPlugin } from "../../../extensions/signal/api.js";
import { slackPlugin, slackSetupPlugin } from "../../../extensions/slack/api.js";
import { synologyChatPlugin } from "../../../extensions/synology-chat/api.js";
import { telegramPlugin, telegramSetupPlugin } from "../../../extensions/telegram/api.js";
import { setTelegramRuntime } from "../../../extensions/telegram/runtime-api.js";
import { whatsappPlugin, whatsappSetupPlugin } from "../../../extensions/whatsapp/api.js";
import { zaloPlugin } from "../../../extensions/zalo/api.js";
import type { ChannelId, ChannelPlugin } from "./types.js";

export const bundledChannelPlugins = [
  bluebubblesPlugin,
  discordPlugin,
  feishuPlugin,
  imessagePlugin,
  ircPlugin,
  linePlugin,
  mattermostPlugin,
  nextcloudTalkPlugin,
  signalPlugin,
  slackPlugin,
  synologyChatPlugin,
  telegramPlugin,
  whatsappPlugin,
  zaloPlugin,
] as ChannelPlugin[];

export const bundledChannelSetupPlugins = [
  telegramSetupPlugin,
  whatsappSetupPlugin,
  discordSetupPlugin,
  ircPlugin,
  slackSetupPlugin,
  signalSetupPlugin,
  imessageSetupPlugin,
  lineSetupPlugin,
] as ChannelPlugin[];

const bundledChannelPluginsById = new Map(
  bundledChannelPlugins.map((plugin) => [plugin.id, plugin] as const),
);

export function getBundledChannelPlugin(id: ChannelId): ChannelPlugin | undefined {
  return bundledChannelPluginsById.get(id);
}

export function requireBundledChannelPlugin(id: ChannelId): ChannelPlugin {
  const plugin = getBundledChannelPlugin(id);
  if (!plugin) {
    throw new Error(`missing bundled channel plugin: ${id}`);
  }
  return plugin;
}

export const bundledChannelRuntimeSetters = {
  setDiscordRuntime,
  setLineRuntime,
  setTelegramRuntime,
};
