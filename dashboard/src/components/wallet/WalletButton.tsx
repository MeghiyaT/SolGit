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
  User,
  X,
} from "lucide-react";
import { useWeb3Wallet } from "../../hooks/useWeb3Wallet";
import { formatAddress, MST_EXPLORER_URL, MST_FAUCET_URL, MST_CHAIN_ID } from "../../lib/mstChain";
import { IdenticonAvatar } from "./IdenticonAvatar";

export interface WalletButtonProps {
  onNotify?: (title: string, desc?: string, type?: "info" | "success" | "warning" | "error") => void;
  onEditNickname?: () => void;
}

export function WalletButton({ onNotify, onEditNickname }: WalletButtonProps) {
  const {
    checksumAddress,
    nickname,
    balance,
    isConnecting,
    isConnected,
    isWrongNetwork,
    error,
    connectWallet,
    connectManualAddress,
    disconnectWallet,
    switchNetwork,
  } = useWeb3Wallet();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualInput, setManualInput] = useState("");
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
      <div className="relative flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleConnect}
          disabled={isConnecting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition shadow-sm border border-[#2ea043]/30 disabled:opacity-60 cursor-pointer"
          title="Connect BridgeKey Wallet (EVM)"
        >
          {isConnecting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wallet className="w-3.5 h-3.5" />
          )}
          <span>{isConnecting ? "Connecting..." : "Connect BridgeKey"}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowManualModal(true)}
          className="px-2 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] border border-[#30363d] text-xs transition cursor-pointer"
          title="Connect via BridgeKey Address Directly"
        >
          Paste Address
        </button>

        {showManualModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Connect BridgeKey Address</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="text-[#8b949e] hover:text-white p-1 rounded transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#8b949e] leading-relaxed">
                Copy your address from BridgeKey (e.g. <code className="text-emerald-400">0x0318A1Df19a78f6784CbDDcE768EEF970C561493</code>) and paste it below to connect directly with zero gas fees.
              </p>

              <div>
                <label className="block text-xs text-[#c9d1d9] font-medium mb-1">
                  BridgeKey EVM Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-xs font-mono text-white outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-1.5 rounded-md border border-[#30363d] text-xs text-[#8b949e] hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!manualInput.trim()) return;
                    await connectManualAddress(manualInput.trim());
                    setShowManualModal(false);
                    if (onNotify) {
                      onNotify("Connected to BridgeKey", "Connected via direct address authorization.", "success");
                    }
                  }}
                  className="px-3 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition cursor-pointer"
                >
                  Connect Address
                </button>
              </div>
            </div>
          </div>
        )}
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

        <div className="flex items-center gap-1.5">
          {nickname ? (
            <span className="font-semibold text-[#f0f6fc]">{nickname}</span>
          ) : (
            <span className="font-medium text-[#f0f6fc] font-mono">{formatAddress(checksumAddress, 5, 4)}</span>
          )}
          {balance !== null && (
            <span className="text-[#8b949e] font-mono hidden sm:inline text-[11px]">
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
          <span className="h-2 w-2 rounded-full bg-emerald-500 hidden sm:inline-block" title="Connected to MST Coral Testnet" />
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
            <div className="flex items-center justify-between text-[11px] text-[#8b949e] mb-1">
              <span>Signed in as</span>
              {nickname && <span className="font-semibold text-emerald-400">{nickname}</span>}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[#f0f6fc] text-[11px] truncate select-all" title={checksumAddress}>
                {checksumAddress}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition cursor-pointer"
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
                  <span>Switch to Coral</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Coral Testnet ({MST_CHAIN_ID})</span>
                </span>
              )}
            </div>
          </div>

          {/* Actions & Links */}
          <div className="py-1 border-b border-[#30363d]">
            {onEditNickname && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onEditNickname();
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#58a6ff] transition cursor-pointer text-left"
              >
                <span className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#8b949e]" />
                  <span>{nickname ? "Edit Nickname" : "Set Nickname"}</span>
                </span>
              </button>
            )}
            <a
              href={`${MST_EXPLORER_URL}/address/${checksumAddress}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-1.5 text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#58a6ff] transition"
            >
              <span>View on Coral Explorer</span>
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
