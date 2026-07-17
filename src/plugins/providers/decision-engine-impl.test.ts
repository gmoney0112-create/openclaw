import { describe, it, expect } from "vitest";
import { createMvpDecisionEngineProvider } from "./decision-engine-impl.js";

describe("Decision Engine Provider", () => {
  const provider = createMvpDecisionEngineProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("decision-engine-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP Decision Engine (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("multi-option-analysis");
    expect(provider.capabilities).toContain("risk-assessment");
    expect(provider.capabilities).toContain("recommendation");
  });

  it("should analyze decision", async () => {
    const context = {
      question: "Which platform to use?",
      options: ["Option A", "Option B", "Option C"],
    };

    const analysis = await provider.analyzeDecision(context);

    expect(analysis.context).toEqual(context);
    expect(analysis.optionAnalyses).toBeDefined();
    expect(analysis.optionAnalyses.length).toBe(3);
  });

  it("should provide pros and cons for each option", async () => {
    const context = {
      question: "Technology choice",
      options: ["Tech A", "Tech B"],
    };

    const analysis = await provider.analyzeDecision(context);

    analysis.optionAnalyses.forEach((opt) => {
      expect(opt.pros).toBeDefined();
      expect(opt.cons).toBeDefined();
      expect(Array.isArray(opt.pros)).toBe(true);
      expect(Array.isArray(opt.cons)).toBe(true);
    });
  });

  it("should assess risk level", async () => {
    const context = {
      question: "Risk assessment",
      options: ["Risky", "Safe"],
    };

    const analysis = await provider.analyzeDecision(context);

    const validRisks = ["low", "medium", "high"];
    analysis.optionAnalyses.forEach((opt) => {
      if (opt.riskLevel) {
        expect(validRisks).toContain(opt.riskLevel);
      }
    });
  });

  it("should rank options", async () => {
    const context = {
      question: "Ranking test",
      options: ["First", "Second", "Third"],
    };

    const ranked = await provider.rankOptions(context);

    expect(ranked.length).toBe(3);
    ranked.forEach((r, i) => {
      expect(r.rank).toBe(i + 1);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    });
  });

  it("should assess risks for option", async () => {
    const context = {
      question: "Risk test",
      options: ["Option"],
      constraints: ["Constraint 1", "Constraint 2"],
    };

    const risk = await provider.assessRisks("Option", context);

    const validRisks = ["low", "medium", "high"];
    expect(validRisks).toContain(risk.overallRisk);
  });

  it("should provide mitigation strategies", async () => {
    const context = {
      question: "Mitigation test",
      options: ["Option"],
    };

    const risk = await provider.assessRisks("Option", context);

    expect(risk.mitigationStrategies).toBeDefined();
    expect(Array.isArray(risk.mitigationStrategies)).toBe(true);
  });

  it("should get recommendation", async () => {
    const context = {
      question: "Make a choice",
      options: ["Choice A", "Choice B"],
    };

    const analysis = await provider.analyzeDecision(context);
    const recommendation = await provider.getRecommendation(analysis);

    expect(recommendation.chosenOption).toBeDefined();
    expect(recommendation.rationale).toBeDefined();
  });

  it("should provide implementation steps", async () => {
    const context = {
      question: "Implementation",
      options: ["Option"],
    };

    const analysis = await provider.analyzeDecision(context);
    const recommendation = await provider.getRecommendation(analysis);

    expect(recommendation.implementationSteps).toBeDefined();
    expect(Array.isArray(recommendation.implementationSteps)).toBe(true);
  });

  it("should define success metrics", async () => {
    const context = {
      question: "Metrics",
      options: ["Option"],
    };

    const analysis = await provider.analyzeDecision(context);
    const recommendation = await provider.getRecommendation(analysis);

    expect(recommendation.successMetrics).toBeDefined();
    expect(Array.isArray(recommendation.successMetrics)).toBe(true);
  });

  it("should explain reasoning", async () => {
    const reasoning = await provider.explainReasoning("Option A", {
      question: "Why this option?",
      options: ["Option A", "Option B"],
    });

    expect(reasoning).toBeDefined();
    expect(typeof reasoning).toBe("string");
  });

  it("should simulate outcomes", async () => {
    const context = {
      question: "Outcome simulation",
      options: ["Option"],
      businessGoals: ["Goal 1", "Goal 2"],
    };

    const simulation = await provider.simulateOutcomes("Option", context);

    expect(simulation.scenarios).toBeDefined();
    expect(simulation.expectedValue).toBeGreaterThan(0);
  });

  it("should provide confidence score", async () => {
    const context = {
      question: "Confidence test",
      options: ["Option"],
    };

    const analysis = await provider.analyzeDecision(context);
    const recommendation = await provider.getRecommendation(analysis);

    expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
    expect(recommendation.confidence).toBeLessThanOrEqual(1);
  });

  it("should identify failure modes", async () => {
    const context = {
      question: "Failure modes",
      options: ["Option"],
    };

    const analysis = await provider.analyzeDecision(context);
    const recommendation = await provider.getRecommendation(analysis);

    expect(recommendation.failureModes).toBeDefined();
    expect(Array.isArray(recommendation.failureModes)).toBe(true);
  });
});
