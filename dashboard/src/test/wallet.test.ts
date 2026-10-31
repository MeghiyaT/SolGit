import test from "node:test";
import assert from "node:assert/strict";
import {
  mstTestnet,
  MST_CHAIN_ID,
  MST_CORAL_CHAIN_ID,
  MST_TESTNET_CHAIN_ID,
  SUPPORTED_CHAIN_IDS,
  MST_RPC_URL,
  MST_EXPLORER_URL,
  getMSTChainConfig,
  formatAddress,
  generateIdenticonGradient,
} from "../lib/mstChain.ts";
import { INITIAL_REPOSITORIES, INITIAL_SELECTORS, INITIAL_EVENTS, INITIAL_PULL_REQUESTS, CONTRACTS } from "../lib/data.ts";
import { getAddress } from "viem";

test("mstTestnet chain definition matches MST Coral Testnet specification", () => {
  assert.equal(mstTestnet.id, 54635);
  assert.equal(MST_CHAIN_ID, 54635);
  assert.equal(MST_CORAL_CHAIN_ID, 54635);
  assert.equal(MST_TESTNET_CHAIN_ID, 91562037);
  assert.deepEqual(Array.from(SUPPORTED_CHAIN_IDS), [54635, 91562037]);
  assert.equal(mstTestnet.name, "MST Coral Testnet");
  assert.equal(mstTestnet.nativeCurrency.symbol, "tMSTC");
  assert.equal(mstTestnet.nativeCurrency.decimals, 18);
  assert.equal(mstTestnet.rpcUrls.default.http[0], "https://coralrpc.mstblockchain.com");
  assert.equal(MST_RPC_URL, "https://coralrpc.mstblockchain.com");
  assert.equal(mstTestnet.blockExplorers?.default.url, "https://coral.mstscan.com");
  assert.equal(MST_EXPLORER_URL, "https://coral.mstscan.com");
  assert.equal(CONTRACTS.chainId, 54635);
  assert.equal(CONTRACTS.rpcUrl, "https://coralrpc.mstblockchain.com");
  assert.equal(CONTRACTS.explorer, "https://coral.mstscan.com");

  // Check multi-network config resolver
  const coralConfig = getMSTChainConfig(54635);
  assert.equal(coralConfig.id, 54635);
  assert.equal(coralConfig.name, "MST Coral Testnet");
  assert.equal(coralConfig.rpcUrl, "https://coralrpc.mstblockchain.com");

  const legacyConfig = getMSTChainConfig(91562037);
  assert.equal(legacyConfig.id, 91562037);
  assert.equal(legacyConfig.name, "MST Testnet");
  assert.equal(legacyConfig.rpcUrl, "https://testnetrpc.mstblockchain.com");
});

test("mock data is removed and starts as clean slate", () => {
  assert.equal(INITIAL_REPOSITORIES.length, 0);
  assert.equal(INITIAL_SELECTORS.length, 0);
  assert.equal(INITIAL_EVENTS.length, 0);
  assert.equal(INITIAL_PULL_REQUESTS.length, 0);
});

test("formatAddress produces truncated checksummed address", () => {
  const raw = "0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7";
  const checksummed = getAddress(raw);
  const formatted = formatAddress(checksummed);
  assert.equal(formatted, "0x8920...43e7");
});

test("generateIdenticonGradient produces deterministic CSS gradients", () => {
  const addr = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7";
  const grad1 = generateIdenticonGradient(addr);
  const grad2 = generateIdenticonGradient(addr);
  assert.equal(grad1, grad2);
  assert.match(grad1, /^linear-gradient/);
});
