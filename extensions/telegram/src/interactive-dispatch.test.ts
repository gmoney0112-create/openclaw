import { describe, expect, it, vi } from "vitest";

const { dispatchPluginInteractiveHandlerMock } = vi.hoisted(() => ({
  dispatchPluginInteractiveHandlerMock: vi.fn(),
}));
vi.mock("openclaw/plugin-sdk/plugin-runtime", () => ({
  dispatchPluginInteractiveHandler: dispatchPluginInteractiveHandlerMock,
}));

import { dispatchTelegramPluginInteractiveHandler } from "./interactive-dispatch.js";

describe("dispatchTelegramPluginInteractiveHandler", () => {
  it("delegates to the real dispatchPluginInteractiveHandler with channel: telegram", async () => {
    dispatchPluginInteractiveHandlerMock.mockResolvedValueOnce({
      matched: true,
      handled: true,
      duplicate: false,
    });
    const respond = {
      reply: vi.fn(),
      editMessage: vi.fn(),
      editButtons: vi.fn(),
      clearButtons: vi.fn(),
      deleteMessage: vi.fn(),
    };
    const ctx = {
      accountId: "acct1",
      callbackId: "cb-1",
      conversationId: "conv-1",
      senderId: "9",
      isGroup: false,
      isForum: false,
      auth: { isAuthorizedSender: true },
      callbackMessage: { messageId: 11, chatId: "1234" },
    };

    const result = await dispatchTelegramPluginInteractiveHandler({
      data: "codexapp:resume:thread-1",
      callbackId: "cb-1",
      ctx,
      respond,
    });

    expect(dispatchPluginInteractiveHandlerMock).toHaveBeenCalledWith({
      channel: "telegram",
      data: "codexapp:resume:thread-1",
      callbackId: "cb-1",
      ctx,
      respond,
    });
    expect(result).toEqual({ matched: true, handled: true, duplicate: false });
  });
});
