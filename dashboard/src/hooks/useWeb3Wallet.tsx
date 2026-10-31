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
} from "viem";
import {
  MST_CHAIN_ID,
  MST_CORAL_CHAIN_ID,
  SUPPORTED_CHAIN_IDS,
  getMSTChainConfig,
} from "../lib/mstChain";
import type { Web3WalletState } from "../lib/types";

export interface EVMProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isBridgeKey?: boolean;
  isPhantom?: boolean;
  isMST?: boolean;
  name?: string;
}

export function getEVMProvider(): EVMProvider | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    ethereum?: EVMProvider & {
      providers?: EVMProvider[];
    };
    bridgekey?: EVMProvider;
    bridgeKey?: EVMProvider;
    mst?: EVMProvider;
  };

  if (win.bridgekey) return win.bridgekey;
  if (win.bridgeKey) return win.bridgeKey;
  if (win.mst) return win.mst;

  if (Array.isArray(win.ethereum?.providers)) {
    const bk = win.ethereum.providers.find(
      (p) => p.isBridgeKey || p.isMST || p.name?.toLowerCase().includes("bridgekey")
    );
    if (bk) return bk;
    const nonPhantom = win.ethereum.providers.find((p) => !p.isPhantom);
    if (nonPhantom) return nonPhantom;
  }

  return win.ethereum || null;
}

export interface Web3WalletContextValue extends Web3WalletState {
  connectWallet: () => Promise<void>;
  connectManualAddress: (address: string) => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (desiredChainId?: number) => Promise<void>;
  setNickname: (name: string) => void;
}

const DISCONNECTED_KEY = "solgit_wallet_manual_disconnected";

const Web3WalletContext = createContext<Web3WalletContextValue | null>(null);

