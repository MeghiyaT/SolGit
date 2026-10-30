"use client";

import { useState, useEffect, useCallback } from "react";
import {
  createPublicClient,
  formatEther,
  getAddress,
  http,
  type PublicClient,
} from "viem";
import { mstTestnet, MST_CHAIN_ID, MST_RPC_URL, MST_EXPLORER_URL } from "../lib/mstChain";
import type { Web3WalletState } from "../lib/types";

// Public client for reading MST blockchain state
const publicClient: PublicClient = createPublicClient({
  chain: mstTestnet,
  transport: http(MST_RPC_URL),
});

export function useWeb3Wallet() {
  const [walletState, setWalletState] = useState<Web3WalletState>({
    address: null,
    checksumAddress: null,
    balance: null,
    chainId: null,
    isConnecting: false,
    isConnected: false,
    isWrongNetwork: false,
    error: null,
  });

  const fetchBalance = useCallback(async (address: `0x${string}`) => {
    try {
      const bal = await publicClient.getBalance({ address });
      const formatted = Number(formatEther(bal)).toFixed(4);
      setWalletState((prev) => ({
        ...prev,
        balance: formatted,
      }));
    } catch {
      setWalletState((prev) => ({
        ...prev,
        balance: "0.0000",
      }));
    }
  }, []);

  const updateAccountState = useCallback(
    async (accounts: string[], chainIdHex?: string | number) => {
      if (!accounts || accounts.length === 0) {
        setWalletState({
          address: null,
          checksumAddress: null,
          balance: null,
          chainId: null,
          isConnecting: false,
          isConnected: false,
          isWrongNetwork: false,
          error: null,
        });
        return;
      }

      try {
        const raw = accounts[0] as `0x${string}`;
        const checksum = getAddress(raw);
        let currentChainId = chainIdHex
          ? typeof chainIdHex === "string"
            ? parseInt(chainIdHex, 16)
            : chainIdHex
          : null;

        if (!currentChainId && typeof window !== "undefined" && (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<string> } }).ethereum) {
          const hex = await (window as unknown as { ethereum: { request: (args: { method: string }) => Promise<string> } }).ethereum.request({
            method: "eth_chainId",
          });
          currentChainId = parseInt(hex, 16);
        }

        const isWrong = currentChainId !== null && currentChainId !== MST_CHAIN_ID;

        setWalletState({
          address: raw,
          checksumAddress: checksum,
          balance: null,
          chainId: currentChainId,
          isConnecting: false,
          isConnected: true,
          isWrongNetwork: isWrong,
          error: isWrong ? `Connected to unsupported chain (ID: ${currentChainId}). Please switch to MST Testnet.` : null,
        });

        // Query balance on MST Testnet
        fetchBalance(checksum as `0x${string}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to resolve account address";
        setWalletState((prev) => ({
          ...prev,
          error: message,
          isConnecting: false,
        }));
      }
    },
    [fetchBalance]
  );

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !(window as unknown as { ethereum?: unknown }).ethereum) {
      setWalletState((prev) => ({
        ...prev,
        error: "No EVM wallet detected. Please install MetaMask, Rabby, or a Web3 browser extension.",
      }));
      return;
    }

    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const ethereum = (window as unknown as {
        ethereum: {
          request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        };
      }).ethereum;

      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      const chainIdHex = (await ethereum.request({
        method: "eth_chainId",
      })) as string;

      await updateAccountState(accounts, chainIdHex);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "User rejected wallet connection";
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: message,
      }));
    }
  }, [updateAccountState]);

  const disconnectWallet = useCallback(() => {
    setWalletState({
      address: null,
      checksumAddress: null,
      balance: null,
      chainId: null,
      isConnecting: false,
      isConnected: false,
      isWrongNetwork: false,
      error: null,
    });
  }, []);

  const switchNetwork = useCallback(async () => {
    if (typeof window === "undefined" || !(window as unknown as { ethereum?: unknown }).ethereum) {
      return;
    }

    const ethereum = (window as unknown as {
      ethereum: {
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      };
    }).ethereum;

    const targetChainHex = `0x${MST_CHAIN_ID.toString(16)}`;

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetChainHex }],
      });
      setWalletState((prev) => ({
        ...prev,
        chainId: MST_CHAIN_ID,
        isWrongNetwork: false,
        error: null,
      }));
    } catch (switchError: unknown) {
      // Code 4902 indicates that the chain has not been added to MetaMask
      if (
        switchError &&
        typeof switchError === "object" &&
        "code" in switchError &&
        (switchError as { code: number }).code === 4902
      ) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: targetChainHex,
                chainName: "MST Blockchain Testnet",
                nativeCurrency: {
                  name: "MST Coin",
                  symbol: "tMSTC",
                  decimals: 18,
                },
                rpcUrls: [MST_RPC_URL],
                blockExplorerUrls: [MST_EXPLORER_URL],
              },
            ],
          });
          setWalletState((prev) => ({
            ...prev,
            chainId: MST_CHAIN_ID,
            isWrongNetwork: false,
            error: null,
          }));
        } catch (addError: unknown) {
          const msg = addError instanceof Error ? addError.message : "Failed to add MST Testnet";
          setWalletState((prev) => ({ ...prev, error: msg }));
        }
      } else {
        const msg = switchError instanceof Error ? switchError.message : "Failed to switch network";
        setWalletState((prev) => ({ ...prev, error: msg }));
      }
    }
  }, []);

  // Listen to provider events
  useEffect(() => {
    if (typeof window === "undefined" || !(window as unknown as { ethereum?: unknown }).ethereum) {
      return;
    }

    const ethereum = (window as unknown as {
      ethereum: {
        request: (args: { method: string }) => Promise<unknown>;
        on: (event: string, handler: (...args: unknown[]) => void) => void;
        removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      };
    }).ethereum;

    // Check if already authorized
    ethereum
      .request({ method: "eth_accounts" })
      .then((accs) => {
        const accounts = accs as string[];
        if (accounts && accounts.length > 0) {
          updateAccountState(accounts);
        }
      })
      .catch(() => {});

    const handleAccountsChanged = (accs: unknown) => {
      updateAccountState(accs as string[]);
    };

    const handleChainChanged = (chainIdHex: unknown) => {
      setWalletState((prev) => {
        const newChainId = parseInt(chainIdHex as string, 16);
        const isWrong = newChainId !== MST_CHAIN_ID;
        return {
          ...prev,
          chainId: newChainId,
          isWrongNetwork: isWrong,
          error: isWrong ? `Connected to unsupported chain (ID: ${newChainId}). Please switch to MST Testnet.` : null,
        };
      });
      if (walletState.address) {
        fetchBalance(walletState.address);
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
        ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [updateAccountState, fetchBalance, walletState.address]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };
}
