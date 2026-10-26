"use client";

import React, { useState } from "react";
import { Navbar } from "../components/Navbar";
import { VersionTree } from "../components/VersionTree";
import { CodeDiff } from "../components/CodeDiff";
import { EventFeed } from "../components/EventFeed";
import { PRApprovals } from "../components/PRApprovals";
import { SimulateHack } from "../components/SimulateHack";
import { INITIAL_SELECTORS, INITIAL_EVENTS, type SelectorFeature, type RollbackEvent } from "../lib/data";
import { Shield, Layers, RefreshCw, GitCommit } from "lucide-react";

export default function Home() {
  const [selectors, setSelectors] = useState<SelectorFeature[]>(INITIAL_SELECTORS);
  const [selectedSelector, setSelectedSelector] = useState<SelectorFeature>(INITIAL_SELECTORS[0]);
  const [events, setEvents] = useState<RollbackEvent[]>(INITIAL_EVENTS);
  const [isHacked, setIsHacked] = useState(false);
  const [isMerged, setIsMerged] = useState(false);

  // Trigger simulated hack attack
  const handleTriggerHack = () => {
    setIsHacked(true);

    // Update withdraw feature: V2 quarantined, active rolled back to V1
    setSelectors((prev) =>
      prev.map((s) => {
        if (s.selector === "0x2e1a7d4d") {
          return {
            ...s,
            currentVersion: 1,
            history: s.history.map((h) =>
              h.version === 2 ? { ...h, status: "Quarantined" } : h
            ),
          };
        }
        return s;
      })
    );

    // Prepend new rollback event
    const newEvent: RollbackEvent = {
      id: `evt-${Date.now()}`,
      selector: "0x2e1a7d4d",
      badVersion: 2,
      goodVersion: 1,
      triggeredBy: "0x9dF0C6b0066D5317aA5b38B36850548DaCCa6B4e",
      contextHash: "0x7c9a2e1d...f4b6",
      txHash: "0x3f5c9e2b1a8d7e6f4a5b2c3d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f",
      blockNumber: 120486,
      timestamp: "Just now",
      status: "BLOCKED & ROLLED BACK",
      invariant: "OUTFLOW_CAP (Attempted: 200 tMSTC, Max: 100 tMSTC)",
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  // Reset sandbox
  const handleReset = () => {
    setIsHacked(false);
    setIsMerged(false);
    setSelectors(INITIAL_SELECTORS);
    setEvents(INITIAL_EVENTS);
  };

  // Merge hotfix
  const handleMergeFix = () => {
    setIsMerged(true);

    // Add V3 to withdraw history
    setSelectors((prev) =>
      prev.map((s) => {
        if (s.selector === "0x2e1a7d4d") {
          const v3 = {
            version: 3,
            implementation: "0xb1C889707d426A7A386870A03bc70d1b0697599",
            codeHash: "0x4e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f",
            status: "Stable" as const,
            timestamp: Date.now(),
            author: "0xAI...Watcher",
            message: "fix(withdraw): AI-healed CEI balance verification patch",
          };
          return {
            ...s,
            currentVersion: 3,
            stableVersion: 3,
            history: [...s.history, v3],
          };
        }
        return s;
      })
    );
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Hero header */}
        <div className="relative rounded-3xl p-8 overflow-hidden border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950">
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium mb-4">
              <Shield className="h-3.5 w-3.5" /> Self-Healing Smart Contracts on MST Blockchain
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Git-Style Version Control for EVM Functions
            </h1>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
              SolGit wraps your contract facets with the <strong className="text-zinc-200">Soft-Fail Guard pattern</strong>. When an exploit or invariant violation is detected, the inner frame reverts the attack state while the outer frame automatically quarantines the vulnerable version, restores the stable version, and dispatches an AI self-healing hotfix.
            </p>
          </div>
        </div>

        {/* Live Attack Sandbox */}
        <SimulateHack
          onTriggerHack={handleTriggerHack}
          isHacked={isHacked}
          onReset={handleReset}
        />

        {/* Version Tree & Event Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <VersionTree
              selectors={selectors}
              selectedSelector={selectedSelector}
              onSelectFeature={(feat) => setSelectedSelector(feat)}
              onSelectDiff={(feat) => setSelectedSelector(feat)}
            />
          </div>

          <div className="lg:col-span-1 space-y-8">
            <EventFeed events={events} />
            <PRApprovals onMergeFix={handleMergeFix} isMerged={isMerged} />
          </div>
        </div>

        {/* Code Diff Inspector */}
        <CodeDiff />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 px-6 py-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">SolGit</span>
            <span>—</span>
            <span>MST Blockchain Testnet (EVM Chain ID 91562037)</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://testnet.mstscan.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-300 transition"
            >
              MST Explorer
            </a>
            <a
              href="https://faucet.mstblockchain.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-300 transition"
            >
              Faucet
            </a>
            <a
              href="https://testnetrpc.mstblockchain.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-300 transition"
            >
              RPC
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
