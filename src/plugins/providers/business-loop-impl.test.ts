import { describe, it, expect, beforeEach } from "vitest";
import { createMvpBusinessLoopProvider } from "./business-loop-impl.js";

describe("MVP Business Loop Provider", () => {
  let provider: ReturnType<typeof createMvpBusinessLoopProvider>;

  beforeEach(() => {
    provider = createMvpBusinessLoopProvider();
  });

  it("should have correct metadata", () => {
    expect(provider.id).toBe("business-loop-mvp-ref");
    expect(provider.label).toContain("Business Loop");
    expect(provider.capabilities).toContain("goal-management");
  });

  it("should start a business loop", async () => {
    const result = await provider.runLoop({
      id: "test-loop",
      name: "Test Loop",
      goals: [
        {
          id: "goal-1",
          type: "revenue",
          target: 100000,
          metric: "ARR",
          timeframe: 90,
        },
      ],
      iterationInterval: 86400000,
      maxIterations: 5,
    });

    expect(result.loopId).toBeDefined();
    expect(result.loopId).toContain("loop-");
  });

  it("should monitor running loop", async () => {
    const { loopId } = await provider.runLoop({
      id: "monitor-test",
      name: "Monitor Test",
      goals: [
        {
          id: "goal-1",
          type: "revenue",
          target: 50000,
          metric: "MRR",
          timeframe: 30,
        },
      ],
      iterationInterval: 86400000,
      maxIterations: 5,
    });

    const status = await provider.monitorLoop(loopId);

    expect(status.loopId).toBe(loopId);
    expect(status.isRunning).toBe(true);
    expect(status.currentIteration).toBeGreaterThan(0);
    expect(status.progress).toBeGreaterThanOrEqual(0);
    expect(status.progress).toBeLessThanOrEqual(1);
  });

  it("should track loop progress", async () => {
    const { loopId } = await provider.runLoop({
      id: "progress-test",
      name: "Progress Test",
      goals: [],
      iterationInterval: 86400000,
      maxIterations: 5,
    });

    const status = await provider.monitorLoop(loopId);

    expect(status.elapsedTime).toBeGreaterThanOrEqual(0);
    expect(status.currentAction).toBeDefined();
  });

  it("should pause and resume loop", async () => {
    const { loopId } = await provider.runLoop({
      id: "pause-test",
      name: "Pause Test",
      goals: [],
      iterationInterval: 86400000,
      maxIterations: 5,
    });

    const paused = await provider.pauseLoop!(loopId);
    expect(paused).toBe(true);

    const statusPaused = await provider.monitorLoop(loopId);
    expect(statusPaused.isRunning).toBe(false);

    const resumed = await provider.resumeLoop!(loopId);
    expect(resumed).toBe(true);

    const statusResumed = await provider.monitorLoop(loopId);
    expect(statusResumed.isRunning).toBe(true);
  });

  it("should adjust strategy and improve performance", async () => {
    const { loopId } = await provider.runLoop({
      id: "adjust-test",
      name: "Adjust Test",
      goals: [],
      iterationInterval: 86400000,
      maxIterations: 5,
    });

    const adjusted = await provider.adjustStrategy!(loopId, [
      "Increase marketing budget",
      "Optimize sales funnel",
    ]);

    expect(adjusted).toBe(true);

    const status = await provider.monitorLoop(loopId);
    expect(status.currentIteration).toBeGreaterThan(1);
  });

  it("should generate reports", async () => {
    const { loopId } = await provider.runLoop({
      id: "report-test",
      name: "Report Test",
      goals: [
        {
          id: "goal-1",
          type: "growth",
          target: 100,
          metric: "new-customers",
          timeframe: 30,
        },
      ],
      iterationInterval: 86400000,
      maxIterations: 5,
    });

    const report = await provider.reportResults(loopId);

    expect(report.loopId).toBe(loopId);
    expect(report.completions).toBeGreaterThan(0);
    expect(Array.isArray(report.iterations)).toBe(true);
    expect(report.totalTime).toBeGreaterThanOrEqual(0);
  });

  it("should track learnings from iterations", async () => {
    const { loopId } = await provider.runLoop({
      id: "learning-test",
      name: "Learning Test",
      goals: [],
      iterationInterval: 86400000,
      maxIterations: 5,
    });

    const report = await provider.reportResults(loopId);

    expect(report.learnings).toBeDefined();
    expect(Array.isArray(report.learnings)).toBe(true);
    expect(report.learnings.length).toBeGreaterThan(0);
  });

  it("should measure efficiency gains", async () => {
    const { loopId } = await provider.runLoop({
      id: "efficiency-test",
      name: "Efficiency Test",
      goals: [],
      iterationInterval: 86400000,
      maxIterations: 5,
    });

    const report = await provider.reportResults(loopId);

    expect(report.efficiencyGains).toBeGreaterThanOrEqual(0);
    expect(report.efficiencyGains).toBeLessThanOrEqual(1);
  });

  it("should track goal progress", async () => {
    const { loopId } = await provider.runLoop({
      id: "goal-progress-test",
      name: "Goal Progress Test",
      goals: [
        {
          id: "goal-1",
          type: "revenue",
          target: 100000,
          metric: "ARR",
          timeframe: 90,
        },
        {
          id: "goal-2",
          type: "growth",
          target: 50,
          metric: "new-customers",
          timeframe: 90,
        },
      ],
      iterationInterval: 86400000,
      maxIterations: 5,
    });

    const report = await provider.reportResults(loopId);

    expect(report.goalProgress).toBeDefined();
    expect(Object.keys(report.goalProgress).length).toBeGreaterThan(0);

    Object.values(report.goalProgress).forEach((progress) => {
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });
  });

  it("should provide business insights", async () => {
    const { loopId } = await provider.runLoop({
      id: "insight-test",
      name: "Insight Test",
      goals: [],
      iterationInterval: 86400000,
      maxIterations: 5,
    });

    const insights = await provider.getInsights(loopId);

    expect(Array.isArray(insights)).toBe(true);
    expect(insights.length).toBeGreaterThan(0);

    insights.forEach((insight) => {
      expect(insight.insight).toBeDefined();
      expect(insight.confidence).toBeGreaterThanOrEqual(0);
      expect(insight.confidence).toBeLessThanOrEqual(1);
      expect(insight.actionable).toBeDefined();
      if (insight.actionable) {
        expect(insight.recommendation).toBeDefined();
      }
    });
  });

  it("should stop loop and return final report", async () => {
    const { loopId } = await provider.runLoop({
      id: "stop-test",
      name: "Stop Test",
      goals: [],
      iterationInterval: 86400000,
      maxIterations: 5,
    });

    const finalReport = await provider.stopLoop!(loopId);

    expect(finalReport.loopId).toBe(loopId);
    expect(finalReport.completions).toBeGreaterThan(0);

    const status = await provider.monitorLoop(loopId);
    expect(status.isRunning).toBe(false);
  });

  it("should handle missing loop gracefully", async () => {
    await expect(provider.monitorLoop("nonexistent-loop")).rejects.toThrow();
  });

  it("should provide next action recommendations", async () => {
    const { loopId } = await provider.runLoop({
      id: "next-action-test",
      name: "Next Action Test",
      goals: [],
      iterationInterval: 86400000,
      maxIterations: 5,
    });

    const report = await provider.reportResults(loopId);

    expect(report.nextActions).toBeDefined();
    expect(Array.isArray(report.nextActions)).toBe(true);
  });

  it("should track adaptations made during loop", async () => {
    const { loopId } = await provider.runLoop({
      id: "adapt-test",
      name: "Adapt Test",
      goals: [],
      iterationInterval: 86400000,
      maxIterations: 5,
    });

    const report = await provider.reportResults(loopId);

    expect(report.adaptations).toBeDefined();
    expect(Array.isArray(report.adaptations)).toBe(true);
  });

  it("should run multiple iterations", async () => {
    const { loopId } = await provider.runLoop({
      id: "multi-iter-test",
      name: "Multi Iteration Test",
      goals: [],
      iterationInterval: 86400000,
      maxIterations: 5,
    });

    // Simulate multiple adjustments
    await provider.adjustStrategy!(loopId, ["Adjustment 1"]);
    await provider.adjustStrategy!(loopId, ["Adjustment 2"]);

    const status = await provider.monitorLoop(loopId);
    expect(status.currentIteration).toBeGreaterThanOrEqual(3); // At least 3 iterations
  });
});
