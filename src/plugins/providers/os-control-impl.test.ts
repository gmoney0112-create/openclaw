import { describe, it, expect } from "vitest";
import { createMvpOSAutomationProvider } from "./os-control-impl.js";

describe("OS Control Provider", () => {
  const provider = createMvpOSAutomationProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("os-control-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP OS Automation (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("command-execution");
    expect(provider.capabilities).toContain("file-operations");
  });

  it("should check if command can execute", async () => {
    const canExecute = await provider.canExecute({
      type: "run",
      command: "echo test",
    });

    expect(typeof canExecute).toBe("boolean");
  });

  it("should return true for permission check", async () => {
    const result = await provider.canExecute({
      type: "run",
      command: "ls -la",
    });

    expect(result).toBe(true);
  });

  it("should execute run command", async () => {
    const result = await provider.execute({
      type: "run",
      command: "echo hello",
    });

    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });

  it("should execute file operation command", async () => {
    const result = await provider.execute({
      type: "file-op",
      command: "create file.txt",
    });

    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });

  it("should include timestamp in execution result", async () => {
    const result = await provider.execute({
      type: "run",
      command: "test",
    });

    expect(result.timestamp).toBeGreaterThan(0);
  });

  it("should not include error on success", async () => {
    const result = await provider.execute({
      type: "run",
      command: "success",
    });

    expect(result.error).toBeUndefined();
  });

  it("should handle run type commands", async () => {
    const result = await provider.execute({
      type: "run",
      command: "npm test",
    });

    expect(result.success).toBe(true);
  });

  it("should handle file-op type commands", async () => {
    const result = await provider.execute({
      type: "file-op",
      command: "mkdir new-directory",
    });

    expect(result.success).toBe(true);
  });

  it("should handle unknown command types", async () => {
    const result = await provider.execute({
      type: "unknown" as unknown as typeof provider extends { execute: (cmd: infer C) => unknown } ? C extends { type: infer T } ? T : never : never,
      command: "test",
    });

    expect(result.success).toBe(true);
  });

  it("should provide command output", async () => {
    const result = await provider.execute({
      type: "run",
      command: "echo output",
    });

    expect(result.output).toContain("successfully");
  });

  it("should maintain execution state", async () => {
    const result1 = await provider.execute({
      type: "run",
      command: "cmd1",
    });
    const result2 = await provider.execute({
      type: "run",
      command: "cmd2",
    });

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  it("should execute multiple commands sequentially", async () => {
    const commands = [
      { type: "run" as const, command: "echo 1" },
      { type: "file-op" as const, command: "touch file" },
      { type: "run" as const, command: "ls" },
    ];

    for (const cmd of commands) {
      const result = await provider.execute(cmd);
      expect(result.success).toBe(true);
    }
  });
});
