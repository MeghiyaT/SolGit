"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  GitCommit,
  GitBranch,
  GitCompare,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Clock,
  User,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Info,
} from "lucide-react";
import {
  CONTRACTS,
  V1_CODE,
  V2_BUGGY_CODE,
  V2_FIXED_CODE,
  type SelectorFeature,
  type VersionCommit,
} from "../../lib/data";

export interface CommitsTabProps {
  selectors: SelectorFeature[];
  onOpenDiff?: (selector: string, fromVersion?: number, toVersion?: number, openInPR?: boolean) => void;
  onCopyToast?: (text: string) => void;
}

// ─────────────────────────────────────────────────────────────
// Enriched Commit with Selector Metadata
// ─────────────────────────────────────────────────────────────
export interface EnrichedCommit extends VersionCommit {
  id: string; // selector-version
  selector: string;
  selectorName: string;
  signature: string;
  prevVersion?: number;
  isCurrent: boolean;
  isStable: boolean;
  isLatest: boolean;
}

// ─────────────────────────────────────────────────────────────
// Diff Structures
// ─────────────────────────────────────────────────────────────
export interface DiffLine {
  type: "add" | "delete" | "context" | "header";
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface VersionDiffData {
  fromVersionLabel: string;
  toVersionLabel: string;
  fromFilename: string;
  toFilename: string;
  title: string;
  description: string;
  alertType: "warning" | "success" | "info";
  alertTitle: string;
  alertDescription: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
  fromCode: string;
  toCode: string;
}

// ─────────────────────────────────────────────────────────────
// Formatters & Date Utilities
// ─────────────────────────────────────────────────────────────
function formatCommitDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return formatCommitDate(timestamp);
}

