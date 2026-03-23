import assert from "node:assert/strict";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CodeAnalyzer } from "../src/code-analyzer";
import { DeployManager } from "../src/deploy-manager";
import { PatchApplicator } from "../src/patch-applicator";
import { PatchGenerator } from "../src/patch-generator";
import { TestRunner } from "../src/test-runner";

async function run(): Promise<void> {
  const fixture = resolve(__dirname, "../fixtures/broken-test.js");
  const working = resolve(__dirname, "../fixtures/broken-test.copy.js");
  copyFileSync(fixture, working);

  const analyzer = new CodeAnalyzer();
  const analyzed = analyzer.analyze(`SyntaxError: Unexpected token ';'\n${working}:1:16`);
  assert.equal(analyzed.file, working);
  assert.equal(analyzed.line, 1);

  const generator = new PatchGenerator();
  const generated = generator.generate({
    file: working,
    error: analyzed.error,
    line: analyzed.line
  });
  assert.match(generated.patch, /Replace invalid assignment/);

  const applicator = new PatchApplicator();
  assert.equal(applicator.apply(working, generated.replacement), true);
  assert.match(readFileSync(working, "utf8"), /const broken = 1;/);

  const runner = new TestRunner();
  const testResult = await runner.run(process.execPath, [working]);
  assert.equal(testResult.passed, true);

  const deployManager = new DeployManager(resolve(__dirname, "../../.."));
  process.env.AUTO_DEPLOY = "false";
  const blocked = await deployManager.deploy("fixture deploy", true);
  assert.equal(blocked.deployed, false);
  assert.match(blocked.message, /AUTO_DEPLOY is false/);

  const remote = await deployManager.currentRemote();
  assert.match(remote, /gmoney0112-create\/openclaw\.git/);

  writeFileSync(working, readFileSync(fixture, "utf8"), "utf8");
  console.log("auto-coder integration test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
