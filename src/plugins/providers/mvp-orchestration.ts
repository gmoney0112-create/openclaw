// MVP Orchestration: Wiring 4 core providers into a complete business workflow
// Demonstrates Lead Gen → Sales → Revenue → Business Loop cycle

import type { BusinessGoal } from "../plugin-sdk/business-loop.js";
import type { LeadCriteria } from "../plugin-sdk/lead-generation.js";
import { createMvpBusinessLoopProvider } from "./business-loop-impl.js";
import { createMvpLeadGenerationProvider } from "./lead-generation-impl.js";
import { createMvpRevenueOptimizationProvider } from "./revenue-optimization-impl.js";
import { createMvpSalesAutomationProvider } from "./sales-automation-impl.js";

/**
 * Complete MVP workflow orchestration
 * Demonstrates autonomous business operations with 4 integrated providers
 */
export async function runMvpBusinessWorkflow() {
  const leadGen = createMvpLeadGenerationProvider();
  const sales = createMvpSalesAutomationProvider();
  const revenue = createMvpRevenueOptimizationProvider();
  const businessLoop = createMvpBusinessLoopProvider();

  // Step 1: Define business goals
  const goals: BusinessGoal[] = [
    {
      id: "goal-1",
      type: "revenue",
      target: 600000,
      metric: "ARR",
      timeframe: 90,
      priority: "high",
    },
    {
      id: "goal-2",
      type: "growth",
      target: 100,
      metric: "qualified-leads",
      timeframe: 90,
      priority: "high",
    },
  ];

  // Step 2: Start the business loop
  console.log("🚀 Starting MVP Business Loop...\n");
  const { loopId } = await businessLoop.runLoop({
    id: "mvp-loop-1",
    name: "MVP Sales-Driven Growth",
    description: "Autonomous lead generation → sales → revenue optimization cycle",
    goals,
    iterationInterval: 24 * 60 * 60 * 1000, // Daily iterations
    maxIterations: 5,
    autoAdjust: true,
  });

  console.log(`✅ Loop started: ${loopId}\n`);

  // Step 3: Generate leads
  console.log("📊 Phase 1: Lead Generation");
  const leadCriteria: LeadCriteria = {
    industry: "SaaS",
    title: "Founder",
    minCompanySize: 10,
    maxCompanySize: 500,
    sources: ["api", "linkedin"],
    limit: 50,
    includeEmail: true,
    includePhone: true,
  };

  const leadResult = await leadGen.generateLeads(leadCriteria);
  console.log(`  Generated: ${leadResult.leads.length} leads`);
  console.log(`  Validated: ${leadResult.validatedLeads} leads`);
  console.log(
    `  Sample leads: ${leadResult.leads
      .slice(0, 2)
      .map((l) => l.name)
      .join(", ")}\n`,
  );

  // Step 4: Launch sales campaign
  console.log("📧 Phase 2: Sales Automation");
  const { campaignId } = await sales.launchCampaign({
    type: "cold-email",
    name: "SaaS Founders Outreach",
    description: "Initial cold email to target SaaS founders",
    leadIds: leadResult.leads.slice(0, 10).map((l) => l.id),
    templates: {
      default: `Hi {{name}},

We help SaaS companies like {{company}} automate their sales process and grow revenue 20-30% faster.

Would you be open to a brief conversation?

Best,
Sales Team`,
    },
    personalization: true,
    schedule: {
      startDate: Date.now(),
      frequency: "daily" as const,
    },
  });

  console.log(`  Campaign launched: ${campaignId}`);
  console.log(`  Recipients: ${leadResult.leads.slice(0, 10).length}`);
  console.log(`  Expected 30% response rate: ~3 responses\n`);

  // Step 5: Process responses
  console.log("📈 Phase 3: Response Processing");
  const responses = await sales.processResponses(campaignId);
  console.log(`  Responses received: ${responses.length}`);

  const sqlLeads = responses.filter((r) => r.qualification === "sql");
  console.log(`  SQL (Sales Qualified): ${sqlLeads.length}`);
  console.log(`  Requires follow-up: ${responses.filter((r) => r.requiresFollowup).length}\n`);

  // Step 6: Analyze revenue impact
  console.log("💰 Phase 4: Revenue Analysis");
  const revenueAnalysis = await revenue.analyzeRevenue({
    metrics: ["mrr", "arr", "ltv", "cac"],
    includeForecasts: true,
    includeBottlenecks: true,
  });

  console.log(`  Current MRR: $${revenueAnalysis.metrics.mrr?.toLocaleString()}`);
  console.log(`  Current ARR: $${revenueAnalysis.metrics.arr?.toLocaleString()}`);
  console.log(`  LTV: $${revenueAnalysis.metrics.ltv?.toLocaleString()}`);
  console.log(`  CAC: $${revenueAnalysis.metrics.cac?.toLocaleString()}`);
  console.log(
    `  Growth Rate: ${((revenueAnalysis.metrics.growthRate || 0) * 100).toFixed(1)}% MoM`,
  );
  console.log(`\n  Forecast (next 30 days):`);
  console.log(`    Projected MRR: $${revenueAnalysis.forecast?.projectedMRR?.toLocaleString()}`);
  console.log(
    `    Growth: ${(((revenueAnalysis.forecast?.projectedMRR || 0) / (revenueAnalysis.metrics.mrr || 1) - 1) * 100).toFixed(1)}%`,
  );

  console.log(`\n  Bottlenecks identified: ${revenueAnalysis.bottlenecks.length}`);
  revenueAnalysis.bottlenecks.forEach((b) => {
    console.log(`    • ${b.issue} (${b.severity})`);
  });

  // Step 7: Get pricing recommendation
  console.log(`\n💡 Phase 5: Strategy Recommendations`);
  const pricingRec = await revenue.recommendPricing(99, {});
  console.log(`  Current Price: $99`);
  console.log(`  Recommended: $${pricingRec.recommendedPrice.toFixed(2)}`);
  console.log(`  Confidence: ${(pricingRec.confidence * 100).toFixed(0)}%`);
  console.log(
    `  Expected Impact: ${((pricingRec.expectedImpact?.revenueChange || 0) * 100).toFixed(1)}% revenue increase`,
  );

  // Step 8: Monitor and adjust
  console.log(`\n🔄 Phase 6: Loop Monitoring & Adjustment`);
  const loopStatus = await businessLoop.monitorLoop(loopId);
  console.log(`  Status: ${loopStatus.isRunning ? "Running" : "Paused"}`);
  console.log(`  Iteration: ${loopStatus.currentIteration}/${goals.length}`);
  console.log(`  Progress: ${(loopStatus.progress * 100).toFixed(0)}%`);

  // Simulate strategy adjustment
  const adjustmentSuccessful = await businessLoop.adjustStrategy(loopId, [
    "Increase lead generation target by 30%",
    "Focus on high-LTV customer segments",
    "Implement 24-hour follow-up sequences",
  ]);

  if (adjustmentSuccessful) {
    console.log(`  ✅ Strategy adjusted based on iteration results\n`);
  }

  // Step 9: Generate insights
  console.log("💡 Phase 7: Business Insights");
  const insights = await businessLoop.getInsights(loopId);
  insights.forEach((insight) => {
    console.log(`  • ${insight.insight}`);
    console.log(`    → Recommendation: ${insight.recommendation}`);
    console.log(`    → Impact: ${insight.expectedImpact}`);
    console.log(`    → Confidence: ${(insight.confidence * 100).toFixed(0)}%\n`);
  });

  // Step 10: Final report
  console.log("📋 Phase 8: Final Loop Report");
  const finalReport = await businessLoop.reportResults(loopId);
  console.log(`  Completed Iterations: ${finalReport.completions}`);
  console.log(`  Total Time: ${(finalReport.totalTime / 1000 / 60).toFixed(1)} minutes`);
  console.log(`  Efficiency Gains: ${(finalReport.efficiencyGains * 100).toFixed(0)}%`);
  console.log(`  Key Learnings:`);
  finalReport.learnings.slice(0, 3).forEach((learning) => {
    console.log(`    • ${learning}`);
  });

  console.log(`\n  Goal Progress:`);
  Object.entries(finalReport.goalProgress).forEach(([goalId, progress]) => {
    const progressBar =
      "█".repeat(Math.floor(progress * 20)) + "░".repeat(20 - Math.floor(progress * 20));
    console.log(`    ${goalId}: [${progressBar}] ${(progress * 100).toFixed(0)}%`);
  });

  console.log(`\n✅ MVP Workflow Complete!\n`);

  return {
    loopId,
    leadResults: leadResult,
    campaignResults: await sales.getCampaignResults(campaignId),
    revenueAnalysis,
    finalReport,
  };
}

/**
 * Simple health check for all 4 MVP providers
 */
export async function checkMvpProviderHealth() {
  console.log("🔍 MVP Provider Health Check\n");

  const providers = {
    "Lead Generation": createMvpLeadGenerationProvider(),
    "Sales Automation": createMvpSalesAutomationProvider(),
    "Revenue Optimization": createMvpRevenueOptimizationProvider(),
    "Business Loop": createMvpBusinessLoopProvider(),
  };

  for (const [name, provider] of Object.entries(providers)) {
    console.log(`✅ ${name}`);
    console.log(`   ID: ${provider.id}`);
    console.log(`   Label: ${provider.label}`);
    console.log(`   Capabilities: ${provider.capabilities.join(", ")}\n`);
  }

  return Object.entries(providers).reduce(
    (acc, [name, provider]) => {
      acc[name] = {
        id: provider.id,
        label: provider.label,
        capabilities: provider.capabilities,
      };
      return acc;
    },
    {} as Record<string, { id: string; label: string; capabilities: string[] }>,
  );
}
