"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { TopNav } from "../components/TopNav";
import { RepoHeader } from "../components/RepoHeader";
import { TabNav } from "../components/TabNav";
import { CodeTab } from "../components/tabs/CodeTab";
import { CommitsTab } from "../components/tabs/CommitsTab";
import { PullRequestsTab } from "../components/tabs/PullRequestsTab";
import { SecurityTab } from "../components/tabs/SecurityTab";
import { CommandPalette } from "../components/CommandPalette";
import { Toast } from "../components/Toast";
import { DashboardView } from "../components/dashboard/DashboardView";
import { NewRepoModal } from "../components/dashboard/NewRepoModal";
import { NicknameModal } from "../components/wallet/NicknameModal";
import { Web3WalletProvider, useWeb3Wallet } from "../hooks/useWeb3Wallet";
import {
  INITIAL_SELECTORS,
  INITIAL_EVENTS,
  INITIAL_REPOSITORIES,
  INITIAL_PULL_REQUESTS,
  CONTRACTS,
  type SelectorFeature,
  type RollbackEvent,
  type VersionCommit,
} from "../lib/data";
import type { TabType, ToastNotification, ViewType, Repository, PullRequestItem } from "../lib/types";

interface ApiRepoItem {
  id: string;
  name: string;
  owner_nickname?: string;
  description: string;
  is_private?: boolean;
  updated_at?: string;
  contract_address: string;
  tx_hash?: string;
  sol_code?: string;
  facet_count?: number;
  guardian_active?: boolean;
}

