import test from "node:test";
import assert from "node:assert/strict";
import { formatVaultBalance, fetchOnChainBalance, getCoralPublicClient } from "../hooks/useOnChainVault.ts";
import { MST_CORAL_CHAIN_ID, MST_RPC_URL } from "../lib/mstChain.ts";

test("formatVaultBalance formats wei into readable ether string with 4 decimals", () => {
  assert.equal(formatVaultBalance(BigInt(0)), "0.0000");
  assert.equal(formatVaultBalance("0"), "0.0000");
  assert.equal(formatVaultBalance(null as unknown as bigint), "0.0000");
  assert.equal(formatVaultBalance(undefined as unknown as bigint), "0.0000");

  // 15 tMSTC = 15 * 10^18 wei
  const fifteenEther = BigInt("15000000000000000000");
  assert.equal(formatVaultBalance(fifteenEther), "15.0000");

  // 0.5 tMSTC = 0.5 * 10^18 wei
  const halfEther = BigInt("500000000000000000");
  assert.equal(formatVaultBalance(halfEther), "0.5000");

  // Fractional precision
  const fractional = BigInt("12345600000000000000");
  assert.equal(formatVaultBalance(fractional), "12.3456");
});

test("getCoralPublicClient is configured strictly for MST Coral Testnet", () => {
  const client = getCoralPublicClient();
  assert.equal(client.chain?.id, MST_CORAL_CHAIN_ID);
  assert.equal(client.chain?.id, 54635);
  assert.equal(client.transport.url, MST_RPC_URL);
  assert.equal(client.transport.url, "https://coralrpc.mstblockchain.com");
});

test("fetchOnChainBalance returns 0n safely for invalid or undefined address", async () => {
  const zeroForNull = await fetchOnChainBalance(undefined);
  assert.equal(zeroForNull, BigInt(0));

  const zeroForInvalid = await fetchOnChainBalance("0xinvalid");
  assert.equal(zeroForInvalid, BigInt(0));
});
