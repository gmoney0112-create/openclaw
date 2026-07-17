import { describe, expect, it } from "vitest";
import {
  buildApprovalInteractiveReplyFromActionDescriptors,
  buildExecApprovalCommandCustomId,
  parseExecApprovalCommandText,
} from "./exec-approval-reply.js";

describe("buildExecApprovalCommandCustomId / parseExecApprovalCommandText", () => {
  it("round-trips an approval id and decision through encode/decode", () => {
    for (const decision of ["allow-once", "allow-always", "deny"] as const) {
      const customId = buildExecApprovalCommandCustomId("req-1", decision);
      expect(parseExecApprovalCommandText(customId)).toEqual({
        approvalId: "req-1",
        decision,
      });
    }
  });

  it("round-trips approval ids containing reserved characters (e.g. plugin: prefix)", () => {
    const customId = buildExecApprovalCommandCustomId("plugin:abc:123", "deny");
    expect(parseExecApprovalCommandText(customId)).toEqual({
      approvalId: "plugin:abc:123",
      decision: "deny",
    });
  });

  it("returns null for unrelated callback data (e.g. plugin-binding approval callbacks)", () => {
    expect(parseExecApprovalCommandText("pluginbind:abc:o")).toBeNull();
    expect(parseExecApprovalCommandText("codexapp:resume:thread-1")).toBeNull();
    expect(parseExecApprovalCommandText("")).toBeNull();
  });
});

describe("buildApprovalInteractiveReplyFromActionDescriptors", () => {
  it("builds one button per action with decision-derived style", () => {
    const reply = buildApprovalInteractiveReplyFromActionDescriptors([
      { id: "req-1", label: "Allow Once", decision: "allow-once" },
      { id: "req-1", label: "Always Allow", decision: "allow-always" },
      { id: "req-1", label: "Deny", decision: "deny" },
    ]);
    expect(reply.blocks).toHaveLength(1);
    const block = reply.blocks[0];
    expect(block?.type).toBe("buttons");
    if (block?.type !== "buttons") {
      throw new Error("expected buttons block");
    }
    expect(block.buttons.map((b) => b.style)).toEqual(["success", "primary", "danger"]);
    const decoded = block.buttons.map((b) => parseExecApprovalCommandText(b.value));
    expect(decoded).toEqual([
      { approvalId: "req-1", decision: "allow-once" },
      { approvalId: "req-1", decision: "allow-always" },
      { approvalId: "req-1", decision: "deny" },
    ]);
  });
});
