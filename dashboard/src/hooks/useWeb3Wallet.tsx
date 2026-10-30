"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  createPublicClient,
  formatEther,
  getAddress,
  http,
  type PublicClient,
} from "viem";
import { mstTestnet, MST_CHAIN_ID, MST_RPC_URL, MST_EXPLORER_URL } from "../lib/mstChain";
import type { Web3WalletState } from "../lib/types";

export interface Web3WalletContextValue extends Web3WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
}

const publicClient: PublicClient = createPublicClient({
  chain: mstTestnet,
  transport: http(MST_RPC_URL),
});

const DISCONNECTED_KEY = "solgit_wallet_manual_disconnected";

const Web3WalletContext = createContext<Web3WalletContextValue | null>(null);

export function Web3WalletProvider({ children }: { children: ReactNode }) {
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

  const activeAddressRef = useRef<`0x${string}` | null>(null);

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
        balance: prev.balance ?? "0.0000",
      }));
    }
  }, []);

  const updateAccountState = useCallback(
    async (accounts: string[], chainIdHex?: string | number) => {
      if (!accounts || accounts.length === 0) {
        activeAddressRef.current = null;
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
        activeAddressRef.current = checksum as `0x${string}`;

        let currentChainId = chainIdHex
          ? typeof chainIdHex === "string"
            ? parseInt(chainIdHex, 16)
            : chainIdHex
          : null;

        if (
          !currentChainId &&
          typeof window !== "undefined" &&
          (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<string> } }).ethereum
        ) {
          const hex = await (window as unknown as { ethereum: { request: (args: { method: string }) => Promise<string> } }).ethereum.request({
            method: "eth_chainId",
          });
          currentChainId = parseInt(hex, 16);
        }

        const isWrong = currentChainId !== null && currentChainId !== MST_CHAIN_ID;

        setWalletState((prev) => ({
          ...prev,
          address: raw,
          checksumAddress: checksum,
          // Preserve previous balance instead of flashing null
          balance: prev.balance,
          chainId: currentChainId,
          isConnecting: false,
          isConnected: true,
          isWrongNetwork: isWrong,
          error: isWrong ? `Connected to unsupported chain (ID: ${currentChainId}). Please switch to MST Testnet.` : null,
        }));

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

    // Clear manual disconnect flag on explicit connect
    try {
      localStorage.removeItem(DISCONNECTED_KEY);
    } catch {}

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
    try {
      localStorage.setItem(DISCONNECTED_KEY, "true");
    } catch {}

    activeAddressRef.current = null;
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

  // Listen to provider events (runs once on mount)
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

    // Check if manually disconnected by user
    let isManuallyDisconnected = false;
    try {
      isManuallyDisconnected = localStorage.getItem(DISCONNECTED_KEY) === "true";
    } catch {}

    if (!isManuallyDisconnected) {
      ethereum
        .request({ method: "eth_accounts" })
        .then((accs) => {
          const accounts = accs as string[];
          if (accounts && accounts.length > 0) {
            updateAccountState(accounts);
          }
        })
        .catch(() => {});
    }

    const handleAccountsChanged = (accs: unknown) => {
      const accounts = accs as string[];
      // If user switched accounts in metamask, clear manual disconnect
      if (accounts && accounts.length > 0) {
        try {
          localStorage.removeItem(DISCONNECTED_KEY);
        } catch {}
      }
      updateAccountState(accounts);
    };

    const handleChainChanged = (chainIdHex: unknown) => {
      const newChainId = parseInt(chainIdHex as string, 16);
      const isWrong = newChainId !== MST_CHAIN_ID;
      setWalletState((prev) => ({
        ...prev,
        chainId: newChainId,
        isWrongNetwork: isWrong,
        error: isWrong ? `Connected to unsupported chain (ID: ${newChainId}). Please switch to MST Testnet.` : null,
      }));
      if (activeAddressRef.current) {
        fetchBalance(activeAddressRef.current);
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
  }, [updateAccountState, fetchBalance]);

  const value: Web3WalletContextValue = {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };

  return (
    <Web3WalletContext.Provider value={value}>
      {children}
    </Web3WalletContext.Provider>
  );
}

export function useWeb3Wallet(): Web3WalletContextValue {
  const context = useContext(Web3WalletContext);
  if (!context) {
    throw new Error("useWeb3Wallet must be used within a Web3WalletProvider");
  }
  return context;
}

