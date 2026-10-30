import test from "node:test";
import assert from "node:assert/strict";

test("storage module exports valid operations", async () => {
  // Test storage interface
  const { getUser, saveUser, getRepositories, saveRepository } = await import("../lib/storage.ts");

  assert.equal(typeof getUser, "function");
  assert.equal(typeof saveUser, "function");
  assert.equal(typeof getRepositories, "function");
  assert.equal(typeof saveRepository, "function");

  const testAddr = "0x0318A1Df19a78f6784CbDDcE768EEF970C561493";
  const user = await saveUser(testAddr, "coral_dev");
  assert.equal(user.address, testAddr);
  assert.equal(user.nickname, "coral_dev");

  const retrieved = await getUser(testAddr);
  assert.equal(retrieved?.nickname, "coral_dev");

  const testRepo = {
    id: "repo-test-1",
    name: "test-diamond",
    owner_address: testAddr,
    owner_nickname: "coral_dev",
    description: "Test Diamond Proxy",
    contract_address: "0x1234567890123456789012345678901234567890",
    tx_hash: "0xabc",
    sol_code: "contract Test {}",
    facet_count: 1,
    guardian_active: true,
    is_private: false,
  };

  const savedRepo = await saveRepository(testRepo);
  assert.equal(savedRepo.id, "repo-test-1");

  const repos = await getRepositories(testAddr);
  assert.ok(repos.some((r) => r.id === "repo-test-1"));
});
