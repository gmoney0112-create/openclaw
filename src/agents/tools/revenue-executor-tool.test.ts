import { describe, expect, it, vi } from "vitest";
import { createRevenueExecutorTool } from "./revenue-executor-tool.js";

describe("revenue_executor tool", () => {
  it("calls /revenue/actions for actions", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ actions: ["llm_complete"] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const tool = createRevenueExecutorTool();
    const result = await tool.execute?.("tool-call-1", { action: "actions" }, undefined, undefined);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3110/revenue/actions",
      expect.objectContaining({ method: "GET" }),
    );
    expect((result?.details as { ok?: boolean })?.ok).toBe(true);
  });

  it("posts execute payload to /revenue/execute", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ action_result: { status: "ok" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const tool = createRevenueExecutorTool();
    await tool.execute?.(
      "tool-call-2",
      {
        action: "execute",
        revenueAction: "workflow_trigger",
        sessionId: "s-1",
        payload: {
          workflow_name: "create_ghl_contact",
          payload: { email: "jane@example.com" },
        },
      },
      undefined,
      undefined,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3110/revenue/execute",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    const sentBody = (fetchMock.mock.calls[0]?.[1] as { body?: string } | undefined)?.body;
    expect(sentBody).toContain("workflow_trigger");
    expect(sentBody).toContain("create_ghl_contact");
  });
});
