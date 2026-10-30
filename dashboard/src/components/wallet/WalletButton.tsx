"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Wallet,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useWeb3Wallet } from "../../hooks/useWeb3Wallet";
import { formatAddress, MST_EXPLORER_URL, MST_FAUCET_URL, MST_CHAIN_ID } from "../../lib/mstChain";
import { IdenticonAvatar } from "./IdenticonAvatar";

export interface WalletButtonProps {
  onNotify?: (title: string, desc?: string, type?: "info" | "success" | "warning" | "error") => void;
}

export function WalletButton({ onNotify }: WalletButtonProps) {
  const {
    checksumAddress,
    balance,
    isConnecting,
    isConnected,
    isWrongNetwork,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWeb3Wallet();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notify on errors
  useEffect(() => {
    if (error && onNotify) {
      onNotify("Wallet Warning", error, "warning");
    }
  }, [error, onNotify]);

  const handleCopy = () => {
    if (!checksumAddress) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(checksumAddress).catch(() => {});
    }
    setCopied(true);
    if (onNotify) {
      onNotify("Address Copied", checksumAddress, "success");
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    await connectWallet();
  };

  if (!isConnected || !checksumAddress) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={handleConnect}
          disabled={isConnecting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition shadow-sm border border-[#2ea043]/30 disabled:opacity-60 cursor-pointer"
          title="Connect Web3 Wallet (MetaMask, Rabby, etc.)"
        >
          {isConnecting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wallet className="w-3.5 h-3.5" />
          )}
          <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs text-[#c9d1d9] transition cursor-pointer select-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <IdenticonAvatar address={checksumAddress} size={20} />

        <div className="flex items-center gap-1.5 font-mono">
          <span className="font-medium text-[#f0f6fc]">{formatAddress(checksumAddress, 5, 4)}</span>
          {balance !== null && (
            <span className="text-[#8b949e] hidden sm:inline">
              {balance} <span className="text-emerald-400">tMSTC</span>
            </span>
          )}
        </div>

        {isWrongNetwork ? (
          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-sans flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Wrong Net</span>
          </span>
        ) : (
          <span className="h-2 w-2 rounded-full bg-emerald-500 hidden sm:inline-block" title="Connected to MST Testnet" />
        )}

        <ChevronDown className="w-3 h-3 text-[#8b949e]" />
      </button>

      {/* GitHub-style Account Dropdown */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-lg bg-[#161b22] border border-[#30363d] shadow-2xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Header Info */}
          <div className="px-3 py-2 border-b border-[#30363d]">
            <div className="text-[11px] text-[#8b949e] mb-1">Signed in to SolGit as</div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[#f0f6fc] text-[11px] truncate select-all" title={checksumAddress}>
                {checksumAddress}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition"
                title="Copy Address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Network & Balance Details */}
          <div className="px-3 py-2.5 border-b border-[#30363d] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#8b949e]">Balance</span>
              <span className="font-mono text-[#f0f6fc] font-medium">
                {balance ?? "0.0000"} <span className="text-emerald-400">tMSTC</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8b949e]">Network</span>
              {isWrongNetwork ? (
                <button
                  type="button"
                  onClick={switchNetwork}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] transition flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Switch to MST</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>MST Testnet ({MST_CHAIN_ID})</span>
                </span>
              )}
            </div>
          </div>

          {/* Explorer & Faucet Links */}
          <div className="py-1 border-b border-[#30363d]">
            <a
              href={`${MST_EXPLORER_URL}/address/${checksumAddress}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-1.5 text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#58a6ff] transition"
            >
              <span>View on MST Explorer</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#8b949e]" />
            </a>
            <a
              href={MST_FAUCET_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-1.5 text-[#c9d1d9] hover:bg-[#21262d] hover:text-emerald-400 transition"
            >
              <span>Get Testnet tMSTC Faucet</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#8b949e]" />
            </a>
          </div>

          {/* Disconnect */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                disconnectWallet();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition text-left cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
