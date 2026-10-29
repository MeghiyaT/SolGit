"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TopNav } from "../components/TopNav";
import { RepoHeader } from "../components/RepoHeader";
import { TabNav } from "../components/TabNav";
import { CodeTab } from "../components/tabs/CodeTab";
import { CommitsTab } from "../components/tabs/CommitsTab";
import { PullRequestsTab } from "../components/tabs/PullRequestsTab";
import { SecurityTab } from "../components/tabs/SecurityTab";
import { LoupeTab } from "../components/tabs/LoupeTab";
import { CommandPalette } from "../components/CommandPalette";
import { Toast } from "../components/Toast";
import {
  INITIAL_SELECTORS,
  INITIAL_EVENTS,
  CONTRACTS,
  type SelectorFeature,
  type RollbackEvent,
  type VersionCommit,
} from "../lib/data";
import type { TabType, ToastNotification } from "../lib/types";
import {
  Shield,
  Layers,
  ExternalLink,
  Copy,
  Check,
  Cpu,
} from "lucide-react";

export default function Home() {
  // ─────────────────────────────────────────────────────────────
  // Reactive State Machine
  // ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>("code");
  const [selectedFile, setSelectedFile] = useState<string>("contracts/facets/VaultV2.sol");
  const [selectors, setSelectors] = useState<SelectorFeature[]>(INITIAL_SELECTORS);
  const [events, setEvents] = useState<RollbackEvent[]>(INITIAL_EVENTS);
  const [isHacked, setIsHacked] = useState<boolean>(false);
  const [isMerged, setIsMerged] = useState<boolean>(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [copiedRouter, setCopiedRouter] = useState<boolean>(false);

  // ─────────────────────────────────────────────────────────────
  // Toast & Clipboard Helpers
  // ─────────────────────────────────────────────────────────────
  const showToast = useCallback(
    (
      title: string,
      description?: string,
      type: "info" | "success" | "warning" | "error" = "info",
      duration = 4000
    ) => {
      setToast({
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title,
        description,
        type,
        duration,
      });
    },
    []
  );

  const handleActionToast = useCallback(
    (msg: string) => {
      showToast("Notification", msg, "info", 3500);
    },
    [showToast]
  );

  const handleCopyToast = useCallback(
    (text: string, label?: string) => {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
      showToast(
        "Copied to Clipboard",
        label ? `${label}: \`${text}\`` : `\`${text}\``,
        "success",
        3000
      );
    },
    [showToast]
  );

  const handleCopyFooterRouter = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(CONTRACTS.router).catch(() => {});
    }
    setCopiedRouter(true);
    handleCopyToast(CONTRACTS.router, "Diamond Router");
    setTimeout(() => setCopiedRouter(false), 2000);
  };

  // ─────────────────────────────────────────────────────────────
  // State Machine Action Handlers
  // ─────────────────────────────────────────────────────────────

  // 1. Attack Simulation -> Soft-fail guard trip & automated rollback
  const handleTriggerHack = useCallback(() => {
    setIsHacked(true);

    // Revert selector 0x2e1a7d4d (withdraw) from version 2 to version 1, mark v2 as Quarantined
    setSelectors((prev) =>
      prev.map((s) => {
        if (s.selector === "0x2e1a7d4d") {
          return {
            ...s,
            currentVersion: 1,
            history: s.history.map((h) =>
              h.version === 2 ? { ...h, status: "Quarantined" as const } : h
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

    // macOS Alert Toast
    showToast(
      "Guardian Emergency Rollback",
      "Reverted 0x2e1a7d4d to VaultV1 (Quarantined v2)",
      "error",
      5000
    );
  }, [showToast]);

  // 2. PR Hotfix Merge -> Version 3 promotion to Stable
  const handleMergeFix = useCallback(() => {
    setIsMerged(true);

    // Promote V3 in selector registry
    setSelectors((prev) =>
      prev.map((s) => {
        if (s.selector === "0x2e1a7d4d") {
          const v3: VersionCommit = {
            version: 3,
            implementation: CONTRACTS.vaultV2Fixed,
            codeHash: "0x4e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f",
            status: "Stable",
            timestamp: Math.floor(Date.now() / 1000),
            author: "0xAI...Watcher",
            message: "fix(withdraw): AI-healed CEI balance verification patch",
          };

          const alreadyHasV3 = s.history.some((h) => h.version === 3);
          return {
            ...s,
            currentVersion: 3,
            stableVersion: 3,
            history: alreadyHasV3 ? s.history : [...s.history, v3],
          };
        }
        return s;
      })
    );

    // macOS Success Toast
    showToast(
      "Pull Request #42 Merged",
      "Promoted VaultV2Fixed (v3) to Stable on Diamond",
      "success",
      5000
    );
  }, [showToast]);

  // 3. Reset Environment -> Restore baseline state
  const handleReset = useCallback(() => {
    setIsHacked(false);
    setIsMerged(false);
    setSelectors(INITIAL_SELECTORS);
    setEvents(INITIAL_EVENTS);

    showToast(
      "Environment Reset",
      "Clean state restored",
      "info",
      3500
    );
  }, [showToast]);

  // ─────────────────────────────────────────────────────────────
  // Keyboard Shortcuts (⌘K / Ctrl+K, Escape, 1-5 Quick Tab Jumps)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Command Palette Toggle: ⌘K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
        return;
      }

      // 2. Escape: close palette
      if (e.key === "Escape") {
        if (isPaletteOpen) {
          e.preventDefault();
          setIsPaletteOpen(false);
          return;
        }
      }

      // 3. Option+1-5: quick tab switching (⌥1 through ⌥5)
      // Check that the user is not actively typing in an input or contenteditable element
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          (activeEl as HTMLElement).isContentEditable);

      if (!isPaletteOpen && !isInputFocused && e.altKey && !e.metaKey && !e.ctrlKey) {
        if (e.code === "Digit1" || e.key === "1" || e.key === "¡") {
          e.preventDefault();
          setActiveTab("code");
        } else if (e.code === "Digit2" || e.key === "2" || e.key === "™") {
          e.preventDefault();
          setActiveTab("commits");
        } else if (e.code === "Digit3" || e.key === "3" || e.key === "£") {
          e.preventDefault();
          setActiveTab("pulls");
        } else if (e.code === "Digit4" || e.key === "4" || e.key === "¢") {
          e.preventDefault();
          setActiveTab("security");
        } else if (e.code === "Digit5" || e.key === "5" || e.key === "∞") {
          e.preventDefault();
          setActiveTab("loupe");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaletteOpen]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* ──────────────────────────────────────────────────────────
          1. macOS Top Navigation Bar (Traffic lights + Title + Search)
          ────────────────────────────────────────────────────────── */}
      <TopNav
        onOpenCommandPalette={() => setIsPaletteOpen(true)}
        onCopyAddress={(addr, label) => handleCopyToast(addr, label)}
      />

      {/* ──────────────────────────────────────────────────────────
          2. GitHub Repository Meta Header (Owner/Repo, Stars, Guardian)
          ────────────────────────────────────────────────────────── */}
      <RepoHeader
        isGuardianActive={true}
        onActionToast={handleActionToast}
      />

      {/* ──────────────────────────────────────────────────────────
          3. Subnavigation Tabs (Code, Commits, PRs, Security, Loupe)
          ────────────────────────────────────────────────────────── */}
      <TabNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        prCount={isMerged ? 0 : 1}
        hasSecurityAlert={isHacked && !isMerged}
      />

      {/* ──────────────────────────────────────────────────────────
          4. Main Active Tab Container
          ────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <div key={activeTab} className="transition-opacity duration-200">
          {activeTab === "code" && (
            <CodeTab
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              isHacked={isHacked}
              isMerged={isMerged}
              onCopyToast={handleCopyToast}
            />
          )}

          {activeTab === "commits" && (
            <CommitsTab
              selectors={selectors}
              onOpenDiff={(selector, fromVersion, toVersion, openInPR) => {
                if (openInPR) {
                  setActiveTab("pulls");
                  showToast(
                    "Pull Request Diff",
                    `Comparing ${selector} v${fromVersion ?? 2} -> v${toVersion ?? 3}`,
                    "info",
                    3500
                  );
                }
              }}
              onCopyToast={handleCopyToast}
            />
          )}

          {activeTab === "pulls" && (
            <PullRequestsTab
              isMerged={isMerged}
              isHacked={isHacked}
              onMergeFix={handleMergeFix}
              onActionToast={handleActionToast}
            />
          )}

          {activeTab === "security" && (
            <SecurityTab
              isHacked={isHacked}
              events={events}
              onTriggerHack={handleTriggerHack}
              onReset={handleReset}
              onActionToast={handleActionToast}
            />
          )}

          {activeTab === "loupe" && (
            <LoupeTab
              selectors={selectors}
              onCopy={handleCopyToast}
              onActionToast={handleActionToast}
            />
          )}
        </div>
      </main>

      {/* ──────────────────────────────────────────────────────────
          5. Global macOS Toast Notification (Top-Right)
          ────────────────────────────────────────────────────────── */}
      <Toast
        notification={toast}
        onClose={() => setToast(null)}
      />

      {/* ──────────────────────────────────────────────────────────
          6. Command Palette Modal (⌘K / Ctrl+K)
          ────────────────────────────────────────────────────────── */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsPaletteOpen(false);
        }}
        onSelectFile={(fileName) => {
          setSelectedFile(fileName);
          setActiveTab("code");
          setIsPaletteOpen(false);
        }}
        onTriggerHack={handleTriggerHack}
        onMergeFix={handleMergeFix}
        onReset={handleReset}
        onCopyAddress={(addr, label) => handleCopyToast(addr, label)}
        isHacked={isHacked}
        isMerged={isMerged}
      />

      {/* ──────────────────────────────────────────────────────────
          7. GitHub + macOS Refined Footer
          ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#0d1117]/90 backdrop-blur-md px-4 sm:px-6 py-6 text-xs text-zinc-400 mt-auto">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Top Row: Network Status & Contract Architecture */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
            {/* Network Info Pills */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-zinc-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-medium">MST Blockchain Testnet</span>
                <span className="font-mono text-[11px] text-zinc-400">(EVM ID: 91562037)</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-zinc-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Guardian Active</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-zinc-300">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>EIP-2535 Diamond Proxy</span>
              </div>
            </div>

            {/* Diamond Router Address Pill */}
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 px-2.5 py-1 rounded-md">
              <span className="text-zinc-500 font-mono">Router:</span>
              <code className="font-mono text-zinc-300 text-[11px]">
                {CONTRACTS.router.slice(0, 8)}...{CONTRACTS.router.slice(-6)}
              </code>
              <button
                type="button"
                onClick={handleCopyFooterRouter}
                className="p-1 hover:text-emerald-400 hover:bg-white/[0.06] rounded transition"
                title="Copy Diamond Router Address"
                aria-label="Copy Diamond Router Address"
              >
                {copiedRouter ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </button>
            </div>
          </div>

          {/* Bottom Row: Branding, Navigation Links & Keyboard Hint */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-zinc-300 font-semibold tracking-tight">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>SolGit</span>
              </div>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">
                Git-Style Smart Contract Version Control & AI Self-Healing
              </span>
            </div>

            {/* Quick Keyboard Hint */}
            <div className="hidden lg:flex items-center gap-2 text-zinc-500">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white/[0.06] border border-white/10 rounded font-mono text-zinc-300">
                ⌘K
              </kbd>
              <span>for palette</span>
              <span className="text-zinc-700">•</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white/[0.06] border border-white/10 rounded font-mono text-zinc-300">
                1-5
              </kbd>
              <span>for tabs</span>
            </div>

            {/* External Links */}
            <div className="flex items-center gap-4 text-zinc-400">
              <a
                href="https://testnet.mstscan.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-400 transition flex items-center gap-1"
              >
                <span>MST Explorer</span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>
              <a
                href="https://faucet.mstblockchain.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-400 transition flex items-center gap-1"
              >
                <span>Faucet</span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>
              <a
                href="https://testnetrpc.mstblockchain.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-400 transition flex items-center gap-1"
              >
                <span>RPC</span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>
              <a
                href="https://eips.ethereum.org/EIPS/eip-2535"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-400 transition flex items-center gap-1"
              >
                <span>EIP-2535</span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
