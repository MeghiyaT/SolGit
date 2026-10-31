"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Terminal,
  CheckCircle2,
  GitBranch,
  GitPullRequest,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Zap,
} from "lucide-react";

interface LogEntry {
  id: string;
  step: number;
  stageTag: "[INTERCEPT]" | "[DEFENSE]" | "[AI AUDITOR]" | "[SANDBOX]" | "[GIT ENGINE]";
  tagColor: string;
  timestamp: string;
  text: string;
  highlight?: boolean;
}

interface AIFixerConsoleProps {
  isHacked: boolean;
  isMerged?: boolean;
  onMergeFix?: () => void;
  onNavigatePR?: () => void;
  onReset?: () => void;
  compact?: boolean;
}

const STAGES = [
  {
    step: 1,
    tag: "[INTERCEPT]",
    label: "Anomaly Detected",
    desc: "Exploit attempt on 0x2e1a7d4d (withdraw)",
    color: "text-rose-400 border-rose-500/40 bg-rose-950/30",
  },
  {
    step: 2,
    tag: "[DEFENSE]",
    label: "Guardian Rollback",
    desc: "emergencyRollback() executed on MST Coral",
    color: "text-amber-400 border-amber-500/40 bg-amber-950/30",
  },
  {
    step: 3,
    tag: "[AI AUDITOR]",
    label: "Groq LLM Patch",
    desc: "Synthesizing CEI safe pattern in VaultV2Fixed.sol",
    color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/30",
  },
  {
    step: 4,
    tag: "[SANDBOX]",
    label: "Foundry Verified",
    desc: "forge test --match-contract VaultV2FixedTest (4/4)",
    color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/30",
  },
  {
    step: 5,
    tag: "[GIT ENGINE]",
    label: "PR #42 Staged",
    desc: "Branch solgit-fix-0x2e1a7d-v2 ready to merge",
    color: "text-purple-400 border-purple-500/40 bg-purple-950/30",
  },
];