function truncateAddress(addr: string): string {
  if (!addr) return "";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ─────────────────────────────────────────────────────────────
// Generate Structured Diff Data for Given Selector & Versions
// ─────────────────────────────────────────────────────────────
function generateDiffData(
  selector: string,
  fromVer?: number,
  toVer?: number
): VersionDiffData {
  const isWithdraw = selector.toLowerCase() === "0x2e1a7d4d";

  // Withdraw V2 vs V1 (Buggy arithmetic injection)
  if (isWithdraw && toVer === 2) {
    const lines: DiffLine[] = [
      { type: "header", content: "@@ -147,19 +147,25 @@ contract VaultV2 @@" },
      { type: "context", oldLineNumber: 147, newLineNumber: 147, content: " contract VaultV2 {" },
      { type: "add", newLineNumber: 148, content: "     // ⚠️ INTENTIONALLY VULNERABLE FACET" },
      { type: "context", oldLineNumber: 148, newLineNumber: 149, content: "     function withdraw(uint256 amount) external {" },
      { type: "context", oldLineNumber: 149, newLineNumber: 150, content: "         VaultStorage.Layout storage vs = VaultStorage.layout();" },
      { type: "context", oldLineNumber: 150, newLineNumber: 151, content: " " },
      { type: "delete", oldLineNumber: 151, content: "         // Checks" },
      { type: "delete", oldLineNumber: 152, content: "         if (amount == 0) revert SolGitErrors.InvalidVersion();" },
      { type: "delete", oldLineNumber: 153, content: "         if (vs.balances[msg.sender] < amount) revert SolGitErrors.Unauthorized();" },
      { type: "add", newLineNumber: 152, content: "         // ❌ BUG: Missing balance check!" },
      { type: "add", newLineNumber: 153, content: "         // ❌ Unchecked subtraction allows arithmetic underflow!" },
      { type: "add", newLineNumber: 154, content: "         unchecked {" },
      { type: "delete", oldLineNumber: 155, content: "         // Effects (CEI)" },
      { type: "context", oldLineNumber: 156, newLineNumber: 155, content: "         vs.balances[msg.sender] -= amount;" },
      { type: "add", newLineNumber: 156, content: "             if (amount <= vs.totalDeposits) {" },
      { type: "add", newLineNumber: 157, content: "                 vs.totalDeposits -= amount;" },
      { type: "add", newLineNumber: 158, content: "             } else {" },
      { type: "add", newLineNumber: 159, content: "                 vs.totalDeposits = 0;" },
      { type: "add", newLineNumber: 160, content: "             }" },
      { type: "add", newLineNumber: 161, content: "         }" },
      { type: "context", oldLineNumber: 158, newLineNumber: 162, content: " " },
      { type: "add", newLineNumber: 163, content: "         // Send ETH" },
      { type: "add", newLineNumber: 164, content: "         uint256 toSend = amount > address(this).balance ? address(this).balance : amount;" },
      { type: "add", newLineNumber: 165, content: "         if (toSend > 0) {" },
      { type: "context", oldLineNumber: 160, newLineNumber: 166, content: '             (bool ok, ) = msg.sender.call{value: toSend}("");' },
      { type: "context", oldLineNumber: 161, newLineNumber: 167, content: "             if (!ok) revert SolGitErrors.Unauthorized();" },
      { type: "add", newLineNumber: 168, content: "         }" },
      { type: "context", oldLineNumber: 163, newLineNumber: 169, content: "         emit Withdrawn(msg.sender, amount);" },
      { type: "context", oldLineNumber: 164, newLineNumber: 170, content: "     }" },
      { type: "context", oldLineNumber: 165, newLineNumber: 171, content: " }" },
    ];

    return {
      fromVersionLabel: "v1 (Stable Baseline)",
      toVersionLabel: "v2 (Vulnerable Buggy)",
      fromFilename: "contracts/facets/VaultV1.sol",
      toFilename: "contracts/facets/VaultV2.sol",
      title: "withdraw(uint256) · v1 → v2 (Gas Optimization & Arithmetic Hazard)",
      description:
        "Comparison between the initial safe implementation and the gas-optimized facet containing an intentional integer underflow vulnerability.",
      alertType: "warning",
      alertTitle: "Critical Security Advisory: Arithmetic Underflow Hazard",
      alertDescription:
        "VaultV2 removed caller balance verification (if vs.balances[msg.sender] < amount revert) and enclosed the subtraction within an unchecked {} block. An unprivileged caller with 0 balance can withdraw funds, underflowing their balance to 2^256 - 1 and draining the contract.",
      additions: 14,
      deletions: 4,
      lines,
      fromCode: V1_CODE,
      toCode: V2_BUGGY_CODE,
    };
  }

  // Withdraw V3 vs V2 (AI Guardian patch)
  if (isWithdraw && toVer === 3) {
    const lines: DiffLine[] = [
      { type: "header", content: "@@ -173,26 +173,26 @@ contract VaultV2Fixed @@" },
      { type: "context", oldLineNumber: 173, newLineNumber: 173, content: " contract VaultV2Fixed {" },
      { type: "delete", oldLineNumber: 174, content: "     // ⚠️ INTENTIONALLY VULNERABLE FACET" },
      { type: "add", newLineNumber: 174, content: "     // ✅ AI SELF-HEALED FIX" },
      { type: "context", oldLineNumber: 175, newLineNumber: 175, content: "     function withdraw(uint256 amount) external {" },
      { type: "add", newLineNumber: 176, content: "         if (amount == 0) revert SolGitErrors.InvalidVersion();" },
      { type: "context", oldLineNumber: 176, newLineNumber: 177, content: " " },
      { type: "context", oldLineNumber: 177, newLineNumber: 178, content: "         VaultStorage.Layout storage vs = VaultStorage.layout();" },
      { type: "context", oldLineNumber: 178, newLineNumber: 179, content: " " },
      { type: "delete", oldLineNumber: 179, content: "         // ❌ BUG: Missing balance check!" },
      { type: "delete", oldLineNumber: 180, content: "         // ❌ Unchecked subtraction allows arithmetic underflow!" },
      { type: "delete", oldLineNumber: 181, content: "         unchecked {" },
      { type: "add", newLineNumber: 180, content: "         // ✅ FIX 1: Enforce strict balance verification" },
      { type: "add", newLineNumber: 181, content: "         if (vs.balances[msg.sender] < amount) revert SolGitErrors.Unauthorized();" },
      { type: "context", oldLineNumber: 182, newLineNumber: 182, content: " " },
      { type: "add", newLineNumber: 183, content: "         // ✅ FIX 2: Standard checked arithmetic prevents underflow" },
      { type: "context", oldLineNumber: 183, newLineNumber: 184, content: "         vs.balances[msg.sender] -= amount;" },
      { type: "delete", oldLineNumber: 184, content: "             if (amount <= vs.totalDeposits) {" },
      { type: "delete", oldLineNumber: 185, content: "                 vs.totalDeposits -= amount;" },
      { type: "delete", oldLineNumber: 186, content: "             } else {" },
      { type: "delete", oldLineNumber: 187, content: "                 vs.totalDeposits = 0;" },
      { type: "delete", oldLineNumber: 188, content: "             }" },
      { type: "delete", oldLineNumber: 189, content: "         }" },
      { type: "add", newLineNumber: 185, content: "         vs.totalDeposits -= amount;" },
      { type: "context", oldLineNumber: 190, newLineNumber: 186, content: " " },
      { type: "add", newLineNumber: 187, content: "         // ✅ FIX 3: Checks-Effects-Interactions (CEI) adhered" },
      { type: "context", oldLineNumber: 191, newLineNumber: 188, content: '         (bool ok, ) = msg.sender.call{value: amount}("");' },
      { type: "context", oldLineNumber: 192, newLineNumber: 189, content: "         if (!ok) revert SolGitErrors.Unauthorized();" },
      { type: "context", oldLineNumber: 196, newLineNumber: 190, content: " " },
      { type: "context", oldLineNumber: 197, newLineNumber: 191, content: "         emit Withdrawn(msg.sender, amount);" },
      { type: "context", oldLineNumber: 198, newLineNumber: 192, content: "     }" },
      { type: "context", oldLineNumber: 199, newLineNumber: 193, content: " }" },
    ];

    return {
      fromVersionLabel: "v2 (Vulnerable Buggy)",
      toVersionLabel: "v3 (AI Patched Stable)",
      fromFilename: "contracts/facets/VaultV2.sol",
      toFilename: "contracts/facets/VaultV2Fixed.sol",
      title: "withdraw(uint256) · v2 → v3 (AI Guardian Self-Healing Hotfix)",
      description:
        "Automated patch generated by SolGit AI Watcher restoring strict Checks-Effects-Interactions (CEI) and eliminating unchecked arithmetic blocks.",
      alertType: "success",
      alertTitle: "AI Self-Healing Resolution Verified",
      alertDescription:
        "SolGit AI Watcher detected the OUTFLOW_CAP invariant violation on selector 0x2e1a7d4d, triggered automated quarantine of v2, rolled back to v1, and synthesized VaultV2Fixed.sol. All 7 Foundry tests and Slither audits pass.",
      additions: 8,
      deletions: 10,
      lines,
      fromCode: V2_BUGGY_CODE,
      toCode: V2_FIXED_CODE,
    };
  }

  // Genesis / Initial release (v1)
  const defaultGenesisCode =
    selector === "0xd0e30db0"
      ? `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {VaultStorage} from "../storage/VaultStorage.sol";

contract VaultDepositFacet {
    event Deposited(address indexed user, uint256 amount);

    function deposit() external payable {
        require(msg.value > 0, "Zero deposit");
        VaultStorage.Layout storage vs = VaultStorage.layout();
        vs.balances[msg.sender] += msg.value;
        vs.totalDeposits += msg.value;
        emit Deposited(msg.sender, msg.value);
    }
}`
      : selector === "0x70a08231"
      ? `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {VaultStorage} from "../storage/VaultStorage.sol";

contract VaultBalanceFacet {
    function balanceOf(address account) external view returns (uint256) {
        return VaultStorage.layout().balances[account];
    }
}`
      : V1_CODE;

  const rawLines = defaultGenesisCode.split("\n");
  const lines: DiffLine[] = [
    { type: "header", content: `@@ -0,0 +1,${rawLines.length} @@ Genesis implementation` },
    ...rawLines.map((l, idx) => ({
      type: "add" as const,
      newLineNumber: idx + 1,
      content: l,
    })),
  ];

  return {
    fromVersionLabel: "Genesis (Empty)",
    toVersionLabel: `v${toVer || 1} (Genesis Stable)`,
    fromFilename: "/dev/null",
    toFilename: `contracts/facets/${selector}.sol`,
    title: `${selector} · Genesis v1 (Initial Release)`,
    description: "Initial production facet implementation registered in SolGit Diamond Router.",
    alertType: "info",
    alertTitle: "Genesis Release Implementation",
    alertDescription:
      "This facet was deployed and registered during initial Diamond proxy initialization. Verified on MST Testnet (Chain ID 91562037).",
    additions: rawLines.length,
    deletions: 0,
    lines,
    fromCode: "// Genesis — No prior version",
    toCode: defaultGenesisCode,
  };
}

// ─────────────────────────────────────────────────────────────
// CommitsTab Component
// ─────────────────────────────────────────────────────────────
export function CommitsTab({
  selectors,
  onOpenDiff,
  onCopyToast,
}: CommitsTabProps) {
  // Filters
  const [selectedSelector, setSelectedSelector] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Stable" | "Active" | "Quarantined">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Diff Viewer states
  const [expandedCommitId, setExpandedCommitId] = useState<string | null>(null);
  const [modalDiffCommit, setModalDiffCommit] = useState<EnrichedCommit | null>(null);
  const [diffViewMode, setDiffViewMode] = useState<"split" | "unified">("unified");

  // Copy feedback tracking
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = useCallback(
    (text: string, label: string, key: string) => {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      if (onCopyToast) {
        onCopyToast(`Copied ${label} to clipboard: ${text}`);
      }
    },
    [onCopyToast]
  );

  // Close modal on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setModalDiffCommit(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute all enriched commits across selectors
  const allEnrichedCommits = useMemo<EnrichedCommit[]>(() => {
    const list: EnrichedCommit[] = [];

    selectors.forEach((feat) => {
      feat.history.forEach((commit, idx) => {
        const prevCommit = idx > 0 ? feat.history[idx - 1] : undefined;
        list.push({
          ...commit,
          id: `${feat.selector}-v${commit.version}`,
          selector: feat.selector,
          selectorName: feat.name,
          signature: feat.signature,
          prevVersion: prevCommit ? prevCommit.version : undefined,
          isCurrent: commit.version === feat.currentVersion,
          isStable: commit.version === feat.stableVersion,
          isLatest: idx === feat.history.length - 1,
        });
      });
    });

    // Sort chronologically descending
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [selectors]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalCommits = 0;
    let stableCount = 0;
    let activeCount = 0;
    let quarantinedCount = 0;

    selectors.forEach((feat) => {
      feat.history.forEach((h) => {
        totalCommits++;
        if (h.status === "Stable") stableCount++;
        else if (h.status === "Active") activeCount++;
        else if (h.status === "Quarantined") quarantinedCount++;
      });
    });

    return { totalCommits, stableCount, activeCount, quarantinedCount };
  }, [selectors]);

  // Filtered commits
  const filteredCommits = useMemo<EnrichedCommit[]>(() => {
    return allEnrichedCommits.filter((item) => {
      // Selector filter
      if (selectedSelector !== "all" && item.selector !== selectedSelector) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesMsg = item.message.toLowerCase().includes(q);
        const matchesAuthor = item.author.toLowerCase().includes(q);
        const matchesSelector = item.selector.toLowerCase().includes(q);
        const matchesSignature = item.signature.toLowerCase().includes(q);
        const matchesCodeHash = item.codeHash.toLowerCase().includes(q);
        const matchesImpl = item.implementation.toLowerCase().includes(q);
        if (
          !matchesMsg &&
          !matchesAuthor &&
          !matchesSelector &&
          !matchesSignature &&
          !matchesCodeHash &&
          !matchesImpl
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allEnrichedCommits, selectedSelector, statusFilter, searchQuery]);

  // Group commits by date for authentic GitHub visual timeline
  const groupedCommits = useMemo(() => {
    const groups: { [dateStr: string]: EnrichedCommit[] } = {};

    filteredCommits.forEach((commit) => {
      const dateKey = formatCommitDate(commit.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(commit);
    });

    return Object.entries(groups).map(([dateStr, items]) => ({
      dateStr,
      items,
    }));
  }, [filteredCommits]);

  // Handle Diff Toggle / Trigger
  const handleToggleDiff = (commit: EnrichedCommit) => {
    // Toggle inline view locally without switching tabs
    setExpandedCommitId((prev) => (prev === commit.id ? null : commit.id));
  };

  const handleInspectInPR = (commit: EnrichedCommit) => {
    const fromVer = commit.prevVersion ?? (commit.version > 1 ? commit.version - 1 : undefined);
    const toVer = commit.version;
    if (onOpenDiff) {
      onOpenDiff(commit.selector, fromVer, toVer, true);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* ─────────────────────────────────────────────────────────────
          1. Header & Summary Bar
          ───────────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/90 via-[#0d1117]/80 to-zinc-950/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl overflow-hidden">
        {/* Subtle decorative background gradient accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/10">
                <GitCommit className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  Commits & Version Lifecycle
                  <span className="text-xs font-mono font-normal text-zinc-400 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
                    EIP-2535 Diamond
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                  Per-selector function versioning with granular rollback, quarantine isolation, and AI self-healing lifecycle.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2.5">
              <GitBranch className="w-4 h-4 text-zinc-400" />
              <div className="text-xs">
                <span className="text-zinc-400">Total Commits:</span>{" "}
                <span className="font-mono font-semibold text-white">
                  {metrics.totalCommits}
                </span>
              </div>
            </div>

            <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <div className="text-xs">
                <span className="text-emerald-300 font-medium">Stable:</span>{" "}
                <span className="font-mono font-semibold text-emerald-300">
                  {metrics.stableCount}
                </span>
              </div>
            </div>

            <div className="px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <div className="text-xs">
                <span className="text-cyan-300 font-medium">Active:</span>{" "}
                <span className="font-mono font-semibold text-cyan-300">
                  {metrics.activeCount}
                </span>
              </div>
            </div>

            {metrics.quarantinedCount > 0 && (
              <div className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <div className="text-xs">
                  <span className="text-rose-300 font-semibold">Quarantined:</span>{" "}
                  <span className="font-mono font-bold text-rose-300">
                    {metrics.quarantinedCount}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            Function Selector Filter Pills
            ───────────────────────────────────────────────────────────── */}
        <div className="mt-6 pt-5 border-t border-white/[0.06] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              Filter by Function Selector:
            </span>
            {selectedSelector !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedSelector("all")}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
              >
                <span>Reset to All Functions</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* All Functions Pill */}
            <button
              type="button"
              onClick={() => setSelectedSelector("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                selectedSelector === "all"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10"
                  : "bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:text-zinc-200 hover:bg-white/[0.06]"
              }`}
            >
              <span>All Functions</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                  selectedSelector === "all"
                    ? "bg-emerald-500/30 text-emerald-200"
                    : "bg-white/[0.06] text-zinc-400"
                }`}
              >
                {allEnrichedCommits.length}
              </span>
            </button>

            {/* Individual Selector Pills */}
            {selectors.map((feat) => {
              const isSelected = selectedSelector === feat.selector;
              const currentCommit = feat.history.find(
                (h) => h.version === feat.currentVersion
              );
              const isQuarantined = currentCommit?.status === "Quarantined";
              const isStable = currentCommit?.status === "Stable";

              return (
                <button
                  key={feat.selector}
                  type="button"
                  onClick={() => setSelectedSelector(feat.selector)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10"
                      : "bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:text-zinc-200 hover:bg-white/[0.06]"
                  }`}
                >
                  {/* Status dot */}
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isQuarantined
                        ? "bg-rose-400 animate-ping"
                        : isStable
                        ? "bg-emerald-400"
                        : "bg-cyan-400"
                    }`}
                  />
                  <span className="font-mono text-zinc-200">{feat.signature}</span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    ({feat.selector})
                  </span>
                  <span
                    className={`px-1.5 py-[1px] rounded text-[10px] font-mono font-medium ${
                      isQuarantined
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-white/[0.06] text-zinc-300"
                    }`}
                  >
                    v{feat.currentVersion}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            Search & Status Quick Filters
            ───────────────────────────────────────────────────────────── */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter commits by message, SHA, author, or facet..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-black/40 border border-white/[0.08] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/[0.06] text-xs">
            {(["all", "Stable", "Active", "Quarantined"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  statusFilter === st
                    ? st === "Quarantined"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : st === "Stable"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : st === "Active"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-white/[0.1] text-white border border-white/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                }`}
              >
                {st === "all" ? "All Statuses" : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. Git Commit Timeline
          ───────────────────────────────────────────────────────────── */}
      {groupedCommits.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d1117]/60 backdrop-blur-md p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center mx-auto text-zinc-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No commits match your filters</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, clearing the selector filter, or selecting &quot;All Statuses&quot;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedSelector("all");
              setStatusFilter("all");
              setSearchQuery("");
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedCommits.map((group) => (
            <div key={group.dateStr} className="space-y-4">
              {/* Date Group Header */}
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 px-1">
                <GitBranch className="w-4 h-4 text-emerald-400" />
                <span className="text-zinc-200 font-semibold">{group.dateStr}</span>
                <span className="text-zinc-400">·</span>
                <span>
                  {group.items.length} {group.items.length === 1 ? "commit" : "commits"}
                </span>
              </div>

              {/* Commits Container with Vertical Branch Line */}
              <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-[15px] sm:before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-emerald-500/60 before:via-cyan-500/40 before:to-zinc-800">
                {group.items.map((commit) => {
                  const isStable = commit.status === "Stable";
                  const isQuarantined = commit.status === "Quarantined";
                  const isExpanded = expandedCommitId === commit.id;
                  const isAIWatcher = commit.author.toLowerCase().includes("ai");

                  return (
                    <div key={commit.id} className="relative group">
                      {/* Timeline Node Circle */}
                      <div
                        className={`absolute -left-[27px] sm:-left-[31px] top-4.5 w-6 h-6 rounded-full ring-4 transition-all flex items-center justify-center z-10 ${
                          isQuarantined
                            ? "bg-rose-500 ring-rose-950/80 border border-rose-400 text-white animate-pulse"
                            : isStable
                            ? "bg-emerald-500 ring-emerald-950/80 border border-emerald-400 text-black shadow-sm shadow-emerald-500/20"
                            : "bg-cyan-500 ring-cyan-950/80 border border-cyan-400 text-black"
                        }`}
                        title={`Version ${commit.version} - ${commit.status}`}
                      >
                        {isQuarantined ? (
                          <AlertTriangle className="w-3 h-3 text-white" />
                        ) : isStable ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                        ) : (
                          <Zap className="w-3 h-3 text-black" />
                        )}
                      </div>

                      {/* Commit Card Container */}
                      <div className="rounded-2xl border border-white/[0.08] bg-[#0d1117]/80 hover:bg-[#0d1117] hover:border-white/20 transition-all duration-200 backdrop-blur-md p-4 sm:p-5 shadow-lg">
                        {/* Top Row: Message + Version + Status */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-white/[0.06]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-white group-hover:text-emerald-300 transition">
                                {commit.message}
                              </span>
                              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                                v{commit.version}
                              </span>
                            </div>

                            {/* Selector and Signature Indicator */}
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <span className="font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                                {commit.selector}
                              </span>
                              <span className="font-mono text-zinc-300 font-medium">
                                {commit.signature}
                              </span>
                            </div>
                          </div>

                          {/* Lifecycle Status Badge */}
                          <div className="flex items-center gap-2 shrink-0">
                            {isQuarantined ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Quarantined
                              </span>
                            ) : isStable ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Stable
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                <Zap className="w-3.5 h-3.5" />
                                Active
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle & Bottom Meta Row */}
                        <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                          {/* Author & Timestamp */}
                          <div className="flex items-center gap-3 flex-wrap">
                            {/* Author */}
                            <div className="flex items-center gap-1.5">
                              {isAIWatcher ? (
                                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-black">
                                  <Sparkles className="w-3 h-3" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                                  <User className="w-3 h-3" />
                                </div>
                              )}
                              <span className="font-mono text-zinc-300 font-medium">
                                {commit.author}
                              </span>
                              {isAIWatcher && (
                                <span className="text-[10px] px-1.5 py-[1px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                                  AI Guardian
                                </span>
                              )}
                            </div>

                            <span className="text-zinc-600">·</span>

                            {/* Relative Timestamp */}
                            <div className="flex items-center gap-1 text-zinc-400">
                              <Clock className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{formatRelativeTime(commit.timestamp)}</span>
                            </div>
                          </div>

                          {/* Technical Hashes & Actions */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Commit SHA Pill */}
                            <div className="flex items-center rounded-lg bg-black/40 border border-white/[0.08] overflow-hidden">
                              <span className="px-2 py-1 font-mono text-[11px] text-zinc-300">
                                {commit.codeHash ? commit.codeHash.slice(0, 7) : `v${commit.version}`}
                              </span>
                              <button
                                type="button"
                                title="Copy commit hash"
                                onClick={() =>
                                  handleCopy(
                                    commit.codeHash,
                                    "Commit SHA",
                                    `sha-${commit.id}`
                                  )
                                }
                                className="px-2 py-1 border-l border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.04] transition"
                              >
                                {copiedKey === `sha-${commit.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>

                            {/* Implementation Address Pill */}
                            <div className="flex items-center rounded-lg bg-black/40 border border-white/[0.08] overflow-hidden">
                              <span
                                className="px-2 py-1 font-mono text-[11px] text-zinc-300"
                                title={commit.implementation}
                              >
                                {truncateAddress(commit.implementation)}
                              </span>
                              <button
                                type="button"
                                title="Copy implementation address"
                                onClick={() =>
                                  handleCopy(
                                    commit.implementation,
                                    "Implementation Address",
                                    `impl-${commit.id}`
                                  )
                                }
                                className="px-2 py-1 border-l border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.04] transition"
                              >
                                {copiedKey === `impl-${commit.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                              <a
                                href={`${CONTRACTS.explorer}/address/${commit.implementation}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View on MSTScan Explorer"
                                className="px-2 py-1 border-l border-white/[0.08] text-zinc-400 hover:text-cyan-400 hover:bg-white/[0.04] transition"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>

                            {/* View Diff Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleDiff(commit)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                                isExpanded
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : "bg-white/[0.05] text-zinc-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.08]"
                              }`}
                            >
                              <GitCompare className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{isExpanded ? "Hide Diff" : "View Diff"}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            {/* Full Modal Inspector Trigger */}
                            <button
                              type="button"
                              title="Inspect in full macOS modal"
                              onClick={() => setModalDiffCommit(commit)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] transition"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* ─────────────────────────────────────────────────────────────
                            Inline Diff Inspector (Rendered when isExpanded is true)
                            ───────────────────────────────────────────────────────────── */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-white/[0.08] animate-fadeIn">
                            <InlineDiffInspector
                              commit={commit}
                              diffMode={diffViewMode}
                              onToggleDiffMode={() =>
                                setDiffViewMode((m) =>
                                  m === "split" ? "unified" : "split"
                                )
                              }
                              onOpenModal={() => setModalDiffCommit(commit)}
                              onCopy={handleCopy}
                              onInspectInPR={() => handleInspectInPR(commit)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. macOS Fullscreen / Modal Diff Inspector
          ───────────────────────────────────────────────────────────── */}
      {modalDiffCommit && (
        <ModalDiffInspector
          commit={modalDiffCommit}
          diffMode={diffViewMode}
          onToggleDiffMode={() =>
            setDiffViewMode((m) => (m === "split" ? "unified" : "split"))
          }
          onClose={() => setModalDiffCommit(null)}
          onCopy={handleCopy}
          onInspectInPR={() => handleInspectInPR(modalDiffCommit)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Subcomponent: Inline Diff Inspector
// ─────────────────────────────────────────────────────────────
interface InlineDiffInspectorProps {
  commit: EnrichedCommit;
  diffMode: "split" | "unified";
  onToggleDiffMode: () => void;
  onOpenModal: () => void;
  onCopy: (text: string, label: string, key: string) => void;
  onInspectInPR?: () => void;
}

function InlineDiffInspector({
  commit,
  diffMode,
  onToggleDiffMode,
  onOpenModal,
  onCopy,
  onInspectInPR,
}: InlineDiffInspectorProps) {
  const fromVer = commit.prevVersion ?? (commit.version > 1 ? commit.version - 1 : undefined);
  const diffData = useMemo(
    () => generateDiffData(commit.selector, fromVer, commit.version),
    [commit.selector, fromVer, commit.version]
  );

  return (
    <div className="rounded-xl border border-white/[0.1] bg-black/60 overflow-hidden shadow-2xl">
      {/* macOS Window Title Bar */}
      <div className="px-4 py-2.5 bg-zinc-950/90 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Traffic Lights + Path */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block border border-rose-600" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block border border-amber-600" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block border border-emerald-600" />
          </div>
          <span className="font-mono text-xs text-zinc-300">
            diff --git a/{diffData.fromFilename} b/{diffData.toFilename}
          </span>
        </div>

        {/* Right: Stats & Controls */}
        <div className="flex items-center gap-2">
          {/* Inspect in PR #42 */}
          {onInspectInPR && (
            <button
              type="button"
              onClick={onInspectInPR}
              className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-medium border border-emerald-500/30 transition flex items-center gap-1 cursor-pointer"
              title="Inspect in PR #42"
            >
              <span>Inspect in PR #42 →</span>
            </button>
          )}

          {/* Additions / Deletions Pills */}
          <div className="flex items-center gap-1 text-[11px] font-mono">
            <span className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
              +{diffData.additions}
            </span>
            <span className="text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">
              -{diffData.deletions}
            </span>
          </div>

          {/* Diff Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDiffMode}
            className="px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-[11px] font-mono border border-white/[0.08] transition"
          >
            {diffMode === "unified" ? "Split View" : "Unified View"}
          </button>

          {/* Copy Patch */}
          <button
            type="button"
            onClick={() =>
              onCopy(
                diffData.lines.map((l) => l.content).join("\n"),
                "Diff Patch",
                `patch-${commit.id}`
              )
            }
            className="px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-[11px] font-mono border border-white/[0.08] transition flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            <span>Copy Patch</span>
          </button>

          {/* Fullscreen Expand */}
          <button
            type="button"
            onClick={onOpenModal}
            title="Expand to Fullscreen Modal"
            className="p-1 rounded bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08] transition"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Advisory Alert Banner */}
      <div
        className={`px-4 py-3 border-b flex items-start gap-3 text-xs ${
          diffData.alertType === "warning"
            ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
            : diffData.alertType === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
            : "bg-cyan-500/10 border-cyan-500/20 text-cyan-300"
        }`}
      >
        {diffData.alertType === "warning" ? (
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        ) : diffData.alertType === "success" ? (
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
        ) : (
          <Info className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
        )}
        <div>
          <div className="font-semibold">{diffData.alertTitle}</div>
          <div className="text-zinc-300 text-[11px] mt-0.5 leading-relaxed">
            {diffData.alertDescription}
          </div>
        </div>
      </div>

      {/* Code Viewer Body */}
      {diffMode === "unified" ? (
        <UnifiedDiffViewer lines={diffData.lines} />
      ) : (
        <SplitDiffViewer
          fromCode={diffData.fromCode}
          toCode={diffData.toCode}
          fromLabel={diffData.fromVersionLabel}
          toLabel={diffData.toVersionLabel}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Subcomponent: Unified Diff Line Renderer
// ─────────────────────────────────────────────────────────────
function UnifiedDiffViewer({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="font-mono text-xs overflow-x-auto max-h-[460px] divide-y divide-white/[0.02] bg-[#090d13]">
      {lines.map((line, idx) => {
        if (line.type === "header") {
          return (
            <div
              key={idx}
              className="px-4 py-1.5 bg-cyan-950/30 text-cyan-400 font-semibold text-[11px] select-none"
            >
              {line.content}
            </div>
          );
        }

        const isAdd = line.type === "add";
        const isDelete = line.type === "delete";

        return (
          <div
            key={idx}
            className={`flex items-stretch hover:bg-white/[0.02] transition-colors ${
              isAdd
                ? "bg-emerald-950/25 text-emerald-200 border-l-2 border-emerald-500"
                : isDelete
                ? "bg-rose-950/25 text-rose-200 border-l-2 border-rose-500"
                : "text-zinc-300 border-l-2 border-transparent"
            }`}
          >
            {/* Old Line Number */}
            <span className="w-10 sm:w-12 shrink-0 px-2 py-0.5 text-right text-[11px] text-zinc-400 select-none bg-black/20">
              {line.oldLineNumber ?? ""}
            </span>

            {/* New Line Number */}
            <span className="w-10 sm:w-12 shrink-0 px-2 py-0.5 text-right text-[11px] text-zinc-400 select-none bg-black/20 border-r border-white/[0.04]">
              {line.newLineNumber ?? ""}
            </span>

            {/* Marker */}
            <span className="w-6 shrink-0 text-center py-0.5 select-none font-bold">
              {isAdd ? "+" : isDelete ? "-" : " "}
            </span>

            {/* Code Content */}
            <span className="py-0.5 pr-4 whitespace-pre font-mono flex-1 leading-relaxed">
              {line.content.startsWith("+") || line.content.startsWith("-")
                ? line.content.slice(1)
                : line.content}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Subcomponent: Split (Side-by-Side) Diff Viewer
// ─────────────────────────────────────────────────────────────
function SplitDiffViewer({
  fromCode,
  toCode,
  fromLabel,
  toLabel,
}: {
  fromCode: string;
  toCode: string;
  fromLabel: string;
  toLabel: string;
}) {
  const fromLines = fromCode.split("\n");
  const toLines = toCode.split("\n");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] bg-[#090d13]">
      {/* Left Column (Prior Version) */}
      <div>
        <div className="px-4 py-2 bg-zinc-950/80 border-b border-white/[0.06] flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400">{fromLabel}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
            Base
          </span>
        </div>
        <div className="p-4 font-mono text-xs overflow-x-auto max-h-[460px] space-y-0.5 leading-relaxed">
          {fromLines.map((l, i) => (
            <div key={i} className="flex items-start text-zinc-300">
              <span className="w-8 shrink-0 text-right pr-3 text-zinc-400 select-none text-[11px]">
                {i + 1}
              </span>
              <span className="whitespace-pre flex-1">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column (New Version) */}
      <div>
        <div className="px-4 py-2 bg-zinc-950/80 border-b border-white/[0.06] flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400">{toLabel}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Target
          </span>
        </div>
        <div className="p-4 font-mono text-xs overflow-x-auto max-h-[460px] space-y-0.5 leading-relaxed">
          {toLines.map((l, i) => (
            <div key={i} className="flex items-start text-zinc-300">
              <span className="w-8 shrink-0 text-right pr-3 text-zinc-400 select-none text-[11px]">
                {i + 1}
              </span>
              <span className="whitespace-pre flex-1">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Subcomponent: macOS Modal Diff Inspector
// ─────────────────────────────────────────────────────────────
interface ModalDiffInspectorProps {
  commit: EnrichedCommit;
  diffMode: "split" | "unified";
  onToggleDiffMode: () => void;
  onClose: () => void;
  onCopy: (text: string, label: string, key: string) => void;
  onInspectInPR?: () => void;
}

function ModalDiffInspector({
  commit,
  diffMode,
  onToggleDiffMode,
  onClose,
  onCopy,
  onInspectInPR,
}: ModalDiffInspectorProps) {
  const fromVer = commit.prevVersion ?? (commit.version > 1 ? commit.version - 1 : undefined);
  const diffData = useMemo(
    () => generateDiffData(commit.selector, fromVer, commit.version),
    [commit.selector, fromVer, commit.version]
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
    >
      <div className="max-w-5xl w-full max-h-[90vh] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
        {/* Modal Window Header */}
        <div className="px-5 py-3.5 bg-zinc-900/90 border-b border-white/[0.08] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* macOS Window Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 transition border border-rose-600 flex items-center justify-center group"
              >
                <X className="w-2 h-2 text-rose-950 opacity-0 group-hover:opacity-100" />
              </button>
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600" />
            </div>

            <div className="h-4 w-[1px] bg-white/10" />

            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-white">
                {diffData.title}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {onInspectInPR && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onInspectInPR();
                }}
                className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition flex items-center gap-1 cursor-pointer"
                title="Inspect in PR #42"
              >
                <span>Inspect in PR #42 →</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleDiffMode}
              className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono text-zinc-300 border border-white/[0.08] transition"
            >
              {diffMode === "unified" ? "Split View" : "Unified View"}
            </button>

            <button
              type="button"
              onClick={() =>
                onCopy(
                  diffData.lines.map((l) => l.content).join("\n"),
                  "Diff Patch",
                  `modal-patch-${commit.id}`
                )
              }
              className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono text-zinc-300 border border-white/[0.08] transition flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Patch</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Advisory Banner */}
        <div
          className={`px-6 py-3 border-b flex items-start gap-3 text-xs ${
            diffData.alertType === "warning"
              ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
              : diffData.alertType === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-cyan-500/10 border-cyan-500/20 text-cyan-300"
          }`}
        >
          {diffData.alertType === "warning" ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          ) : diffData.alertType === "success" ? (
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
          )}
          <div>
            <div className="font-semibold">{diffData.alertTitle}</div>
            <div className="text-zinc-300 text-xs mt-0.5 leading-relaxed">
              {diffData.alertDescription}
            </div>
          </div>
        </div>

        {/* Modal Code Body */}
        <div className="flex-1 overflow-y-auto">
          {diffMode === "unified" ? (
            <UnifiedDiffViewer lines={diffData.lines} />
          ) : (
            <SplitDiffViewer
              fromCode={diffData.fromCode}
              toCode={diffData.toCode}
              fromLabel={diffData.fromVersionLabel}
              toLabel={diffData.toVersionLabel}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-zinc-900/60 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-zinc-300">
              Commit: {commit.codeHash?.slice(0, 7) ?? `v${commit.version}`}
            </span>
            <span>·</span>
            <span>Selector: {commit.selector}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-zinc-200 font-medium transition cursor-pointer"
          >
            Close Inspector (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
