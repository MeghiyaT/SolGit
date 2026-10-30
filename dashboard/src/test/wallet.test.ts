import test from "node:test";
import assert from "node:assert/strict";
import { mstTestnet, formatAddress, generateIdenticonGradient } from "../lib/mstChain.ts";
import { getAddress } from "viem";

test("mstTestnet chain definition matches MST specification", () => {
  assert.equal(mstTestnet.id, 91562037);
  assert.equal(mstTestnet.name, "MST Blockchain Testnet");
  assert.equal(mstTestnet.nativeCurrency.symbol, "tMSTC");
  assert.equal(mstTestnet.nativeCurrency.decimals, 18);
  assert.equal(mstTestnet.rpcUrls.default.http[0], "https://testnetrpc.mstblockchain.com");
  assert.equal(mstTestnet.blockExplorers?.default.url, "https://testnet.mstscan.com");
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
