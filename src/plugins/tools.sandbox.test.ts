import { beforeEach, describe, expect, it, vi } from "vitest";

const loadOpenClawPluginsMock = vi.fn();
const runInSandboxMock = vi.fn();

vi.mock("./loader.js", () => ({
  loadOpenClawPlugins: (params: unknown) => loadOpenClawPluginsMock(params),
}));

vi.mock("./tool-sandbox.js", async () => {
  const actual = await vi.importActual<typeof import("./tool-sandbox.js")>("./tool-sandbox.js");
  return {
    ...actual,
    runInSandbox: (params: unknown) => runInSandboxMock(params),
    resolveSiblingWorkerPath: () => "/tmp/plugin-tool-sandbox-worker.js",
  };
});

let resolvePluginTools: typeof import("./tools.js").resolvePluginTools;
let getPluginToolMeta: typeof import("./tools.js").getPluginToolMeta;

function createContext() {
  return {
    config: {
      plugins: {
        enabled: true,
        load: { paths: ["/tmp/plugin.js"] },
      },
    },
    workspaceDir: "/tmp",
    agentId: "agent-main",
    sessionKey: "main",
  };
}

function makeRegistry() {
  return {
    tools: [
      {
        pluginId: "revenue-executor",
        optional: false,
        source: "/tmp/revenue.js",
        factory: () => [
          {
            name: "create_payment_link",
            description: "Create payment link",
            parameters: { type: "object", properties: { amount: { type: "number" } } },
            execute: vi.fn(),
          },
        ],
      },
    ],
    diagnostics: [],
  };
}

describe("resolvePluginTools sandbox wrapping", () => {
  beforeEach(async () => {
    vi.resetModules();
    loadOpenClawPluginsMock.mockReset();
    runInSandboxMock.mockReset();
    ({ resolvePluginTools, getPluginToolMeta } = await import("./tools.js"));
  });

  it("routes plugin tool execution through the sandbox runner", async () => {
    loadOpenClawPluginsMock.mockReturnValue(makeRegistry());
    runInSandboxMock.mockResolvedValue({
      content: [{ type: "text", text: "sandbox-ok" }],
      details: { ok: true },
    });

    const env = {
      GHL_API_KEY: "ghl-key",
      GHL_READ_API_KEY: "ghl-read-key",
      GHL_LOCATION_ID: "loc-123",
      OPENAI_API_KEY: "openai-key",
      PATH: "/usr/bin",
      HOME: "/home/tester",
    } as NodeJS.ProcessEnv;

    const [tool] = resolvePluginTools({
      context: createContext() as never,
      env,
    });

    const result = await tool!.execute("call-1", { amount: 497 });

    expect(result).toEqual({
      content: [{ type: "text", text: "sandbox-ok" }],
      details: { ok: true },
    });
    expect(runInSandboxMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workerPath: "/tmp/plugin-tool-sandbox-worker.js",
        timeoutMs: 5_000,
        payload: {
          allowedHosts: [
            "api.gohighlevel.com",
            "services.leadconnectorhq.com",
            "api.stripe.com",
          ],
          payload: expect.objectContaining({
            pluginId: "revenue-executor",
            toolName: "create_payment_link",
            toolCallId: "call-1",
            args: { amount: 497 },
            loaderEnv: {
              PATH: "/usr/bin",
              HOME: "/home/tester",
            },
            secrets: {
              GHL_API_KEY: "ghl-key",
              GHL_READ_API_KEY: "ghl-read-key",
              GHL_LOCATION_ID: "loc-123",
              OPENAI_API_KEY: "openai-key",
            },
          }),
        },
      }),
    );
    expect(getPluginToolMeta(tool!)).toEqual({
      pluginId: "revenue-executor",
      optional: false,
    });
  });
});
