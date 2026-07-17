import { describe, it, expect } from "vitest";
import { createMvpSaaSBuilderProvider } from "./saas-builder-impl.js";

describe("SaaS Builder Provider", () => {
  const provider = createMvpSaaSBuilderProvider();

  it("should have correct id", () => {
    expect(provider.id).toBe("saas-builder-mvp-ref");
  });

  it("should have correct label", () => {
    expect(provider.label).toBe("MVP SaaS Builder (Reference)");
  });

  it("should have required capabilities", () => {
    expect(provider.capabilities).toContain("fullstack-generation");
    expect(provider.capabilities).toContain("deployment");
    expect(provider.capabilities).toContain("testing");
  });

  it("should build product from spec", async () => {
    const spec = {
      name: "My SaaS App",
      description: "A test SaaS application",
      template: "analytics" as const,
      features: ["dashboard", "reporting"],
      targetMarket: "SMBs",
      pricingModel: "subscription" as const,
    };

    const result = await provider.buildProduct(spec);

    expect(result.productId).toBeDefined();
    expect(result.spec).toEqual(spec);
    expect(result.components).toBeDefined();
  });

  it("should generate multiple components", async () => {
    const spec = {
      name: "Test App",
      description: "Test",
      template: "content" as const,
      features: ["feature1"],
      targetMarket: "Enterprises",
      pricingModel: "usage-based" as const,
    };

    const result = await provider.buildProduct(spec);

    expect(result.components.length).toBeGreaterThan(0);
  });

  it("should include backend component", async () => {
    const spec = {
      name: "App",
      description: "Test",
      template: "automation" as const,
      features: ["test"],
      targetMarket: "Test",
      pricingModel: "freemium" as const,
    };

    const result = await provider.buildProduct(spec);
    const backend = result.components.find((c) => c.type === "backend");

    expect(backend).toBeDefined();
  });

  it("should include frontend component", async () => {
    const spec = {
      name: "App",
      description: "Test",
      template: "marketplace" as const,
      features: ["ui"],
      targetMarket: "Test",
      pricingModel: "tiered" as const,
    };

    const result = await provider.buildProduct(spec);
    const frontend = result.components.find((c) => c.type === "frontend");

    expect(frontend).toBeDefined();
  });

  it("should include database component", async () => {
    const spec = {
      name: "App",
      description: "Test",
      template: "custom" as const,
      features: ["db"],
      targetMarket: "Test",
      pricingModel: "subscription" as const,
    };

    const result = await provider.buildProduct(spec);
    const db = result.components.find((c) => c.type === "database");

    expect(db).toBeDefined();
  });

  it("should generate component individually", async () => {
    const component = await provider.generateComponent("backend", {
      feature: "authentication",
    });

    expect(component.type).toBe("backend");
    expect(component.code).toBeDefined();
    expect(component.path).toBeDefined();
  });

  it("should generate tests for components", async () => {
    const components = [
      {
        id: "comp1",
        type: "backend" as const,
        path: "/src/api.ts",
        code: "export default {}",
        language: "typescript",
      },
    ];

    const tests = await provider.generateTests(components);

    expect(Array.isArray(tests)).toBe(true);
    expect(tests.length).toBeGreaterThan(0);
  });

  it("should deploy product", async () => {
    const deployment = {
      platform: "railway" as const,
      environment: "production" as const,
      domainName: "myapp.com",
      replicas: 3,
    };

    const result = await provider.deployProduct("product-123", deployment);

    expect(result.deployed).toBe(true);
    expect(result.status).toBe("live");
    expect(result.url).toContain("https://");
  });

  it("should get deployment status", async () => {
    const status = await provider.getDeploymentStatus("deploy-123");

    expect(status.deployed).toBe(true);
    expect(status.status).toBe("live");
    expect(status.url).toBeDefined();
  });

  it("should include repository URL in build result", async () => {
    const spec = {
      name: "MyApp",
      description: "Test",
      template: "lead-generation" as const,
      features: ["feature"],
      targetMarket: "Market",
      pricingModel: "subscription" as const,
    };

    const result = await provider.buildProduct(spec);

    expect(result.repositoryUrl).toContain("github.com");
  });

  it("should list implemented and planned features", async () => {
    const spec = {
      name: "App",
      description: "Test",
      template: "analytics" as const,
      features: ["test"],
      targetMarket: "Market",
      pricingModel: "subscription" as const,
    };

    const result = await provider.buildProduct(spec);

    expect(result.features.implemented).toBeDefined();
    expect(result.features.planned).toBeDefined();
  });

  it("should provide estimated time", async () => {
    const spec = {
      name: "App",
      description: "Test",
      template: "collaboration" as const,
      features: ["collab"],
      targetMarket: "Teams",
      pricingModel: "tiered" as const,
    };

    const result = await provider.buildProduct(spec);

    expect(result.estimatedTime).toBeGreaterThan(0);
  });
});
