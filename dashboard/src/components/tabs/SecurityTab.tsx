"use client";

import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Activity,
} from "lucide-react";
import { type RollbackEvent } from "../../lib/data";
import { type Repository } from "../../lib/types";
import { AIFixerConsole } from "../AIFixerConsole";

export interface SecurityTabProps {
  isHacked: boolean;
  events: RollbackEvent[];
  onTriggerHack: () => void;
  onReset: () => void;
  onActionToast?: (msg: string) => void;
  isMerged?: boolean;
  onMergeFix?: () => void;
  onNavigatePR?: () => void;
  activeRepo?: Repository | null;
  vaultTvl?: number;
}

export function SecurityTab({
  isHacked,
  events,
  onReset,
  isMerged = false,
  onMergeFix,
  onNavigatePR,
  activeRepo,
  vaultTvl = 15.0,
}: SecurityTabProps) {
  const contractName = activeRepo?.name || "CoralVault";
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ───────────────────────────────────────────────────── */}
      {/* 1. Header & Defense Status Banner                     */}
      {/* ───────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-zinc-950 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isHacked
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isHacked ? "bg-rose-400" : "bg-emerald-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isHacked ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                  />
                </span>
                <span>{isHacked ? "Incident Intercepted & Auto-Healed" : "Protocol Shield Active"}</span>
              </span>
              <span className="text-xs text-zinc-500 font-mono">MST Coral Testnet (54635)</span>
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight">
              {isHacked ? "Autonomous Rollback & Self-Healing Active" : "Autonomous Guardian Security Center"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {isHacked
                ? "An underflow exploit attempt was detected and blocked by the contract guardian. Function 'withdraw' has been restored to stable Version 1 with zero protocol downtime."
                : "Real-time on-chain invariant monitoring. If an upgraded function attempts an unauthorized drain, SolGit Guardian automatically restores the stable facet in sub-blocks."}
            </p>
          </div>

          {/* Action Trigger Button */}
          <div className="flex items-center gap-3 shrink-0">
            {isHacked ? (
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold shadow-md transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Telemetry</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sentinel Guard: Active</span>
              </div>
            )}
          </div>
        </div>

        {/* 3 Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl border border-white/10 bg-black/40">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
              Vault Total Capital
            </span>
            <div className="text-xl font-black font-mono text-emerald-400 mt-1">
              {vaultTvl.toFixed(4)} <span className="text-xs text-emerald-500 font-normal">tMSTC</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 mt-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>100% Capital Preserved</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-white/10 bg-black/40">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
              Attacker Stolen Funds
            </span>
            <div className="text-xl font-black font-mono text-rose-400 mt-1">
              0.0000 <span className="text-xs text-rose-500 font-normal">tMSTC</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-rose-400/90 mt-1">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>Exploit Blocked & Reverted</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-white/10 bg-black/40">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
              Active Implementation
            </span>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
              {isMerged
                ? `${contractName}Fixed (v3 Active)`
                : isHacked
                ? `${contractName} (v1 Restored)`
                : `${contractName} (v1 Stable)`}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              {isMerged
                ? "CEI SafeMath Hotfix Deployed"
                : isHacked
                ? "Guardian Restored Safe Baseline"
                : "Production Baseline · All Invariants Passing"}
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────── */}
      {/* 2. Live Autonomous Sentinel & AI Fixer Console        */}
      {/* ───────────────────────────────────────────────────── */}
      <AIFixerConsole
        isHacked={isHacked}
        isMerged={isMerged}
        onMergeFix={onMergeFix}
        onNavigatePR={onNavigatePR}
        onReset={onReset}
      />

      {/* ───────────────────────────────────────────────────── */}
      {/* 3. Security Event Stream Table                        */}
      {/* ───────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-[#0d1117] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Security & Rollback Incident Log</h3>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            {events.length} {events.length === 1 ? "Incident" : "Incidents"} Recorded
          </span>
        </div>

        {events.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-500/50" />
            <span>No security incidents recorded. System running normally.</span>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                      Selector: {evt.selector}
                    </span>
                    <span className="font-semibold text-white">
                      emergencyRollback(v{evt.badVersion} → v{evt.goodVersion})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                      {evt.status}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Trigger: <span className="text-amber-300 font-mono">{evt.invariant}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-zinc-400">
                  <span className="truncate max-w-[120px]">{evt.txHash.slice(0, 12)}...</span>
                  <a
                    href={`https://coralscan.mstblockchain.com/tx/${evt.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded hover:bg-white/10 text-cyan-400 hover:text-cyan-300 transition"
                    title="View on MSTScan"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SecurityTab;
