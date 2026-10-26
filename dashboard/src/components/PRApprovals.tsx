"use client";

import React, { useState } from "react";
import { GitPullRequest, CheckCircle2, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";

interface PRApprovalsProps {
  onMergeFix: () => void;
  isMerged: boolean;
}

export function PRApprovals({ onMergeFix, isMerged }: PRApprovalsProps) {
  const [merging, setMerging] = useState(false);

  const handleMerge = () => {
    setMerging(true);
    setTimeout(() => {
      setMerging(false);
      onMergeFix();
    }, 1200);
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <GitPullRequest className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">AI Self-Healing Pull Requests</h2>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-800/40">
          <Sparkles className="h-3 w-3" /> Auto-Fix Active
        </span>
      </div>

      <div className="mt-6">
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                PR #42: [SolGit AI Fix] Secure withdraw underflow patch
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                solgit-fix-0x2e1a7d-v2
              </span>
            </div>
            <span className="text-xs text-zinc-500">Auto-created by Watcher</span>
          </div>

          <p className="mt-3 text-xs text-zinc-300 leading-relaxed">
            Automated patch generated following incident{" "}
            <code className="text-rose-400 bg-rose-950/50 px-1 py-0.5 rounded font-mono">
              OUTFLOW_CAP
            </code>{" "}
            violation. Restores balance verification check{" "}
            <code className="text-emerald-300 bg-emerald-950/50 px-1 py-0.5 rounded font-mono">
              vs.balances[msg.sender] &lt; amount
            </code>{" "}
            and removes unsafe unchecked arithmetic in withdraw().
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Tests: 36/36 Passing
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">Target: withdraw(uint256)</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://github.com/Study/SolGit/pull/simulated-2"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition"
              >
                GitHub <ExternalLink className="h-3 w-3" />
              </a>

              {isMerged ? (
                <button
                  disabled
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Patch Merged & Promoted
                </button>
              ) : (
                <button
                  onClick={handleMerge}
                  disabled={merging}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:opacity-90 transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {merging ? (
                    <span>Merging on MST...</span>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-black" />
                      <span>Review & Merge Hotfix</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
