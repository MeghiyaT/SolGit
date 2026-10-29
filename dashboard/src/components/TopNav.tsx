"use client";

import React, { useState } from "react";
import { GitBranch, Search, Shield, Copy, Check, ExternalLink } from "lucide-react";
import { CONTRACTS } from "../lib/data";

export interface TopNavProps {
  onOpenCommandPalette: () => void;
  onCopyAddress: (address: string, label?: string) => void;
}

export function TopNav({ onOpenCommandPalette, onCopyAddress }: TopNavProps) {
  const [copied, setCopied] = useState(false);

  const fullRouterAddress = CONTRACTS.router;
  const shortRouterAddress = `${fullRouterAddress.slice(0, 6)}...${fullRouterAddress.slice(-4)}`;

  const handleCopyRouter = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(fullRouterAddress).catch(() => {});
    }
    onCopyAddress(fullRouterAddress, "Diamond Router Address");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0d1117]/85 backdrop-blur-xl px-4 py-2.5 shadow-sm shadow-black/40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap md:flex-nowrap">
        {/* Left Section: macOS Traffic Lights + Branding + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {/* macOS Window Controls */}
          <div className="flex items-center gap-1.5 mr-1" aria-label="macOS window controls">
            <span
              className="macos-traffic-dot macos-traffic-close hover:opacity-80 cursor-pointer"
              title="Close"
            />
            <span
              className="macos-traffic-dot macos-traffic-minimize hover:opacity-80 cursor-pointer"
              title="Minimize"
            />
            <span
              className="macos-traffic-dot macos-traffic-expand hover:opacity-80 cursor-pointer"
              title="Expand"
            />
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* SolGit Brand & Version Pill */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <GitBranch className="h-4 w-4 text-black stroke-[2.5]" />
            </div>
            <span className="font-bold tracking-tight text-white text-sm bg-gradient-to-r from-emerald-400 via-cyan-300 to-white bg-clip-text text-transparent">
              SolGit
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              v1.0.0
            </span>
          </div>

          <span className="text-zinc-600 hidden sm:inline">/</span>

          {/* Repository Breadcrumb */}
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs truncate">
            <span className="text-zinc-400 hover:text-zinc-200 cursor-pointer transition">
              mst-protocol
            </span>
            <span className="text-zinc-600">/</span>
            <span className="font-semibold text-zinc-100 truncate">
              solgit-vault-diamond
            </span>
          </nav>
        </div>

        {/* Center Section: Command Palette / Search Trigger */}
        <div className="flex-1 max-w-md mx-2 order-last md:order-none w-full md:w-auto">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-xs text-zinc-400 hover:text-zinc-200 transition-all shadow-inner group"
            title="Open Command Palette (⌘K)"
            aria-label="Open command palette"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="h-3.5 w-3.5 text-zinc-400 group-hover:text-emerald-400 transition" />
              <span className="truncate">Search or jump to...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 font-mono text-[10px] bg-white/[0.08] px-1.5 py-0.5 rounded border border-white/10 text-zinc-300 group-hover:border-emerald-500/30 group-hover:text-emerald-300 transition">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Section: MST Live Beacon + Permanent Diamond Router + Links */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap text-xs ml-auto">
          {/* MST Network Live Beacon */}
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-zinc-300"
            title="Connected to MST Blockchain Testnet"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-medium text-zinc-200 text-[11px]">MST Testnet</span>
            <span className="text-zinc-500 font-mono text-[11px] hidden sm:inline">ID: {CONTRACTS.chainId}</span>
            <span className="text-emerald-400/90 font-mono text-[11px] hidden md:inline">~3s</span>
          </div>

          {/* Permanent Diamond Router Address Pill */}
          <button
            type="button"
            onClick={handleCopyRouter}
            title={`Copy Diamond Router Address (${fullRouterAddress})`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40 text-zinc-300 transition group cursor-pointer"
          >
            <Shield className="h-3 w-3 text-cyan-400 flex-shrink-0" />
            <span className="font-mono text-[11px] text-zinc-300 group-hover:text-white transition">
              {shortRouterAddress}
            </span>
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400 flex-shrink-0 animate-in zoom-in-50" />
            ) : (
              <Copy className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 flex-shrink-0 transition" />
            )}
          </button>

          {/* Quick Links: Explorer & Faucet */}
          <div className="flex items-center gap-1.5">
            <a
              href={`${CONTRACTS.explorer}/address/${fullRouterAddress}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-medium transition"
              title="View SolGit Diamond on MSTScan"
            >
              <span className="hidden sm:inline">MSTScan</span>
              <span className="sm:hidden">Scan</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>

            <a
              href="https://faucet.mstblockchain.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium transition"
              title="Get MST Testnet Native Tokens"
            >
              <span>Faucet</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
export default TopNav;