const RAW_LOGS: Array<{ step: number; tag: LogEntry["stageTag"]; text: string; highlight?: boolean }> = [
  // Stage 1: Intercept
  { step: 1, tag: "[INTERCEPT]", text: "SolGit Autonomous Sentinel Node #04 monitoring MST Coral Testnet (Chain ID 54635)" },
  { step: 1, tag: "[INTERCEPT]", text: "Incoming TX 0x892a0e882419c836dbf19c08a9f4c71829e018a7b94c029e84a9c812739a1 to Diamond 0x3348...0D69", highlight: true },
  { step: 1, tag: "[INTERCEPT]", text: "Calldata: 0x2e1a7d4d (withdraw) | Value requested: 200.0000 tMSTC" },
  { step: 1, tag: "[INTERCEPT]", text: "⚠️ Invariant Breach Asserted: OUTFLOW_CAP_BREACHED [attempted: 200 tMSTC > limit: 100 tMSTC]", highlight: true },
  { step: 1, tag: "[INTERCEPT]", text: "Caller 0x9dF0C6b...4e has 0 balance! Arithmetic underflow attack detected on VaultV2." },

  // Stage 2: Defense
  { step: 2, tag: "[DEFENSE]", text: "Guardian role triggered on SolGitDiamond (0x3348...0D69)" },
  { step: 2, tag: "[DEFENSE]", text: "Invoking LibDiamond.emergencyRollback(selector: 0x2e1a7d4d, targetVersion: 1)", highlight: true },
  { step: 2, tag: "[DEFENSE]", text: "✔ On-chain TX confirmed in Block #120486: Selector 0x2e1a7d4d redirected to VaultV1 (0xF717...53f8)" },
  { step: 2, tag: "[DEFENSE]", text: "🛡️ Zero Downtime Maintained: deposit(), transfer(), and balanceOf() remain 100% active.", highlight: true },
  { step: 2, tag: "[DEFENSE]", text: "Compromised Facet VaultV2 (0x9169...BCB7) quarantined in VersionRegistry." },

  // Stage 3: AI Auditor
  { step: 3, tag: "[AI AUDITOR]", text: "Dispatching incident trace to Groq LLM (Llama-3.3-70b-versatile)" },
  { step: 3, tag: "[AI AUDITOR]", text: "Analyzing abstract syntax tree (AST) of contracts/facets/VaultV2.sol..." },
  { step: 3, tag: "[AI AUDITOR]", text: "Vulnerability identified: unchecked block around `vs.balances[msg.sender] -= amount` without guard", highlight: true },
  { step: 3, tag: "[AI AUDITOR]", text: "Generating hotfix with Checks-Effects-Interactions (CEI) & SafeMath invariants..." },
  { step: 3, tag: "[AI AUDITOR]", text: "✔ Patch synthesized: VaultV2Fixed.sol (+12 lines, -8 lines).", highlight: true },

  // Stage 4: Sandbox
  { step: 4, tag: "[SANDBOX]", text: "Spawning isolated Foundry sandbox container..." },
  { step: 4, tag: "[SANDBOX]", text: "$ forge test --match-contract VaultV2FixedTest -vvv", highlight: true },
  { step: 4, tag: "[SANDBOX]", text: "  [PASS] testWithdrawLegitimateBalance() (gas: 18420)" },
  { step: 4, tag: "[SANDBOX]", text: "  [PASS] testWithdrawUnderflowExploitReverts() (gas: 21045)" },
  { step: 4, tag: "[SANDBOX]", text: "  [PASS] testDepositAndBalanceTracking() (gas: 31200)" },
  { step: 4, tag: "[SANDBOX]", text: "  [PASS] invariant_SolvencyHoldsUnderFuzz() (runs: 10,000, gas: 142099)" },
  { step: 4, tag: "[SANDBOX]", text: "✔ Foundry Sandbox Verdict: 4 passed, 0 failed, 0 regressions. Invariants 100% intact.", highlight: true },

  // Stage 5: Git Engine
  { step: 5, tag: "[GIT ENGINE]", text: "Initializing SolGit local workspace branch..." },
  { step: 5, tag: "[GIT ENGINE]", text: "$ git checkout -b solgit-fix-0x2e1a7d-v2", highlight: true },
  { step: 5, tag: "[GIT ENGINE]", text: "$ git add src/facets/VaultV2Fixed.sol test/VaultV2FixedTest.t.sol" },
  { step: 5, tag: "[GIT ENGINE]", text: '$ git commit -m "fix(vault): enforce CEI and checked subtraction on withdraw()"' },
  { step: 5, tag: "[GIT ENGINE]", text: "✔ Staged Pull Request #42: 'Self-Healing AI Hotfix: VaultV2Fixed.sol'", highlight: true },
  { step: 5, tag: "[GIT ENGINE]", text: "🚀 Platform ready for 1-Click Pull Request Merge to deploy Version 3 live!" },
];

const INITIAL_COMPLETED_LOGS: LogEntry[] = RAW_LOGS.map((item, idx) => ({
  id: `log-init-${idx}`,
  step: item.step,
  stageTag: item.tag,
  tagColor:
    item.tag === "[INTERCEPT]"
      ? "text-rose-400 bg-rose-950/60 border-rose-800/60"
      : item.tag === "[DEFENSE]"
      ? "text-amber-400 bg-amber-950/60 border-amber-800/60"
      : item.tag === "[AI AUDITOR]"
      ? "text-cyan-400 bg-cyan-950/60 border-cyan-800/60"
      : item.tag === "[SANDBOX]"
      ? "text-emerald-400 bg-emerald-950/60 border-emerald-800/60"
      : "text-purple-400 bg-purple-950/60 border-purple-800/60",
  timestamp: "12:00:00",
  text: item.text,
  highlight: item.highlight,
}));