export function Web3WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<Web3WalletState>({
    address: null,
    checksumAddress: null,
    nickname: null,
    balance: null,
    chainId: null,
    isConnecting: false,
    isConnected: false,
    isWrongNetwork: false,
    error: null,
  });

  const activeAddressRef = useRef<`0x${string}` | null>(null);

  const setNickname = useCallback((nickname: string) => {
    setWalletState((prev) => ({ ...prev, nickname }));
  }, []);

  const fetchBalance = useCallback(async (address: `0x${string}`, targetChainId?: number | null) => {
    try {
      const config = getMSTChainConfig(targetChainId);
      const publicClient = createPublicClient({
        chain: config.chain,
        transport: http(config.rpcUrl),
      });
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
          nickname: null,
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

        if (!currentChainId) {
          const provider = getEVMProvider();
          if (provider) {
            try {
              const hex = (await provider.request({ method: "eth_chainId" })) as string;
              currentChainId = parseInt(hex, 16);
            } catch {}
          }
        }

        const isWrong =
          currentChainId !== null &&
          !SUPPORTED_CHAIN_IDS.includes(currentChainId as typeof SUPPORTED_CHAIN_IDS[number]);

        setWalletState((prev) => ({
          ...prev,
          address: raw,
          checksumAddress: checksum,
          balance: prev.balance,
          chainId: currentChainId,
          isConnecting: false,
          isConnected: true,
          isWrongNetwork: isWrong,
          error: isWrong
            ? `Connected to unsupported chain (ID: ${currentChainId}). Please switch to MST Testnet (91562037) or MST Coral Testnet (54635).`
            : null,
        }));

        // Query balance on active MST chain
        fetchBalance(checksum as `0x${string}`, currentChainId);

        // Fetch user nickname
        fetch(`/api/user?address=${checksum}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.user?.nickname) {
              setWalletState((prev) => ({ ...prev, nickname: data.user.nickname }));
            }
          })
          .catch(() => {});
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
    const targetProvider = getEVMProvider();
    if (!targetProvider) {
      setWalletState((prev) => ({
        ...prev,
        error: "No EVM wallet detected. Please install BridgeKey or a compatible Web3 browser extension.",
      }));
      return;
    }

    try {
      localStorage.removeItem(DISCONNECTED_KEY);
    } catch {}

    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = (await targetProvider.request({
        method: "eth_requestAccounts",
      })) as string[];

      const chainIdHex = (await targetProvider.request({
        method: "eth_chainId",
      })) as string;

      await updateAccountState(accounts, chainIdHex);
    } catch (err: unknown) {
      let message = "User rejected wallet connection";
      if (err instanceof Error) {
        message = err.message;
      } else if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message: unknown }).message === "string"
      ) {
        message = (err as { message: string }).message;
      }

      const code =
        err && typeof err === "object" && "code" in err ? (err as { code: unknown }).code : null;

      if (
        code === 4001 ||
        message.toLowerCase().includes("user rejected") ||
        message.toLowerCase().includes("rejected")
      ) {
        message =
          "Connection request was cancelled or dismissed in BridgeKey. Please click 'Connect BridgeKey' and approve the prompt.";
      } else if (code === -32002 || message.toLowerCase().includes("already pending")) {
        try {
          const existingAccounts = (await targetProvider.request({
            method: "eth_accounts",
          })) as string[];
          if (existingAccounts && existingAccounts.length > 0) {
            const chainIdHex = (await targetProvider.request({
              method: "eth_chainId",
            })) as string;
            await updateAccountState(existingAccounts, chainIdHex);
            return;
          }
        } catch {}

        message =
          "Connection request is pending in BridgeKey. Click the purple BridgeKey icon in your browser toolbar to approve.";
      }

      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: message,
      }));
    }
  }, [updateAccountState]);

  const connectManualAddress = useCallback(
    async (manualAddress: string) => {
      const clean = manualAddress.trim();
      if (!clean) return;
      try {
        const checksum = getAddress(clean);
        activeAddressRef.current = checksum as `0x${string}`;

        try {
          localStorage.removeItem(DISCONNECTED_KEY);
        } catch {}

        setWalletState((prev) => ({
          ...prev,
          address: checksum as `0x${string}`,
          checksumAddress: checksum,
          chainId: MST_CHAIN_ID,
          isConnecting: false,
          isConnected: true,
          isWrongNetwork: false,
          error: null,
        }));

        fetchBalance(checksum as `0x${string}`, MST_CHAIN_ID);

        fetch(`/api/user?address=${checksum}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.user?.nickname) {
              setWalletState((prev) => ({ ...prev, nickname: data.user.nickname }));
            }
          })
          .catch(() => {});
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Invalid Ethereum address format";
        setWalletState((prev) => ({ ...prev, error: msg }));
      }
    },
    [fetchBalance]
  );

  const disconnectWallet = useCallback(() => {
    try {
      localStorage.setItem(DISCONNECTED_KEY, "true");
    } catch {}

    activeAddressRef.current = null;
    setWalletState({
      address: null,
      checksumAddress: null,
      nickname: null,
      balance: null,
      chainId: null,
      isConnecting: false,
      isConnected: false,
      isWrongNetwork: false,
      error: null,
    });
  }, []);

  const switchNetwork = useCallback(async (desiredChainId?: number) => {
    const targetProvider = getEVMProvider();
    if (!targetProvider) {
      return;
    }

    const targetId = desiredChainId || MST_CORAL_CHAIN_ID;
    const targetChainHex = `0x${targetId.toString(16)}`;
    const targetConfig = getMSTChainConfig(targetId);

    try {
      await targetProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetChainHex }],
      });
      setWalletState((prev) => ({
        ...prev,
        chainId: targetId,
        isWrongNetwork: false,
        error: null,
      }));
      if (activeAddressRef.current) {
        fetchBalance(activeAddressRef.current, targetId);
      }
    } catch (switchError: unknown) {
      if (
        switchError &&
        typeof switchError === "object" &&
        "code" in switchError &&
        (switchError as { code: number }).code === 4902
      ) {
        try {
          await targetProvider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: targetChainHex,
                chainName: targetConfig.name,
                nativeCurrency: {
                  name: "MST Coin",
                  symbol: "tMSTC",
                  decimals: 18,
                },
                rpcUrls: [targetConfig.rpcUrl],
                blockExplorerUrls: [targetConfig.explorerUrl],
              },
            ],
          });
          setWalletState((prev) => ({
            ...prev,
            chainId: targetId,
            isWrongNetwork: false,
            error: null,
          }));
          if (activeAddressRef.current) {
            fetchBalance(activeAddressRef.current, targetId);
          }
        } catch (addError: unknown) {
          const msg = addError instanceof Error ? addError.message : "Failed to add MST network";
          setWalletState((prev) => ({ ...prev, error: msg }));
        }
      } else {
        const msg = switchError instanceof Error ? switchError.message : "Failed to switch network";
        setWalletState((prev) => ({ ...prev, error: msg }));
      }
    }
  }, [fetchBalance]);

  // Listen to provider events (runs once on mount)
  useEffect(() => {
    const targetProvider = getEVMProvider();
    if (!targetProvider) {
      return;
    }

    let isManuallyDisconnected = false;
    try {
      isManuallyDisconnected = localStorage.getItem(DISCONNECTED_KEY) === "true";
    } catch {}

    if (!isManuallyDisconnected) {
      Promise.all([
        targetProvider.request({ method: "eth_accounts" }).catch(() => []),
        targetProvider.request({ method: "eth_chainId" }).catch(() => null),
      ]).then(([accs, chainIdHex]) => {
        const accounts = accs as string[];
        if (accounts && accounts.length > 0) {
          updateAccountState(accounts, chainIdHex as string);
        }
      });
    }

    const handleAccountsChanged = (accs: unknown) => {
      const accounts = accs as string[];
      if (accounts && accounts.length > 0) {
        try {
          localStorage.removeItem(DISCONNECTED_KEY);
        } catch {}
      }
      updateAccountState(accounts);
    };

    const handleChainChanged = (chainIdHex: unknown) => {
      const newChainId = parseInt(chainIdHex as string, 16);
      const isWrong =
        newChainId !== null &&
        !SUPPORTED_CHAIN_IDS.includes(newChainId as typeof SUPPORTED_CHAIN_IDS[number]);
      setWalletState((prev) => ({
        ...prev,
        chainId: newChainId,
        isWrongNetwork: isWrong,
        error: isWrong
          ? `Connected to unsupported chain (ID: ${newChainId}). Please switch to MST Testnet (91562037) or MST Coral Testnet (54635).`
          : null,
      }));
      if (activeAddressRef.current) {
        fetchBalance(activeAddressRef.current, newChainId);
      }
    };

    if (targetProvider.on) {
      targetProvider.on("accountsChanged", handleAccountsChanged);
      targetProvider.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (targetProvider.removeListener) {
        targetProvider.removeListener("accountsChanged", handleAccountsChanged);
        targetProvider.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [updateAccountState, fetchBalance]);

  const value: Web3WalletContextValue = {
    ...walletState,
    connectWallet,
    connectManualAddress,
    disconnectWallet,
    switchNetwork,
    setNickname,
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