function DashboardApp() {
  // ─────────────────────────────────────────────────────────────
  // Platform & Wallet State
  // ─────────────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [repos, setRepos] = useState<Repository[]>(INITIAL_REPOSITORIES);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [isNewRepoModalOpen, setIsNewRepoModalOpen] = useState<boolean>(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState<boolean>(false);
  const wallet = useWeb3Wallet();
  const { isConnected, checksumAddress, setNickname } = wallet;

  // Reset repos on disconnect during render
  const [prevConnected, setPrevConnected] = useState(isConnected);
  if (isConnected !== prevConnected) {
    setPrevConnected(isConnected);
    if (!isConnected) {
      setRepos([]);
      setSelectedRepoId(null);
    }
  }

  // Onboard new user without nickname & load user repositories
  useEffect(() => {
    if (!isConnected || !checksumAddress) {
      return;
    }

    fetch(`/api/user?address=${checksumAddress}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.nickname) {
          setNickname(data.user.nickname);
        } else {
          // New user detected! Prompt for nickname
          setIsNicknameModalOpen(true);
        }
      })
      .catch(() => {
        setIsNicknameModalOpen(true);
      });

    fetch(`/api/repos?address=${checksumAddress}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.repositories) && data.repositories.length > 0) {
          const mappedRepos: Repository[] = (data.repositories as ApiRepoItem[]).map((r) => ({
            id: r.id,
            name: r.name,
            owner: r.owner_nickname || "developer",
            description: r.description,
            isPrivate: Boolean(r.is_private),
            updatedAt: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "Recently",
            contractAddress: r.contract_address,
            facetCount: r.facet_count || 1,
            guardianActive: Boolean(r.guardian_active),
            solCode: r.sol_code,
            txHash: r.tx_hash,
          }));
          setRepos(mappedRepos);
          setSelectedRepoId(mappedRepos[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to load user repos:", err);
      });
  }, [isConnected, checksumAddress, setNickname]);

  // ─────────────────────────────────────────────────────────────
  // Active Repository State Machine
  // ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>("code");
  const [selectedFile, setSelectedFile] = useState<string>("CoralVault.sol");
  const [selectors, setSelectors] = useState<SelectorFeature[]>(INITIAL_SELECTORS);
  const [events, setEvents] = useState<RollbackEvent[]>(INITIAL_EVENTS);
  const [isHacked, setIsHacked] = useState<boolean>(false);
  const [isMerged, setIsMerged] = useState<boolean>(false);
  const [vaultTvl, setVaultTvl] = useState<number>(15.0);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Active repository object
  const activeRepo = useMemo(() => {
    return repos.find((r) => r.id === selectedRepoId) || repos[0] || null;
  }, [repos, selectedRepoId]);

  // Dynamic Pull Requests list reflecting merged state
  const pullRequests: PullRequestItem[] = useMemo(() => {
    return INITIAL_PULL_REQUESTS.map((pr) => ({
      ...pr,
      status: isMerged ? ("merged" as const) : pr.status,
    }));
  }, [isMerged]);

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

    // Prepend a high-severity rollback event with context
    const newEvent: RollbackEvent = {
      id: `evt-${Date.now()}`,
      selector: "0x2e1a7d4d",
      badVersion: 2,
      goodVersion: 1,
      triggeredBy: "0x67852244E41F39CA15605264536E94BaBf56A4e7",
      contextHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      txHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
      blockNumber: 4892015,
      timestamp: "Just now",
      status: "BLOCKED & ROLLED BACK",
      invariant: "OUTFLOW_CAP <= 100 ether && balance >= minReserve",
    };
    setEvents((prev) => [newEvent, ...prev]);

    showToast(
      "Guardian Circuit Breaker Tripped!",
      "Invariant violation detected on 0x2e1a7d4d (withdraw). Execution reverted & auto-rolled back to stable Version 1.",
      "error",
      5000
    );
  }, [showToast]);

  // Synchronize vault state live with standalone demo dApp (localhost:3001)
  useEffect(() => {
    let isMounted = true;
    const syncVaultState = async () => {
      try {
        const res = await fetch("/api/vault/state");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (typeof data.tvl === "number") {
              setVaultTvl(data.tvl);
            }
            if (data.isHacked && !isHacked) {
              handleTriggerHack();
            }
          }
        }
      } catch {
        // Fallback silently if offline
      }
    };

    syncVaultState();
    const interval = setInterval(syncVaultState, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isHacked, handleTriggerHack]);

  // 2. PR Merged / AI Fix Deployed -> Upgrade to Version 3
  const handleMergeFix = useCallback(() => {
    setIsMerged(true);
    setIsHacked(false);

    const v3Commit: VersionCommit = {
      version: 3,
      implementation: CONTRACTS.vaultV2Fixed,
      codeHash: "0x892a71c828d8b9e847c5031b209a8f4c71829e018a7b94c029e84a9c812739a1",
      status: "Active",
      timestamp: Date.now(),
      author: "0xAI-Watcher-Bot",
      message: "feat: enforce SafeMath & Checks-Effects-Interactions (CEI)",
    };

    setSelectors((prev) =>
      prev.map((s) => {
        if (s.selector === "0x2e1a7d4d") {
          return {
            ...s,
            currentVersion: 3,
            stableVersion: 3,
            history: [
              v3Commit,
              ...s.history.map((h) =>
                h.version === 2 ? { ...h, status: "Quarantined" as const } : h
              ),
            ],
          };
        }
        return s;
      })
    );

    fetch("/api/vault/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "merge" }),
    }).catch(() => {});

    showToast(
      "Pull Request #42 Merged!",
      "Hotfix facet deployed live. Selector 0x2e1a7d4d promoted to Version 3 (Active & Protected).",
      "success",
      5000
    );
  }, [showToast]);

  // 3. Reset Demo State
  const handleReset = useCallback(() => {
    setIsHacked(false);
    setIsMerged(false);
    setSelectors(INITIAL_SELECTORS);
    setEvents(INITIAL_EVENTS);
    if (activeRepo) {
      setSelectedFile(`${activeRepo.name}.sol`);
    }

    fetch("/api/vault/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    }).catch(() => {});

    showToast(
      "State Reset",
      "Repository restored to production stable baseline.",
      "info",
      3500
    );
  }, [showToast, activeRepo]);

  // 4. Create Repository
  const handleCreateRepo = useCallback((newRepo: Repository) => {
    setRepos((prev) => [newRepo, ...prev]);
    setSelectedRepoId(newRepo.id);
    setSelectedFile(`${newRepo.name}.sol`);
    setCurrentView("repository");
    setActiveTab("code");
    showToast(
      "Repository Initialized",
      `Created ${newRepo.owner}/${newRepo.name} behind Diamond Proxy (${newRepo.contractAddress.slice(0, 8)}...).`,
      "success",
      4000
    );
  }, [showToast]);

  // ─────────────────────────────────────────────────────────────
  // Keyboard Shortcuts: ⌘K or / for Search, 1-5 for Tabs
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle command palette: ⌘K, Ctrl+K, or pressing "/" when not inside an input
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
        return;
      }

      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsPaletteOpen(true);
        return;
      }

      if (e.key === "Escape" && isPaletteOpen) {
        setIsPaletteOpen(false);
        return;
      }

      // Quick tab switching: 1-5 only in repository view when not in an input
      if (
        currentView === "repository" &&
        !isPaletteOpen &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName) &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        if (e.code === "Digit1" || e.key === "1") {
          e.preventDefault();
          setActiveTab("code");
        } else if (e.code === "Digit2" || e.key === "2") {
          e.preventDefault();
          setActiveTab("commits");
        } else if (e.code === "Digit3" || e.key === "3") {
          e.preventDefault();
          setActiveTab("pulls");
        } else if (e.code === "Digit4" || e.key === "4") {
          e.preventDefault();
          setActiveTab("security");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaletteOpen, currentView]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* ──────────────────────────────────────────────────────────
          1. GitHub Standard Top Navigation Bar
          ────────────────────────────────────────────────────────── */}
      <TopNav
        currentView={currentView}
        onNavigateHome={() => setCurrentView("dashboard")}
        onOpenNewRepoModal={() => setIsNewRepoModalOpen(true)}
        onOpenCommandPalette={() => setIsPaletteOpen(true)}
        onActionToast={showToast}
        onEditNickname={() => setIsNicknameModalOpen(true)}
        activeRepo={{
          owner: activeRepo?.owner || wallet.nickname || "user",
          name: activeRepo?.name || "contracts",
        }}
      />

      {/* ──────────────────────────────────────────────────────────
          2. Conditional Main View: Dashboard vs Clean Repository
          ────────────────────────────────────────────────────────── */}
      {currentView === "dashboard" || !activeRepo ? (
        <DashboardView
          repos={repos}
          selectedRepoId={selectedRepoId || ""}
          onSelectRepo={(id) => {
            setSelectedRepoId(id);
            const found = repos.find((r) => r.id === id);
            if (found) {
              setSelectedFile(`${found.name}.sol`);
            }
            setCurrentView("repository");
          }}
          onOpenNewRepoModal={() => setIsNewRepoModalOpen(true)}
          address={wallet.checksumAddress}
          nickname={wallet.nickname}
          isConnected={wallet.isConnected}
          onRequireWallet={(msg) => showToast("BridgeKey Required", msg, "warning")}
          pullRequests={pullRequests}
          recentEvents={events}
          onNavigatePR={() => {
            setCurrentView("repository");
            setActiveTab("pulls");
          }}
        />
      ) : (
        <div className="flex-1 flex flex-col">
          {/* GitHub Repository Meta Header with SolGit breadcrumb */}
          <RepoHeader
            isGuardianActive={activeRepo.guardianActive}
            onActionToast={handleActionToast}
            onNavigateHome={() => setCurrentView("dashboard")}
            owner={activeRepo.owner}
            repoName={activeRepo.name}
            isPrivate={activeRepo.isPrivate}
          />

          {/* Subnavigation Tabs (Code, Commits, PRs, Security) */}
          <TabNav
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            prCount={isHacked || isMerged ? 1 : 0}
            hasSecurityAlert={isHacked && !isMerged}
          />

          {/* Main Active Tab Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
            <div key={activeTab} className="transition-opacity duration-150">
              {activeTab === "code" && (
                <CodeTab
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                  isHacked={isHacked}
                  isMerged={isMerged}
                  onCopyToast={handleCopyToast}
                  activeRepo={activeRepo}
                  onNavigateCommits={() => setActiveTab("commits")}
                />
              )}

              {activeTab === "commits" && (
                <CommitsTab
                  selectors={selectors}
                  activeRepo={activeRepo}
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
                  isMerged={isMerged}
                  onMergeFix={handleMergeFix}
                  activeRepo={activeRepo}
                  vaultTvl={vaultTvl}
                  onNavigatePR={() => {
                    setCurrentView("repository");
                    setActiveTab("pulls");
                  }}
                />
              )}
            </div>
          </main>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          3. New Repository / Smart Contract Uploader Modal
          ────────────────────────────────────────────────────────── */}
      <NewRepoModal
        isOpen={isNewRepoModalOpen}
        onClose={() => setIsNewRepoModalOpen(false)}
        onCreateRepo={handleCreateRepo}
        defaultOwner={wallet.nickname || (wallet.checksumAddress ? `${wallet.checksumAddress.slice(0, 6)}...${wallet.checksumAddress.slice(-4)}` : "developer")}
        ownerAddress={wallet.checksumAddress}
      />

      {/* ──────────────────────────────────────────────────────────
          3b. First-Time Nickname Onboarding Modal
          ────────────────────────────────────────────────────────── */}
      {wallet.checksumAddress && (
        <NicknameModal
          isOpen={isNicknameModalOpen}
          onClose={() => setIsNicknameModalOpen(false)}
          address={wallet.checksumAddress}
          currentNickname={wallet.nickname}
          onSave={(savedName) => {
            wallet.setNickname(savedName);
            setRepos((prev) => prev.map((r) => ({ ...r, owner: savedName })));
            showToast("Welcome to SolGit!", `Developer nickname set to "${savedName}".`, "success");
          }}
        />
      )}

      {/* ──────────────────────────────────────────────────────────
          4. Command Palette Modal (⌘K / Ctrl+K / "/")
          ────────────────────────────────────────────────────────── */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onSelectTab={(tab) => {
          setCurrentView("repository");
          setActiveTab(tab);
          setIsPaletteOpen(false);
        }}
        onSelectFile={(fileName) => {
          setCurrentView("repository");
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
          5. Toast Notification
          ────────────────────────────────────────────────────────── */}
      <Toast
        notification={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Web3WalletProvider>
      <DashboardApp />
    </Web3WalletProvider>
  );
}
