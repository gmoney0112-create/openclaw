import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { createServer } from "node:http";
import { once } from "node:events";
import { AgentOrchestrator } from "../src/agent-orchestrator";
import { createDepartmentAgents } from "../src/department-agents";
import { InMemoryTaskStateStore } from "../src/state-store";

async function waitForSuccess(orchestrator: AgentOrchestrator, taskId: string): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const task = await orchestrator.getStatus(taskId);
    if (task?.status === "success") {
      return;
    }
    await delay(25);
  }
  throw new Error("Task did not complete in time");
}

async function run(): Promise<void> {
  const store = new InMemoryTaskStateStore();
  const orchestrator = new AgentOrchestrator(createDepartmentAgents(), store, 3, 86_400_000);

  assert.equal(orchestrator.classifyDepartment("create a sales funnel"), "marketing");
  assert.equal(orchestrator.classifyDepartment("add contact to CRM"), "sales");
  assert.equal(orchestrator.classifyDepartment("research top competitors in my niche"), "research");
  assert.equal(orchestrator.classifyDepartment("deploy this workflow to Railway"), "ops");
  assert.equal(orchestrator.classifyDepartment("reply to this support ticket"), "support");

  const salesDispatch = await orchestrator.dispatch("add contact to CRM and create an opportunity");
  await waitForSuccess(orchestrator, salesDispatch.taskId);
  const salesTask = await orchestrator.getStatus(salesDispatch.taskId);
  assert.equal(salesTask?.department, "sales");
  assert.equal(salesTask?.status, "success");
  assert.equal(salesTask?.result?.tool_used, "create_ghl_contact");

  const researchDispatch = await orchestrator.dispatch("research the best ai automation competitors");
  await waitForSuccess(orchestrator, researchDispatch.taskId);
  const researchTask = await orchestrator.getStatus(researchDispatch.taskId);
  assert.equal((researchTask?.result?.details as { reportReady?: boolean } | undefined)?.reportReady, true);

  assert.equal(store.backend(), "memory");

  const server = createServer(async (request, response) => {
    if (request.url === "/agent/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({
        status: "ok",
        state_backend: store.backend(),
        task_count: await store.count()
      }));
      return;
    }

    response.writeHead(404).end();
  });

  server.listen(0);
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const healthResponse = await fetch(`http://127.0.0.1:${port}/agent/health`);
  const healthJson = await healthResponse.json() as { status: string };
  assert.equal(healthJson.status, "ok");
  server.close();

  console.log("multi-agent integration test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
