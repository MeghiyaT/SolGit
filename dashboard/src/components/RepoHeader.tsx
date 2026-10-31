"use client";

import React from "react";
import { BookOpen, ExternalLink } from "lucide-react";

export interface RepoHeaderProps {
  isGuardianActive?: boolean;
  onActionToast?: (msg: string) => void;
  onNavigateHome?: () => void;
  owner?: string;
  repoName?: string;
  isPrivate?: boolean;
}

export function RepoHeader({
  onNavigateHome,
  owner = "mst-protocol",
  repoName = "solgit-vault-diamond",
  isPrivate = false,
}: RepoHeaderProps) {
  return (
    <div className="w-full border-b border-white/[0.08] bg-[#0d1117]/80 backdrop-blur-md py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Repository Title & Badges */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-300 shadow-sm flex-shrink-0">
            <BookOpen className="w-4 h-4 text-zinc-300" />
          </div>

          <nav aria-label="Repository identifier" className="flex items-center gap-1.5 text-base sm:text-lg min-w-0">
            {onNavigateHome && (
              <>
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="text-[#8b949e] hover:text-[#58a6ff] transition cursor-pointer font-medium"
                  title="Return to SolGit Dashboard"
                >
                  SolGit
                </button>
                <span className="text-[#30363d] select-none">/</span>
              </>
            )}
            <span className="text-[#8b949e] font-normal truncate">
              {owner}
            </span>
            <span className="text-[#30363d] select-none">/</span>
            <span className="font-bold text-[#f0f6fc] tracking-tight truncate">
              {repoName}
            </span>
          </nav>

          <span className="text-xs px-2.5 py-0.5 rounded-full border border-[#30363d] bg-[#21262d] text-[#c9d1d9] font-medium">
            {isPrivate ? "Private" : "Public"}
          </span>
        </div>

        {/* Right: Clean Network Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-medium text-white">MST Coral Testnet</span>
            <span className="text-zinc-500 font-mono text-[11px]">54635</span>
          </div>

          <a
            href="https://coralscan.mstblockchain.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default RepoHeader;
