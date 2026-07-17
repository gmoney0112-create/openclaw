import { describe, it, expect } from "vitest";
import { createMvpSkillsProvider } from "./skills-impl.js";

describe("Skills Provider", () => {
  const provider = createMvpSkillsProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("skills-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP Skills (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("skill-execution");
    expect(provider.capabilities).toContain("skill-discovery");
  });

  it("should list available skills", async () => {
    const skills = await provider.listSkills();

    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBeGreaterThan(0);
  });

  it("should list skills with metadata", async () => {
    const skills = await provider.listSkills();

    skills.forEach((skill) => {
      expect(skill.id).toBeDefined();
      expect(skill.name).toBeDefined();
      expect(skill.description).toBeDefined();
    });
  });

  it("should get specific skill by id", async () => {
    const skills = await provider.listSkills();
    const firstSkillId = skills[0]?.id;

    const skill = await provider.getSkill(firstSkillId || "");

    expect(skill).not.toBeNull();
    expect(skill?.id).toBe(firstSkillId);
  });

  it("should return null for non-existent skill", async () => {
    const skill = await provider.getSkill("non-existent-id");

    expect(skill).toBeNull();
  });

  it("should include skill version", async () => {
    const skills = await provider.listSkills();

    skills.forEach((skill) => {
      expect(skill.version).toBeDefined();
    });
  });

  it("should include skill author", async () => {
    const skills = await provider.listSkills();

    skills.forEach((skill) => {
      expect(skill.author).toBeDefined();
    });
  });

  it("should include skill inputs specification", async () => {
    const skills = await provider.listSkills();

    skills.forEach((skill) => {
      expect(skill.inputs).toBeDefined();
    });
  });

  it("should include skill outputs specification", async () => {
    const skills = await provider.listSkills();

    skills.forEach((skill) => {
      expect(skill.outputs).toBeDefined();
    });
  });

  it("should execute skill with inputs", async () => {
    const result = await provider.executeSkill("analyze-data", { data: [1, 2, 3] });

    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });

  it("should return output from skill execution", async () => {
    const result = await provider.executeSkill("generate-report", { data: {} });

    expect(result.output).toBeDefined();
    expect(result.output.result).toBeDefined();
  });

  it("should tag skills with metadata", async () => {
    const skills = await provider.listSkills();

    skills.forEach((skill) => {
      expect(skill.tags).toBeDefined();
      expect(Array.isArray(skill.tags)).toBe(true);
    });
  });

  it("should list skill with analytics tag", async () => {
    const skills = await provider.listSkills();
    const analyticsSkill = skills.find((s) => s.tags.includes("analytics"));

    expect(analyticsSkill).toBeDefined();
  });
});
