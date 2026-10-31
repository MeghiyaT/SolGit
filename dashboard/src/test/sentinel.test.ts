import test from "node:test";
import assert from "node:assert/strict";
import { SENTINEL_ABI, parseSentinelLog, buildRawLogs } from "../hooks/useSentinelEvents.ts";
import { CONTRACTS } from "../lib/data.ts";

test("SENTINEL_ABI includes required on-chain event definitions", () => {
  const eventNames = SENTINEL_ABI.map((item) => ("name" in item ? item.name : ""));
  assert.ok(eventNames.includes("Deposited"), "Must include Deposited event");
  assert.ok(eventNames.includes("Withdrawn"), "Must include Withdrawn event");
  assert.ok(eventNames.includes("EmergencyRollbackExecuted"), "Must include EmergencyRollbackExecuted event");
  assert.ok(eventNames.includes("SelectorRolledBack"), "Must include SelectorRolledBack event");
});

test("parseSentinelLog correctly normalizes Deposited event with MST Coral explorer link", () => {
  const dummyLog = {
    address: CONTRACTS.diamond as `0x${string}`,
    blockNumber: 415013n,
    transactionHash: "0x6dac7f805d73439ce0e05e0563dbaa01974ee9505c3f6cf51a402abb4f2ee23f" as `0x${string}`,
    logIndex: 0,
    eventName: "Deposited",
    args: {
      account: "0x0318A1Df19a78f6784CbDDcE768EEF970C561493",
      amount: 50000000000000000n, // 0.05 ether
    },
  };

  const { event, rollback } = parseSentinelLog(dummyLog, "MST Coral Block #415013");

  assert.equal(event.eventName, "Deposited");
  assert.equal(event.transactionHash, "0x6dac7f805d73439ce0e05e0563dbaa01974ee9505c3f6cf51a402abb4f2ee23f");
  assert.equal(event.blockNumber, 415013n);
  assert.equal(event.amountFormatted, "0.0500 tMSTC");
  assert.equal(event.explorerUrl, "https://coral.mstscan.com/tx/0x6dac7f805d73439ce0e05e0563dbaa01974ee9505c3f6cf51a402abb4f2ee23f");
  assert.equal(rollback, undefined);
});

test("parseSentinelLog correctly normalizes Withdrawn event with MST Coral explorer link", () => {
  const dummyLog = {
    address: CONTRACTS.diamond as `0x${string}`,
    blockNumber: 415022n,
    transactionHash: "0xa21801e7a4cee367f6dc7b0f93dc7d3c6755a09b9ec5a64f2467fb457ae253b9" as `0x${string}`,
    logIndex: 1,
    eventName: "Withdrawn",
    args: {
      account: "0x0318A1Df19a78f6784CbDDcE768EEF970C561493",
      amount: 20000000000000000n, // 0.02 ether
    },
  };

  const { event, rollback } = parseSentinelLog(dummyLog, "MST Coral Block #415022");

  assert.equal(event.eventName, "Withdrawn");
  assert.equal(event.transactionHash, "0xa21801e7a4cee367f6dc7b0f93dc7d3c6755a09b9ec5a64f2467fb457ae253b9");
  assert.equal(event.blockNumber, 415022n);
  assert.equal(event.amountFormatted, "0.0200 tMSTC");
  assert.equal(event.explorerUrl, "https://coral.mstscan.com/tx/0xa21801e7a4cee367f6dc7b0f93dc7d3c6755a09b9ec5a64f2467fb457ae253b9");
  assert.equal(rollback, undefined);
});

test("parseSentinelLog extracts EmergencyRollbackExecuted and creates structured RollbackEvent", () => {
  const dummyLog = {
    address: CONTRACTS.diamond as `0x${string}`,
    blockNumber: 415060n,
    transactionHash: "0x89abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567" as `0x${string}`,
    logIndex: 0,
    eventName: "EmergencyRollbackExecuted",
    args: {
      selector: "0x2e1a7d4d" as `0x${string}`,
      previousVersion: 2n,
      targetVersion: 1n,
    },
  };

  const { event, rollback } = parseSentinelLog(dummyLog, "MST Coral Block #415060");

  assert.equal(event.eventName, "EmergencyRollbackExecuted");
  assert.ok(rollback, "Must create RollbackEvent");
  assert.equal(rollback?.selector, "0x2e1a7d4d");
  assert.equal(rollback?.badVersion, 2);
  assert.equal(rollback?.goodVersion, 1);
  assert.equal(rollback?.status, "BLOCKED & ROLLED BACK");
  assert.equal(rollback?.blockNumber, 415060);
  assert.equal(rollback?.txHash, "0x89abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567");
});

test("buildRawLogs uses authentic MST Coral addresses and block numbers", () => {
  const logs = buildRawLogs({
    diamondAddress: CONTRACTS.diamond,
    txHash: "0xa21801e7a4cee367f6dc7b0f93dc7d3c6755a09b9ec5a64f2467fb457ae253b9",
    blockNumber: "415022",
    selector: "0x2e1a7d4d",
  });

  assert.equal(logs.length, 28);
  // Stage 1 verifies Chain ID 54635 and Diamond address
  assert.ok(logs[0].text.includes("54635"));
  assert.ok(logs[1].text.includes("0xa21801e7a4cee367f6dc7b0f93dc7d3c6755a09b9ec5a64f2467fb457ae253b9"));
  assert.ok(logs[1].text.includes("0x56B0...44e5"));

  // Stage 2 verifies Block #415022
  assert.ok(logs[7].text.includes("Block #415022"));
  assert.ok(logs[7].text.includes("0x463D...7c01"));
});
