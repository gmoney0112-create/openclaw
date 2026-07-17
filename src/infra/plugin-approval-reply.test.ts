import { describe, expect, it } from "vitest";
import { buildPluginApprovalPendingReplyPayload } from "./plugin-approval-reply.js";

describe("buildPluginApprovalPendingReplyPayload", () => {
  it("renders title, description, severity, and plugin name", () => {
    const payload = buildPluginApprovalPendingReplyPayload({
      request: {
        id: "plugin:abc123",
        request: {
          title: "Send an email",
          description: "This plugin wants to send an email on your behalf.",
          severity: "warn",
          pluginName: "mailer",
        },
        createdAtMs: 0,
        expiresAtMs: 60_000,
      },
      nowMs: 0,
    });
    expect(payload.text).toContain("Send an email");
    expect(payload.text).toContain("This plugin wants to send an email on your behalf.");
    expect(payload.text).toContain("Severity: warn");
    expect(payload.text).toContain("Plugin: mailer");
    expect(payload.text).toContain("Expires in: 60s");
    expect(payload.text).toContain("plugin:abc123");
  });

  it("omits optional fields when absent", () => {
    const payload = buildPluginApprovalPendingReplyPayload({
      request: {
        id: "plugin:abc123",
        request: { title: "Do a thing" },
        createdAtMs: 0,
        expiresAtMs: 60_000,
      },
      nowMs: 0,
    });
    expect(payload.text).toContain("Do a thing");
    expect(payload.text).not.toContain("Severity:");
    expect(payload.text).not.toContain("Plugin:");
  });
});
