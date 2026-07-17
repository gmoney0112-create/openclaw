import {
  dispatchPluginInteractiveHandler,
  type PluginInteractiveTelegramHandlerContext,
  type PluginInteractiveTelegramHandlerRegistration,
} from "openclaw/plugin-sdk/plugin-runtime";

export type TelegramInteractiveButtons = Array<
  Array<{ text: string; callback_data: string; style?: "danger" | "success" | "primary" }>
>;

/** Full context a plugin's registered handler receives (post-dispatch). */
export type TelegramInteractiveHandlerContext = PluginInteractiveTelegramHandlerContext;

/** Registration shape plugins pass to registerPluginInteractiveHandler for telegram. */
export type TelegramInteractiveHandlerRegistration = PluginInteractiveTelegramHandlerRegistration;

export type TelegramInteractiveDispatchContext = {
  accountId: string;
  callbackId: string;
  conversationId: string;
  parentConversationId?: string;
  senderId?: string;
  senderUsername?: string;
  threadId?: number;
  isGroup: boolean;
  isForum: boolean;
  auth: {
    isAuthorizedSender: boolean;
  };
  callbackMessage: {
    messageId: number;
    chatId: string;
    messageText?: string;
  };
};

export async function dispatchTelegramPluginInteractiveHandler(params: {
  data: string;
  callbackId: string;
  ctx: TelegramInteractiveDispatchContext;
  respond: {
    reply: (params: { text: string; buttons?: TelegramInteractiveButtons }) => Promise<void>;
    editMessage: (params: { text: string; buttons?: TelegramInteractiveButtons }) => Promise<void>;
    editButtons: (params: { buttons: TelegramInteractiveButtons }) => Promise<void>;
    clearButtons: () => Promise<void>;
    deleteMessage: () => Promise<void>;
  };
}) {
  return dispatchPluginInteractiveHandler({
    channel: "telegram",
    data: params.data,
    callbackId: params.callbackId,
    ctx: params.ctx,
    respond: params.respond,
  });
}
