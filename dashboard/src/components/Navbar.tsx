"use client";

import React from "react";
import { GitBranch, Shield, Activity, ExternalLink, Copy, Check } from "lucide-react";

export function Navbar() {
  const [copied, setCopied] = React.useState(false);
  const routerAddr = "0x9E73...Router";
  const registryAddr = "0x5A12...Registry";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <GitBranch className="h-6 w-6 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-300 to-white bg-clip-text text-transparent">
                SolGit
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-zinc-400">Git-Style Version Control & Self-Healing Rollback</p>
          </div>
        </div>

        {/* Network & Contract Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* MST Network Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-300 font-medium">MST Testnet</span>
            <span className="text-zinc-500 font-mono">ID: 91562037</span>
            <span className="text-emerald-400/80 font-mono">~3s</span>
          </div>

          {/* Router Address */}
          <div
            onClick={() => handleCopy("0x9E73f8F...SolGitRouter")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer text-zinc-400 transition"
          >
            <Shield className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-zinc-300 font-mono">Router: {routerAddr}</span>
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 hover:text-zinc-200" />}
          </div>

          {/* Faucet Link */}
          <a
            href="https://faucet.mstblockchain.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition font-medium"
          >
            Faucet <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </header>
  );
}
