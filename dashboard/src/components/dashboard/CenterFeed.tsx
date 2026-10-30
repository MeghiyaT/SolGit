"use client";

import React, { useMemo } from "react";
import {
  GitPullRequest,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield,
  Layers,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { formatAddress } from "../../lib/mstChain";
import type { PullRequestItem, RollbackEvent } from "../../lib/types";

export interface CenterFeedProps {
  address: string | null;
  nickname?: string | null;
  pullRequests: PullRequestItem[];
  recentEvents: RollbackEvent[];
  onSelectRepo: (repoId: string) => void;
  onNavigatePR: (prId: number) => void;
  onSimulateHack?: () => void;
  onRollback?: () => void;
}

export function CenterFeed({
  address,
  nickname,
  pullRequests,
  recentEvents,
  onSelectRepo,
  onNavigatePR,
  onSimulateHack,
  onRollback,
}: CenterFeedProps) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const timeGreeting =
      hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const name = nickname || (address ? formatAddress(address, 6, 4) : "Explorer");
    return `${timeGreeting}, ${name}!`;
  }, [address, nickname]);

  return (
    <div className="space-y-6 text-xs text-[#c9d1d9]" aria-label="Center Workspace">
      {/* ─────────────────────────────────────────────────────────────
          Personalized Greeting Banner (Zero Copilot Search Box)
          ───────────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#161b22] to-[#21262d] border border-[#30363d] shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h1 className="text-lg font-bold text-[#f0f6fc] tracking-tight">{greeting}</h1>
          </div>
          <p className="text-xs text-[#8b949e] max-w-xl leading-relaxed">
            Welcome to SolGit — Git-style smart contract version control & AI self-healing on the MST Coral Testnet (Chain ID 54635).
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          Recent Pull Requests Widget
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#161b22] border border-[#30363d] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]/60">
          <div className="flex items-center gap-2 font-semibold text-[#f0f6fc] text-xs">
            <GitPullRequest className="w-4 h-4 text-[#58a6ff]" />
            <span>Recent Pull Requests</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#21262d] border border-[#30363d] text-[10px] text-[#8b949e]">
              {pullRequests.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectRepo("repo-1")}
            className="text-[11px] text-[#58a6ff] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View repository PRs</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-[#30363d]">
          {pullRequests.map((pr) => (
            <div
              key={pr.id}
              onClick={() => onNavigatePR(pr.id)}
              className="p-4 hover:bg-[#21262d]/50 transition cursor-pointer flex items-start justify-between gap-3 group"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      pr.status === "open"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : pr.status === "merged"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                        : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/30"
                    }`}
                  >
                    <GitPullRequest className="w-3 h-3" />
                    <span className="capitalize">{pr.status}</span>
                  </span>

                  <h3 className="font-semibold text-xs text-[#f0f6fc] group-hover:text-[#58a6ff] transition truncate">
                    #{pr.id} {pr.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#8b949e] flex-wrap">
                  <span className="font-mono text-[#c9d1d9]">
                    {pr.branchTo} &larr; {pr.branchFrom}
                  </span>
                  <span>•</span>
                  <span>by {formatAddress(pr.author, 6, 4)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{pr.createdAt}</span>
                  </span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-[11px] text-emerald-400 font-mono font-medium">
                  +{pr.additions}
                </span>{" "}
                <span className="text-[11px] text-rose-400 font-mono font-medium">
                  -{pr.deletions}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          Recent Smart Contract Activity
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#161b22] border border-[#30363d] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]/60">
          <div className="flex items-center gap-2 font-semibold text-[#f0f6fc] text-xs">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Recent Smart Contract Activity</span>
          </div>
          <span className="text-[11px] text-[#8b949e]">MST Blockchain Testnet</span>
        </div>

        <div className="divide-y divide-[#30363d]">
          {/* Static Activity 1: VersionRegistry Init */}
          <div className="p-4 flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#f0f6fc]">
                  EIP-2535 Diamond Proxy Registered
                </span>
                <span className="text-[11px] text-[#8b949e]">2 hours ago</span>
              </div>
              <p className="text-[11px] text-[#8b949e]">
                VaultV1 implementation facet attached to Diamond router with selector <code>0x2e1a7d4d</code>.
              </p>
              <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400">
                <span>Commit: 0xd6cde33a</span>
                <span>•</span>
                <span>Tx: 0x937b...18d7</span>
              </div>
            </div>
          </div>

          {/* Dynamic Rollback / Hack Events */}
          {recentEvents.length > 0 &&
            recentEvents.map((evt) => (
              <div key={evt.id} className="p-4 flex items-start gap-3 bg-rose-500/[0.04]">
                <div className="p-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-rose-400">
                      Guardian Intercept: {evt.status}
                    </span>
                    <span className="text-[11px] text-[#8b949e]">{evt.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-[#c9d1d9]">
                    Invariant violated: <code className="text-rose-300">{evt.invariant}</code>. Reverted to stable Version {evt.goodVersion}.
                  </p>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-[#8b949e]">
                    <span>Selector: {evt.selector}</span>
                    <span>•</span>
                    <span>Tx: {evt.txHash.slice(0, 10)}...</span>
                  </div>
                </div>
              </div>
            ))}

          {/* Interactive Quick Simulation Action */}
          <div className="p-4 bg-[#0d1117]/40 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-[11px] text-[#8b949e]">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulate exploit attack vector against Diamond Proxy:</span>
            </div>
            <div className="flex items-center gap-2">
              {onSimulateHack && (
                <button
                  type="button"
                  onClick={onSimulateHack}
                  className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-medium transition cursor-pointer"
                >
                  Simulate Exploit
                </button>
              )}
              {onRollback && (
                <button
                  type="button"
                  onClick={onRollback}
                  className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium transition cursor-pointer"
                >
                  Trigger Guardian Rollback
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
