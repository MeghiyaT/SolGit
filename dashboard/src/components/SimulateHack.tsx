"use client";

import React, { useState } from "react";
import { Skull, Shield, ArrowRight, CheckCircle2, AlertOctagon, RotateCcw, Cpu } from "lucide-react";

interface SimulateHackProps {
  onTriggerHack: () => void;
  isHacked: boolean;
  onReset: () => void;
}

export function SimulateHack({ onTriggerHack, isHacked, onReset }: SimulateHackProps) {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: "Attacker Exploit Attempt", desc: "Attacker targets VaultV2 withdraw() function on the permanent Diamond contract." },
    { title: "Watcher Anomaly Detected", desc: "Off-chain Watcher detects abnormal drain and underflow exploit signature in real-time." },
    { title: "EIP-2535 Guardian Rollback", desc: "Watcher invokes emergencyRollback() with Guardian role, restoring selector to VaultV1 without changing contract address!" },
    { title: "Quarantine & Safe Operation", desc: "Compromised version is quarantined; connected dApps and users experience zero routing interruption." },
    { title: "Self-Healing AI Hotfix", desc: "AI Fixer analyzes root-cause, patches the Solidity facet, and passes automated Foundry verification." },
  ];

  const handleSimulate = () => {
    setRunning(true);
    setCurrentStep(1);

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= 5) {
          clearInterval(interval);
          setRunning(false);
          onTriggerHack();
          return 5;
        }
        return prev + 1;
      });
    }, 700);
  };

  return (
    <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Skull className="h-5 w-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white">Live Attack & Auto-Rollback Sandbox</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Simulate a real-time smart contract exploit and watch SolGit's soft-fail guard auto-heal the protocol
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isHacked && (
            <button
              onClick={() => {
                setCurrentStep(0);
                onReset();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Sandbox
            </button>
          )}

          <button
            onClick={handleSimulate}
            disabled={running || isHacked}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-500 to-amber-500 hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs tracking-wide shadow-lg shadow-rose-600/30 transition cursor-pointer"
          >
            <Skull className="h-4 w-4" />
            {running ? "Simulating Exploit..." : isHacked ? "Attack Blocked & Auto-Healed" : "⚡ Simulate Hack Attack"}
          </button>
        </div>
      </div>

      {/* Vault Balance & Status Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60">
          <span className="text-xs text-zinc-400">Vault Total Deposits</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            15.0000 tMSTC
          </div>
          <span className="text-[11px] text-zinc-500">100% Capital Preserved</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60">
          <span className="text-xs text-zinc-400">Attacker Stolen Capital</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            0.0000 tMSTC
          </div>
          <span className="text-[11px] text-zinc-500">Exploit TX Reverted</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60">
          <span className="text-xs text-zinc-400">Active Withdraw Facet</span>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {isHacked ? "VaultV1 (Stable)" : "VaultV2 (Buggy)"}
          </div>
          <span className="text-[11px] text-zinc-500">
            {isHacked ? "Quarantined V2 restored to V1" : "V2 active with underflow bug"}
          </span>
        </div>
      </div>

      {/* 5-Step Animated Execution Pipeline */}
      <div className="mt-6 pt-6 border-t border-zinc-800/80">
        <div className="text-xs font-semibold text-zinc-400 mb-4 flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-cyan-400" />
          <span>Execution Pipeline Trace:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = currentStep > stepNum || isHacked;
            const isCurrent = currentStep === stepNum;

            return (
              <div
                key={step.title}
                className={`p-3 rounded-xl border transition ${
                  isCompleted
                    ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                    : isCurrent
                    ? "bg-rose-950/30 border-rose-500 text-rose-200 animate-pulse shadow-md shadow-rose-500/10"
                    : "bg-zinc-950/40 border-zinc-800/80 text-zinc-500"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                    Step {stepNum}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-zinc-800" />
                  )}
                </div>
                <div className="text-xs font-bold font-mono">{step.title}</div>
                <p className="text-[11px] mt-1 text-zinc-400 leading-snug">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
