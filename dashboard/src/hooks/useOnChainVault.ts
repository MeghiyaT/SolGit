"use client";

import { useState, useEffect, useCallback } from "react";
import { createPublicClient, http, formatUnits, isAddress, getAddress } from "viem";
import { mstTestnet, MST_RPC_URL } from "../lib/mstChain.ts";

let cachedPublicClient: ReturnType<typeof createPublicClient> | null = null;

/**
 * Returns a singleton Viem PublicClient targeted directly at MST Coral Testnet.
 */
export function getCoralPublicClient() {
  if (!cachedPublicClient) {
    cachedPublicClient = createPublicClient({
      chain: mstTestnet,
      transport: http(MST_RPC_URL, {
        timeout: 10_000,
        retryCount: 2,
        retryDelay: 1000,
      }),
    });
  }
  return cachedPublicClient;
}

/**
 * Safely format wei into a 4-decimal ether string (e.g. 15.0000 tMSTC).
 */
export function formatVaultBalance(balanceWei?: bigint | string | number | null): string {
  if (balanceWei === undefined || balanceWei === null) {
    return "0.0000";
  }

  try {
    let weiBigInt: bigint;
    if (typeof balanceWei === "bigint") {
      weiBigInt = balanceWei;
    } else if (typeof balanceWei === "number") {
      weiBigInt = BigInt(Math.floor(balanceWei));
    } else {
      const trimmed = balanceWei.trim();
      if (!trimmed || isNaN(Number(trimmed))) {
        return "0.0000";
      }
      weiBigInt = BigInt(trimmed);
    }

    const etherString = formatUnits(weiBigInt, 18);
    const parsed = parseFloat(etherString);
    if (isNaN(parsed)) return "0.0000";
    return parsed.toFixed(4);
  } catch {
    return "0.0000";
  }
}

/**
 * Directly queries on-chain balance for a contract address from MST Coral Testnet.
 */
export async function fetchOnChainBalance(address?: string): Promise<bigint> {
  if (!address || typeof address !== "string" || !isAddress(address)) {
    return BigInt(0);
  }

  try {
    const client = getCoralPublicClient();
    const balance = await client.getBalance({ address: getAddress(address) });
    return balance;
  } catch (err) {
    console.error("[useOnChainVault] Failed to query on-chain balance:", err);
    return BigInt(0);
  }
}

export interface UseOnChainVaultReturn {
  balanceWei: bigint;
  balanceFormatted: string;
  tvlNumber: number;
  blockNumber: bigint | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to continuously track live on-chain balance and block telemetry from MST Coral Testnet.
 */
export function useOnChainVault(contractAddress?: string | null): UseOnChainVaultReturn {
  const [balanceWei, setBalanceWei] = useState<bigint>(BigInt(0));
  const [blockNumber, setBlockNumber] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(contractAddress && isAddress(contractAddress)));
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    if (!contractAddress || !isAddress(contractAddress)) {
      return;
    }

    const poll = async () => {
      try {
        const client = getCoralPublicClient();
        const [bal, block] = await Promise.all([
          client.getBalance({ address: getAddress(contractAddress) }),
          client.getBlockNumber().catch(() => null),
        ]);

        if (isMounted) {
          setBalanceWei(bal);
          if (block !== null) setBlockNumber(block);
          setIsLoading(false);
          setIsError(false);
        }
      } catch (err) {
        console.error("[useOnChainVault] Polling error:", err);
        if (isMounted) {
          setIsError(true);
          setIsLoading(false);
        }
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [contractAddress]);

  const refetch = useCallback(async () => {
    if (!contractAddress || !isAddress(contractAddress)) return;
    try {
      const client = getCoralPublicClient();
      const [bal, block] = await Promise.all([
        client.getBalance({ address: getAddress(contractAddress) }),
        client.getBlockNumber().catch(() => null),
      ]);
      setBalanceWei(bal);
      if (block !== null) setBlockNumber(block);
      setIsError(false);
    } catch {
      setIsError(true);
    }
  }, [contractAddress]);

  const effectiveWei = contractAddress && isAddress(contractAddress) ? balanceWei : BigInt(0);
  const balanceFormatted = formatVaultBalance(effectiveWei);
  const tvlNumber = parseFloat(balanceFormatted) || 0;

  return {
    balanceWei: effectiveWei,
    balanceFormatted,
    tvlNumber,
    blockNumber,
    isLoading,
    isError,
    refetch,
  };
}
