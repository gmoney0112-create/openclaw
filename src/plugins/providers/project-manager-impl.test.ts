import { describe, it, expect } from "vitest";
import { createMvpProjectManagerProvider } from "./project-manager-impl.js";

describe("Project Manager Provider", () => {
  const provider = createMvpProjectManagerProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("project-manager-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP Project Manager (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("task-planning");
    expect(provider.capabilities).toContain("scheduling");
    expect(provider.capabilities).toContain("progress-tracking");
  });

  it("should create project", async () => {
    const spec = {
      name: "Test Project",
      description: "A test project",
      startDate: Date.now(),
      endDate: Date.now() + 2592000000,
      budget: 50000,
    };

    const result = await provider.createProject(spec);

    expect(result.projectId).toBeDefined();
    expect(typeof result.projectId).toBe("string");
  });

  it("should plan tasks from goals", async () => {
    const goals = ["Implement API", "Build UI", "Testing"];
    const projectId = (
      await provider.createProject({
        name: "Test",
        startDate: Date.now(),
        endDate: Date.now() + 2592000000,
      })
    ).projectId;

    const tasks = await provider.planTasks(projectId, goals);

    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBe(goals.length);
  });

  it("should create main tasks and subtasks", async () => {
    const projectId = (
      await provider.createProject({
        name: "Test",
        startDate: Date.now(),
        endDate: Date.now() + 2592000000,
      })
    ).projectId;

    const tasks = await provider.planTasks(projectId, ["Main Goal"]);

    tasks.forEach((task) => {
      expect(task.subtasks).toBeDefined();
      expect(Array.isArray(task.subtasks)).toBe(true);
    });
  });

  it("should assign work to team", async () => {
    const projectId = (
      await provider.createProject({
        name: "Test",
        startDate: Date.now(),
        endDate: Date.now() + 2592000000,
      })
    ).projectId;

    const assignments = [
      {
        taskId: "task-1",
        assignee: "john@example.com",
        assignedAt: Date.now(),
      },
      {
        taskId: "task-2",
        assignee: "jane@example.com",
        assignedAt: Date.now(),
      },
    ];

    const result = await provider.assignWork(projectId, assignments);

    expect(result.assigned).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it("should track project progress", async () => {
    const projectId = (
      await provider.createProject({
        name: "Test Project",
        startDate: Date.now(),
        endDate: Date.now() + 2592000000,
      })
    ).projectId;

    const status = await provider.trackProgress(projectId);

    expect(status.id).toBe(projectId);
    expect(status.completionPercent).toBeGreaterThanOrEqual(0);
    expect(status.completionPercent).toBeLessThanOrEqual(100);
  });

  it("should track task counts", async () => {
    const projectId = (
      await provider.createProject({
        name: "Test",
        startDate: Date.now(),
        endDate: Date.now() + 2592000000,
      })
    ).projectId;

    const status = await provider.trackProgress(projectId);

    expect(status.tasksTotal).toBeGreaterThanOrEqual(0);
    expect(status.tasksDone).toBeGreaterThanOrEqual(0);
    expect(status.tasksBlocked).toBeGreaterThanOrEqual(0);
  });

  it("should generate project report", async () => {
    const projectId = (
      await provider.createProject({
        name: "Test Report",
        startDate: Date.now(),
        endDate: Date.now() + 2592000000,
      })
    ).projectId;

    const report = await provider.generateReport(projectId);

    expect(report.summary).toBeDefined();
    expect(typeof report.summary).toBe("string");
    expect(report.metrics).toBeDefined();
  });

  it("should track budget usage", async () => {
    const projectId = (
      await provider.createProject({
        name: "Budget Test",
        startDate: Date.now(),
        endDate: Date.now() + 2592000000,
        budget: 100000,
      })
    ).projectId;

    const status = await provider.trackProgress(projectId);

    expect(status.budgetUsed).toBeDefined();
    expect(status.budgetTotal).toBe(100000);
  });

  it("should update task status", async () => {
    const result = await provider.updateTaskStatus("task-123", "in-progress");

    expect(result).toBe(true);
  });

  it("should identify project risks", async () => {
    const projectId = (
      await provider.createProject({
        name: "Risk Test",
        startDate: Date.now(),
        endDate: Date.now() + 2592000000,
      })
    ).projectId;

    const risks = await provider.identifyRisks(projectId);

    expect(Array.isArray(risks)).toBe(true);
    expect(risks.length).toBeGreaterThan(0);
  });

  it("should track time remaining", async () => {
    const projectId = (
      await provider.createProject({
        name: "Time Test",
        startDate: Date.now(),
        endDate: Date.now() + 2592000000, // 30 days
      })
    ).projectId;

    const status = await provider.trackProgress(projectId);

    if (status.timeRemaining !== undefined) {
      expect(status.timeRemaining).toBeGreaterThanOrEqual(0);
    }
  });

  it("should include last update timestamp", async () => {
    const projectId = (
      await provider.createProject({
        name: "Timestamp Test",
        startDate: Date.now(),
        endDate: Date.now() + 2592000000,
      })
    ).projectId;

    const status = await provider.trackProgress(projectId);

    expect(status.lastUpdated).toBeGreaterThan(0);
  });
});