export function AIFixerConsole({
  isHacked,
  isMerged = false,
  onMergeFix,
  onNavigatePR,
  compact = false,
}: AIFixerConsoleProps) {
  const [activeTab, setActiveTab] = useState<"stream" | "ai" | "foundry">("stream");
  const [currentStep, setCurrentStep] = useState<number>(isHacked || isMerged ? 5 : 0);
  const [displayedLogs, setDisplayedLogs] = useState<LogEntry[]>(() =>
    isHacked || isMerged ? INITIAL_COMPLETED_LOGS : []
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const [copied, setCopied] = useState<boolean>(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const prevHackedRef = useRef(isHacked);

  const handleStartSimulation = useCallback(() => {
    setIsRunning(true);
    setDisplayedLogs([]);
    setCurrentStep(1);

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < RAW_LOGS.length) {
        const item = RAW_LOGS[logIndex];
        const newEntry: LogEntry = {
          id: `log-${Date.now()}-${logIndex}`,
          step: item.step,
          stageTag: item.tag,
          tagColor:
            item.tag === "[INTERCEPT]"
              ? "text-rose-400 bg-rose-950/60 border-rose-800/60"
              : item.tag === "[DEFENSE]"
              ? "text-amber-400 bg-amber-950/60 border-amber-800/60"
              : item.tag === "[AI AUDITOR]"
              ? "text-cyan-400 bg-cyan-950/60 border-cyan-800/60"
              : item.tag === "[SANDBOX]"
              ? "text-emerald-400 bg-emerald-950/60 border-emerald-800/60"
              : "text-purple-400 bg-purple-950/60 border-purple-800/60",
          timestamp: new Date().toLocaleTimeString(),
          text: item.text,
          highlight: item.highlight,
        };

        setDisplayedLogs((prev) => [...prev, newEntry]);
        setCurrentStep(item.step);
        logIndex++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
        setCurrentStep(5);
      }
    }, 280);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (activeTab === "stream") {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayedLogs, activeTab]);

  // When isHacked transitions from false to true in the same session, launch animated stream
  useEffect(() => {
    if (!prevHackedRef.current && isHacked) {
      handleStartSimulation();
    } else if (prevHackedRef.current && !isHacked) {
      setCurrentStep(0);
      setDisplayedLogs([]);
    }
    prevHackedRef.current = isHacked;
  }, [isHacked, handleStartSimulation]);

  const handleCopyLogs = () => {
    const raw = displayedLogs.map((l) => `${l.timestamp} ${l.stageTag} ${l.text}`).join("\n");
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-[#0a0d14] overflow-hidden shadow-2xl backdrop-blur-xl transition-all duration-300">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Terminal Title Bar                                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="px-5 py-3.5 bg-zinc-950/90 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold font-mono text-zinc-200">
              SolGit Sentinel & AI Fixer Telemetry Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Status indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px]">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isRunning ? "bg-amber-400" : isHacked ? "bg-emerald-400" : "bg-zinc-500"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isRunning ? "bg-amber-500" : isHacked ? "bg-emerald-500" : "bg-zinc-600"
                }`}
              />
            </span>
            <span className="font-mono text-zinc-300">
              {isRunning
                ? "HEALING STREAM ACTIVE"
                : isHacked
                ? "INCIDENT HEALED (PR #42 READY)"
                : "WATCHER STANDBY"}
            </span>
          </div>

          <button
            onClick={handleCopyLogs}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800/80 transition"
            title="Copy Terminal Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800/80 transition"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5-Stage Stepper Ribbon                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 border-b border-zinc-800/80 bg-zinc-950/40 text-[11px] font-mono divide-x divide-zinc-800/60">
        {STAGES.map((s) => {
          const isDone = currentStep > s.step || (currentStep === 5 && !isRunning);
          const isCurrent = currentStep === s.step && isRunning;

          return (
            <div
              key={s.step}
              className={`p-3 transition-colors ${
                isDone
                  ? "bg-emerald-950/20 text-emerald-300"
                  : isCurrent
                  ? "bg-cyan-950/30 text-cyan-200 animate-pulse font-bold"
                  : "text-zinc-600 bg-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase">{s.tag}</span>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Zap className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 shrink-0" />
                )}
              </div>
              <div className="text-xs font-sans font-bold text-zinc-200 mt-0.5 truncate">
                {s.label}
              </div>
              <p className="text-[10px] text-zinc-500 truncate hidden md:block">{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Console Subtabs & Stream Body                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Subtabs bar */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("stream")}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer ${
                  activeTab === "stream"
                    ? "bg-zinc-800 text-cyan-300 border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Telemetry Stream ({displayedLogs.length})
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer ${
                  activeTab === "ai"
                    ? "bg-zinc-800 text-cyan-300 border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Groq AI Synthesis
              </button>
              <button
                onClick={() => setActiveTab("foundry")}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer ${
                  activeTab === "foundry"
                    ? "bg-zinc-800 text-cyan-300 border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Foundry Invariant Sandbox
              </button>
            </div>

            <div className="flex items-center gap-2">
              {!isRunning && isHacked && (
                <button
                  onClick={handleStartSimulation}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Replay Telemetry</span>
                </button>
              )}
            </div>
          </div>

          {/* Terminal Screen View */}
          <div className="bg-[#05070c] rounded-2xl border border-zinc-900 p-4 font-mono text-xs max-h-80 min-h-60 overflow-y-auto leading-relaxed shadow-inner">
            {activeTab === "stream" && (
              <div className="space-y-1.5">
                {displayedLogs.length === 0 ? (
                  <div className="text-zinc-600 italic py-8 text-center flex flex-col items-center gap-2">
                    <Terminal className="w-8 h-8 opacity-40 text-zinc-500" />
                    <span>Sentinel Watcher standby. Trigger an exploit to stream live self-healing telemetry.</span>
                  </div>
                ) : (
                  displayedLogs.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex items-start gap-2.5 py-0.5 ${
                        entry.highlight ? "text-cyan-200 bg-cyan-950/20 px-2 rounded-lg" : "text-zinc-400"
                      }`}
                    >
                      <span className="text-[10px] text-zinc-600 shrink-0 select-none">
                        {entry.timestamp}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded border font-bold shrink-0 ${entry.tagColor}`}
                      >
                        {entry.stageTag}
                      </span>
                      <span className="break-all">{entry.text}</span>
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-3 text-zinc-300">
                <div className="text-cyan-400 font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Groq Llama-3.3-70b-versatile Root-Cause Decomposition:</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1 text-[11px] text-zinc-400">
                  <div className="text-zinc-300 font-semibold">Invariant Breached: OUTFLOW_CAP</div>
                  <div>Root Cause: VaultV2.sol line 44 used unchecked subtraction without pre-checking caller balance.</div>
                  <div>Attack Vector: Zero-balance caller triggers 2^256-1 underflow, bypassing solvency.</div>
                  <div className="text-emerald-400 pt-1">
                    CEI Remediation Applied: Added balance verification guard (&quot;vs.balances[msg.sender] &lt; amount&quot;) and moved transfer call to final step.
                  </div>
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  Synthesized patch file: `src/facets/VaultV2Fixed.sol` (Diff: +12 / -8 lines)
                </div>
              </div>
            )}

            {activeTab === "foundry" && (
              <div className="space-y-2 text-zinc-300">
                <div className="text-emerald-400 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Sandbox Test Suite: VaultV2FixedTest</span>
                </div>
                <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-emerald-300/90 overflow-x-auto leading-normal">
{`$ forge test --match-contract VaultV2FixedTest -vvv
[⠊] Compiling 2 files with 0.8.24
[⠒] Solc 0.8.24 finished in 482.00ms
Compiler run successful!

Running 4 tests for test/VaultV2FixedTest.t.sol:VaultV2FixedTest
[PASS] testWithdrawLegitimateBalance() (gas: 18420)
[PASS] testWithdrawUnderflowExploitReverts() (gas: 21045)
[PASS] testDepositAndBalanceTracking() (gas: 31200)
[PASS] invariant_SolvencyHoldsUnderFuzz() (runs: 10000, gas: 142099)
Test result: ok. 4 passed; 0 failed; 0 skipped; finished in 18.2ms`}
                </pre>
              </div>
            )}
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* Action Bar: Review PR #42 & 1-Click Merge                      */}
          {/* (Shown only during active incident or after merge)             */}
          {/* ───────────────────────────────────────────────────────────── */}
          {(isHacked || isMerged) && (
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Branch: solgit-fix-0x2e1a7d-v2</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                      {isMerged ? "PR #42 Merged" : "PR #42 Open"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Target: Diamond Proxy Selector <code className="text-cyan-300">0x2e1a7d4d</code> (withdraw)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onNavigatePR && (
                  <button
                    onClick={onNavigatePR}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <GitPullRequest className="w-3.5 h-3.5 text-purple-400" />
                    <span>Inspect PR #42</span>
                  </button>
                )}

                {onMergeFix && (
                  <button
                    onClick={onMergeFix}
                    disabled={isMerged}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg ${
                      isMerged
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white shadow-emerald-600/20"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isMerged ? "v3 Deployed Live" : "1-Click Merge & Deploy v3"}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
