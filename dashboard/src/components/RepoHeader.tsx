"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Eye,
  GitFork,
  Star,
  ShieldCheck,
  ShieldAlert,
  Tag,
  ChevronDown,
} from "lucide-react";

export interface RepoHeaderProps {
  isGuardianActive?: boolean;
  onActionToast?: (msg: string) => void;
  onNavigateHome?: () => void;
  owner?: string;
  repoName?: string;
  isPrivate?: boolean;
}

export function RepoHeader({
  isGuardianActive = true,
  onActionToast,
  onNavigateHome,
  owner = "mst-protocol",
  repoName = "solgit-vault-diamond",
  isPrivate = false,
}: RepoHeaderProps) {
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(48);

  const [isWatching, setIsWatching] = useState(false);
  const [watchCount, setWatchCount] = useState(12);

  const [isForked, setIsForked] = useState(false);
  const [forkCount, setForkCount] = useState(3);

  const handleToggleStar = () => {
    const nextStarred = !isStarred;
    setIsStarred(nextStarred);
    setStarCount((prev) => (nextStarred ? prev + 1 : prev - 1));
    if (onActionToast) {
      onActionToast(
        nextStarred
          ? "Starred mst-protocol/solgit-vault-diamond ⭐"
          : "Removed star from mst-protocol/solgit-vault-diamond"
      );
    }
  };

  const handleToggleWatch = () => {
    const nextWatching = !isWatching;
    setIsWatching(nextWatching);
    setWatchCount((prev) => (nextWatching ? prev + 1 : prev - 1));
    if (onActionToast) {
      onActionToast(
        nextWatching
          ? "Watching mst-protocol/solgit-vault-diamond (All Activity)"
          : "Unwatched mst-protocol/solgit-vault-diamond"
      );
    }
  };

  const handleFork = () => {
    if (!isForked) {
      setIsForked(true);
      setForkCount((prev) => prev + 1);
      if (onActionToast) {
        onActionToast("Forked mst-protocol/solgit-vault-diamond to personal workspace 🍴");
      }
    } else {
      if (onActionToast) {
        onActionToast("Already forked to developer/solgit-vault-diamond");
      }
    }
  };

  return (
    <div className="w-full border-b border-white/[0.08] bg-[#0d1117]/80 backdrop-blur-md pt-5 pb-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-3.5">
        {/* Top row: Title & Breadcrumbs + Segmented Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          {/* Right: macOS Segmented Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Watch / Notifications Segmented Button */}
            <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] hover:border-white/20 transition shadow-sm backdrop-blur-sm">
              <button
                type="button"
                onClick={handleToggleWatch}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-l-lg transition ${
                  isWatching
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                }`}
                title="Notifications"
                aria-label="Toggle notifications watch"
              >
                <Eye className={`w-3.5 h-3.5 ${isWatching ? "text-emerald-400" : "text-zinc-400"}`} />
                <span>{isWatching ? "Watching" : "Watch"}</span>
                <ChevronDown className="w-3 h-3 text-zinc-500 ml-0.5" />
              </button>
              <span className="flex items-center px-2.5 text-xs font-mono text-zinc-300 border-l border-white/10 bg-black/20 rounded-r-lg">
                {watchCount}
              </span>
            </div>

            {/* Fork Segmented Button */}
            <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] hover:border-white/20 transition shadow-sm backdrop-blur-sm">
              <button
                type="button"
                onClick={handleFork}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-l-lg transition ${
                  isForked
                    ? "bg-cyan-500/15 text-cyan-300"
                    : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                }`}
                title="Fork repository"
                aria-label="Fork repository"
              >
                <GitFork className={`w-3.5 h-3.5 ${isForked ? "text-cyan-400" : "text-zinc-400"}`} />
                <span>{isForked ? "Forked" : "Fork"}</span>
                <ChevronDown className="w-3 h-3 text-zinc-500 ml-0.5" />
              </button>
              <span className="flex items-center px-2.5 text-xs font-mono text-zinc-300 border-l border-white/10 bg-black/20 rounded-r-lg">
                {forkCount}
              </span>
            </div>

            {/* Star Segmented Button with delightful interactive toggle */}
            <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] hover:border-white/20 transition shadow-sm backdrop-blur-sm">
              <button
                type="button"
                onClick={handleToggleStar}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-l-lg transition active:scale-95 ${
                  isStarred
                    ? "bg-amber-500/15 text-amber-300"
                    : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                }`}
                title={isStarred ? "Unstar repository" : "Star repository"}
                aria-label="Toggle star"
              >
                <Star
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isStarred
                      ? "text-amber-400 fill-amber-400 scale-110"
                      : "text-zinc-400 hover:text-amber-300"
                  }`}
                />
                <span>{isStarred ? "Starred" : "Star"}</span>
                <ChevronDown className="w-3 h-3 text-zinc-500 ml-0.5" />
              </button>
              <span className="flex items-center px-2.5 text-xs font-mono text-zinc-300 border-l border-white/10 bg-black/20 rounded-r-lg">
                {starCount}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom row: Guardian status badge + Topic Tags */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          {/* Guardian defense status badge */}
          {isGuardianActive ? (
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium shadow-sm shadow-emerald-950/40"
              title="Soft-Fail Invariant Guard active: Automatically rolls back bad facet upgrades"
              aria-label="Guardian Active: Soft-Fail Invariant Guard"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="font-semibold text-white">Guardian Active:</span>
              <span className="font-mono text-[11px] text-emerald-300">
                Soft-Fail Invariant Guard
              </span>
              <span className="hidden sm:inline-block text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-200 font-mono">
                OUTFLOW_CAP PROTECTED
              </span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium shadow-sm"
              title="Guardian monitoring mode"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="font-semibold text-white">Guardian Standby:</span>
              <span className="font-mono text-[11px] text-amber-300">
                Monitoring Mode
              </span>
            </div>
          )}

          {/* Topic Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono">
              <Tag className="w-3 h-3 text-emerald-400" />
              diamond-proxy
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 font-mono">
              erc-2535
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/25 font-mono">
              self-healing
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 border border-white/10 font-mono">
              chain-91562037
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RepoHeader;
