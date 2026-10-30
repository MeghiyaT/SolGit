import test from "node:test";
import assert from "node:assert/strict";

Object.assign(process.env, { NODE_ENV: "test" });
process.env.PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

test("relayer deployment module validates inputs and deploys to Coral", async () => {
  const { deployViaRelayer } = await import("../lib/relayer.ts");

  assert.equal(typeof deployViaRelayer, "function");

  const invalidCall = deployViaRelayer({
    repoName: "",
    ownerAddress: "",
    ownerNickname: "",
    solCode: "",
  });
  await assert.rejects(invalidCall, /Missing required deployment fields/);

  const testDeploy = await deployViaRelayer({
    repoName: "coral-vault-diamond",
    description: "Self-healing Diamond on MST Coral",
    ownerAddress: "0x0318A1Df19a78f6784CbDDcE768EEF970C561493",
    ownerNickname: "coral_dev",
    solCode: "contract CoralVault {}",
    isPrivate: false,
  });

  assert.ok(testDeploy.success);
  assert.ok(testDeploy.contractAddress.startsWith("0x"));
  assert.ok(testDeploy.txHash.startsWith("0x"));
  assert.ok(testDeploy.txUrl.includes("coral.mstscan.com/tx/"));
  assert.ok(testDeploy.explorerUrl.includes("coral.mstscan.com/address/"));
  assert.equal(testDeploy.repository.name, "coral-vault-diamond");
  assert.equal(testDeploy.repository.owner, "coral_dev");
});
