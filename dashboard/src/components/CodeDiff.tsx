"use client";

import React, { useState } from "react";
import { GitCompare, AlertTriangle, ShieldCheck } from "lucide-react";
import { V1_CODE, V2_BUGGY_CODE, V2_FIXED_CODE } from "../lib/data";

export function CodeDiff() {
  const [comparisonMode, setComparisonMode] = useState<"v1_vs_v2" | "v2_vs_fixed">("v1_vs_v2");

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Code Diff & Vulnerability Inspector</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Compare facet bytecode logic, identify arithmetic bugs, and inspect AI-generated security patches
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs">
          <button
            onClick={() => setComparisonMode("v1_vs_v2")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              comparisonMode === "v1_vs_v2"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            v1 (Safe) ↔ v2 (Buggy)
          </button>
          <button
            onClick={() => setComparisonMode("v2_vs_fixed")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              comparisonMode === "v2_vs_fixed"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            v2 (Buggy) ↔ AI Fix (Patched)
          </button>
        </div>
      </div>

      {/* Vulnerability Alert Banner */}
      <div className="mt-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
        {comparisonMode === "v1_vs_v2" ? (
          <>
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-amber-300">Vulnerability Detected in VaultV2:</span>{" "}
              <span className="text-zinc-300">
                Line 44 uses unchecked subtraction{" "}
                <code className="text-amber-200 bg-amber-950/60 px-1 py-0.5 rounded">
                  unchecked &#123; balances -= amount &#125;
                </code>{" "}
                without checking if the caller has sufficient balance. An attacker can underflow their balance and drain vault funds.
              </span>
            </div>
          </>
        ) : (
          <>
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-emerald-300">AI Self-Healing Resolution:</span>{" "}
              <span className="text-zinc-300">
                SolGit AI Watcher automatically generated a pull request that restores strict balance verification, removes the unchecked block, and enforces Checks-Effects-Interactions (CEI).
              </span>
            </div>
          </>
        )}
      </div>

      {/* Code diff viewer */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 overflow-hidden">
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-xs">
            <span className="font-mono text-zinc-400">
              {comparisonMode === "v1_vs_v2" ? "src/facets/VaultV1.sol (Stable)" : "src/facets/VaultV2.sol (Buggy)"}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
              {comparisonMode === "v1_vs_v2" ? "Original" : "Vulnerable"}
            </span>
          </div>
          <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
            {comparisonMode === "v1_vs_v2" ? V1_CODE : V2_BUGGY_CODE}
          </pre>
        </div>

        {/* Right Column */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 overflow-hidden">
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-xs">
            <span className="font-mono text-zinc-400">
              {comparisonMode === "v1_vs_v2" ? "src/facets/VaultV2.sol (Buggy)" : "src/facets/VaultV2Fixed.sol (AI Patched)"}
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded ${
                comparisonMode === "v1_vs_v2"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {comparisonMode === "v1_vs_v2" ? "Buggy Diff" : "Auto-Patched"}
            </span>
          </div>
          <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
            {comparisonMode === "v1_vs_v2" ? V2_BUGGY_CODE : V2_FIXED_CODE}
          </pre>
        </div>
      </div>
    </div>
  );
}
