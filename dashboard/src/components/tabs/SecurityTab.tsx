"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Activity,
  Radio,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { type RollbackEvent } from "../../lib/data";
import { type Repository } from "../../lib/types";
import { AIFixerConsole } from "../AIFixerConsole";
import type { OnChainContractEvent } from "../../hooks/useSentinelEvents";

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
  vaultTvl?: number | string;
  blockNumber?: bigint | null;
  onChainEvents?: OnChainContractEvent[];
}

export function SecurityTab({
  isHacked,
  events,
  onReset,
  isMerged = false,
  onMergeFix,
  onNavigatePR,
  activeRepo,
  vaultTvl = "0.0000",
  blockNumber,
  onChainEvents = [],
}: SecurityTabProps) {
  const [activeStreamTab, setActiveStreamTab] = useState<"incidents" | "onchain">("incidents");
  const contractName = activeRepo?.name || "CoralVault";
  const formattedTvl =
    typeof vaultTvl === "number"
      ? vaultTvl.toFixed(4)
      : typeof vaultTvl === "string"
      ? vaultTvl
      : "0.0000";
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
              <span className="text-xs text-zinc-500 font-mono">
                MST Coral Testnet (54635){blockNumber ? ` • Block #${blockNumber}` : ""}
              </span>
              {activeRepo?.contractAddress && (
                <a
                  href={`https://coral.mstscan.com/address/${activeRepo.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-400 font-mono transition"
                  title="View Contract on MST Coral Explorer"
                >
                  <span>{activeRepo.contractAddress.slice(0, 6)}...{activeRepo.contractAddress.slice(-4)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
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
              {formattedTvl} <span className="text-xs text-emerald-500 font-normal">tMSTC</span>
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
        blockNumber={blockNumber}
        activeRepo={activeRepo}
        events={events}
        latestIncident={events[0] || null}
      />

      {/* ───────────────────────────────────────────────────── */}
      {/* 3. Security Event Stream Table & Sentinel Feed        */}
      {/* ───────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-[#0d1117] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Sentinel On-Chain Event & Incident Stream</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStreamTab("incidents")}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition cursor-pointer ${
                activeStreamTab === "incidents"
                  ? "bg-zinc-800 text-rose-300 border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Rollback Incidents ({events.length})
            </button>
            <button
              onClick={() => setActiveStreamTab("onchain")}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeStreamTab === "onchain"
                  ? "bg-zinc-800 text-emerald-300 border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Live On-Chain Events ({onChainEvents.length})</span>
            </button>
          </div>
        </div>

        {activeStreamTab === "incidents" && (
          <div>
            {events.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-emerald-500/50" />
                <span>No security incidents recorded. System running normally on MST Coral.</span>
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
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Block #{evt.blockNumber}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px]">
                        Trigger: <span className="text-amber-300 font-mono">{evt.invariant}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-zinc-400">
                      <span className="truncate max-w-[120px]">{evt.txHash.slice(0, 12)}...</span>
                      <a
                        href={`https://coral.mstscan.com/tx/${evt.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
                        title="View Incident on MST Coral Explorer"
                      >
                        <span>MSTScan</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeStreamTab === "onchain" && (
          <div>
            {onChainEvents.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                <Radio className="w-8 h-8 text-emerald-500/50 animate-pulse" />
                <span>Listening for real-time events on MST Coral Testnet (54635)...</span>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {onChainEvents.map((evt) => {
                  const isDeposit = evt.eventName === "Deposited";
                  const isWithdraw = evt.eventName === "Withdrawn";
                  const isRollback = evt.eventName === "EmergencyRollbackExecuted" || evt.eventName === "SelectorRolledBack";

                  return (
                    <div
                      key={evt.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded border text-[11px] ${
                              isDeposit
                                ? "text-emerald-400 bg-emerald-950/60 border-emerald-800/40"
                                : isWithdraw
                                ? "text-amber-400 bg-amber-950/60 border-amber-800/40"
                                : isRollback
                                ? "text-rose-400 bg-rose-950/60 border-rose-800/40"
                                : "text-cyan-400 bg-cyan-950/60 border-cyan-800/40"
                            }`}
                          >
                            {isDeposit && <ArrowDownLeft className="w-3 h-3 text-emerald-400" />}
                            {isWithdraw && <ArrowUpRight className="w-3 h-3 text-amber-400" />}
                            {isRollback && <ShieldAlert className="w-3 h-3 text-rose-400" />}
                            <span>{evt.eventName}</span>
                          </span>

                          <span className="font-mono text-zinc-300">
                            Block #{String(evt.blockNumber)}
                          </span>

                          {evt.amountFormatted && (
                            <span className="font-mono font-bold text-emerald-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-[11px]">
                              {evt.amountFormatted}
                            </span>
                          )}

                          {evt.selector && (
                            <span className="font-mono text-cyan-300 text-[11px]">
                              Selector: {evt.selector}
                            </span>
                          )}
                        </div>

                        {evt.account && (
                          <p className="text-zinc-500 font-mono text-[11px]">
                            Account: <span className="text-zinc-400">{evt.account}</span>
                          </p>
                        )}
                        {evt.reason && (
                          <p className="text-zinc-400 text-[11px]">
                            Reason: <span className="text-amber-300">{evt.reason}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-zinc-400">
                        <span className="truncate max-w-[120px]">{evt.transactionHash.slice(0, 12)}...</span>
                        <a
                          href={evt.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
                          title="View on MST Coral Explorer"
                        >
                          <span>MSTScan</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SecurityTab;
