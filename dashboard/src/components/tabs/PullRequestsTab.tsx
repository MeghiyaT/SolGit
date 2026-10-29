"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  GitPullRequest,
  GitMerge,
  GitCommit,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Terminal,
  Clock,
  FileCode,
  Code2,
  Cpu,
  MessageSquare,
  Filter,
  Search,
  Bot,
  ThumbsUp,
  Columns,
  Layers,
  Lock,
  ArrowLeft,
  CheckCheck,
  RotateCcw,
  FileCheck,
  Tag,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  CONTRACTS,
  INITIAL_PR,
  V2_BUGGY_CODE,
  V2_FIXED_CODE,
  type PullRequestItem,
  type PullRequestCheck,
} from "../../lib/data";

// ─────────────────────────────────────────────────────────────
// Component Props Interface
// ─────────────────────────────────────────────────────────────
export interface PullRequestsTabProps {
  isMerged: boolean;
  isHacked: boolean;
  onMergeFix: () => void;
  onActionToast?: (msg: string) => void;
}

// ─────────────────────────────────────────────────────────────
// Sub-types & Structures
// ─────────────────────────────────────────────────────────────
export type PrSubTab = "conversation" | "commits" | "checks" | "files";
export type MergeStrategy = "merge-commit" | "squash" | "rebase";

export interface DiffLine {
  type: "add" | "delete" | "context" | "header";
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface SplitDiffRow {
  left?: {
    lineNum?: number;
    content: string;
    type: "delete" | "context" | "empty";
  };
  right?: {
    lineNum?: number;
    content: string;
    type: "add" | "context" | "empty";
  };
}

export interface CiCheckDetail extends PullRequestCheck {
  id: string;
  command: string;
  category: "test" | "invariant" | "security" | "diamond";
  suiteName: string;
  logs: string[];
}

export interface HistoricalPR {
  id: number;
  title: string;
  status: "open" | "merged" | "closed";
  author: string;
  isBot?: boolean;
  branchFrom: string;
  branchTo: string;
  timeAgo: string;
  commentsCount: number;
  checksSummary: string;
  labels: { text: string; color: string }[];
  additions: number;
  deletions: number;
}

// ─────────────────────────────────────────────────────────────
// Diff Lines Fixture (VaultV2.sol -> VaultV2Fixed.sol)
// Exactly +12 additions, -8 deletions
// ─────────────────────────────────────────────────────────────
const PR_DIFF_LINES: DiffLine[] = [
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

const RAW_PATCH_DIFF = `--- a/contracts/facets/VaultV2.sol
+++ b/contracts/facets/VaultV2Fixed.sol
@@ -173,26 +173,26 @@ contract VaultV2Fixed {
 contract VaultV2Fixed {
-    // ⚠️ INTENTIONALLY VULNERABLE FACET
+    // ✅ AI SELF-HEALED FIX
     function withdraw(uint256 amount) external {
+        if (amount == 0) revert SolGitErrors.InvalidVersion();
 
         VaultStorage.Layout storage vs = VaultStorage.layout();
 
-        // ❌ BUG: Missing balance check!
-        // ❌ Unchecked subtraction allows arithmetic underflow!
-        unchecked {
+        // ✅ FIX 1: Enforce strict balance verification
+        if (vs.balances[msg.sender] < amount) revert SolGitErrors.Unauthorized();
 
+        // ✅ FIX 2: Standard checked arithmetic prevents underflow
         vs.balances[msg.sender] -= amount;
-            if (amount <= vs.totalDeposits) {
-                vs.totalDeposits -= amount;
-            } else {
-                vs.totalDeposits = 0;
-            }
-        }
+        vs.totalDeposits -= amount;
 
+        // ✅ FIX 3: Checks-Effects-Interactions (CEI) adhered
         (bool ok, ) = msg.sender.call{value: amount}("");
         if (!ok) revert SolGitErrors.Unauthorized();
 
         emit Withdrawn(msg.sender, amount);
     }
 }`;

// ─────────────────────────────────────────────────────────────
// CI Checks Detailed Fixture (All 4 Passing)
// ─────────────────────────────────────────────────────────────
const CI_CHECKS: CiCheckDetail[] = [
  {
    id: "check-1",
    name: "Foundry test suite: testWithdrawUnderflowExploit",
    suiteName: "test/unit/VaultWithdraw.t.sol",
    command: "forge test --match-test testWithdrawUnderflowExploit -vvv",
    status: "passed",
    duration: "12ms",
    category: "test",
    logs: [
      "[INFO] Executing isolated Foundry fork test against MST Testnet (Chain ID 91562037)...",
      "[SETUP] Initializing Attacker account 0x67852244E41F39CA15605264536E94BaBf56A4e7 with 0 balance",
      "[INVOKE] Calling withdraw(200 ether) from zero-balance account...",
      "[PASS] testWithdrawUnderflowExploit() (gas: 24192)",
      "  ├─ [CHECK] Caller balance verification: vs.balances[0x6785...A4e7] < 200 ether",
      "  ├─ [EXPECT REVERT] SolGitErrors.Unauthorized()",
      "  ├─ [VERIFIED] Transaction reverted with expected custom error",
      "  └─ [ASSERT] Vault total balance preserved: 1,450.00 tMSTC (0 tMSTC lost)",
      "Suite result: ok. 1 passed; 0 failed; 0 skipped; finished in 12.4ms",
    ],
  },
  {
    id: "check-2",
    name: "SolGit Invariant test: invariant_Solvency",
    suiteName: "test/invariants/SolvencyInvariant.t.sol",
    command: "forge test --match-contract InvariantSolvency --fuzz-runs 50000",
    status: "passed",
    duration: "2.8s",
    category: "invariant",
    logs: [
      "[INFO] Starting invariant fuzzer across 50,000 randomized state transitions...",
      "[INVARIANT 1] totalDeposits == sum(balances[all_users]) [PASS]",
      "[INVARIANT 2] address(diamond).balance >= totalDeposits [PASS]",
      "[INVARIANT 3] singleTxOutflow <= OUTFLOW_CAP (100 tMSTC) [PASS]",
      "[INVARIANT 4] no user balance underflow possible under any call sequence [PASS]",
      "[FUZZ SUMMARY] 50,000 runs, 750,000 total handler calls, 14,210 expected reverts.",
      "Invariant test suite result: ok. 4 invariants held; 0 broken; duration: 2.8s",
    ],
  },
  {
    id: "check-3",
    name: "Slither Static Analysis: Clean AST Audit",
    suiteName: "slither contracts/facets/VaultV2Fixed.sol",
    command: "slither contracts/facets/VaultV2Fixed.sol --filter-paths 'test,lib'",
    status: "passed",
    duration: "0.9s",
    category: "security",
    logs: [
      "$ slither contracts/facets/VaultV2Fixed.sol --solc-remaps '@openzeppelin=lib/openzeppelin-contracts'",
      "Compilation warnings: none.",
      "Analyzing 1 contract(s) across 7 detector(s)...",
      "  ✓ reentrancy-eth (Checks-Effects-Interactions): 0 issues found (Clean CEI ordering)",
      "  ✓ unchecked-lowlevel: 0 issues found",
      "  ✓ arbitrary-send-eth: 0 issues found",
      "  ✓ uninitialized-state: 0 issues found",
      "  ✓ locked-ether: 0 issues found",
      "Slither scan result: 0 High, 0 Medium, 0 Low, 0 Informational issues. Status: CLEAN.",
    ],
  },
  {
    id: "check-4",
    name: "EIP-2535 Diamond Introspection: Facet Cut Verification",
    suiteName: "script/verifyDiamondCut.ts",
    command: "npx ts-node script/verifyDiamondCut.ts --selector 0x2e1a7d4d",
    status: "passed",
    duration: "0.5s",
    category: "diamond",
    logs: [
      "[DIAMOND CUT INTROSPECTION]",
      "Target Diamond: 0xCEe1d6467040c32185dBC60afAc508266b3D19EB",
      "Action: FacetCutAction.Replace (1)",
      "Selector: 0x2e1a7d4d (withdraw(uint256))",
      "Current Facet: 0x91697d3d38C493F76745dcC72FBe248Fc14fBCB7 (VaultV2 - Quarantined)",
      "Replacement Facet: 0xb1C889707d426A7A386870A03bc70d1b0697599 (VaultV2Fixed)",
      "Storage Slot Verification: VaultStorage slot 0x36089... uncorrupted",
      "Introspection check: No selector collisions, no orphaned function pointers.",
      "Result: Safe for Diamond Proxy execution.",
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Historical PRs for the List View
// ─────────────────────────────────────────────────────────────
const HISTORICAL_PRS: HistoricalPR[] = [
  {
    id: 41,
    title: "feat(loupe): add Diamond Loupe introspection facets",
    status: "merged",
    author: "0xF880...416B",
    branchFrom: "feat-diamond-loupe",
    branchTo: "main",
    timeAgo: "2 days ago",
    commentsCount: 2,
    checksSummary: "3/3 passed",
    labels: [
      { text: "diamond-proxy", color: "bg-purple-900/40 text-purple-300 border-purple-700/40" },
      { text: "introspection", color: "bg-blue-900/40 text-blue-300 border-blue-700/40" },
    ],
    additions: 148,
    deletions: 12,
  },
  {
    id: 40,
    title: "fix(storage): optimize gas slot packing for vault balances",
    status: "merged",
    author: "0x5678...contributor",
    branchFrom: "perf-storage-layout",
    branchTo: "main",
    timeAgo: "5 days ago",
    commentsCount: 5,
    checksSummary: "4/4 passed",
    labels: [
      { text: "gas-optimization", color: "bg-emerald-900/40 text-emerald-300 border-emerald-700/40" },
      { text: "storage", color: "bg-zinc-800 text-zinc-300 border-zinc-700" },
    ],
    additions: 45,
    deletions: 38,
  },
  {
    id: 39,
    title: "chore(core): initial EIP-2535 Diamond Proxy architecture setup",
    status: "merged",
    author: "0xF880...416B",
    branchFrom: "eip2535-init",
    branchTo: "main",
    timeAgo: "12 days ago",
    commentsCount: 8,
    checksSummary: "5/5 passed",
    labels: [
      { text: "architecture", color: "bg-cyan-900/40 text-cyan-300 border-cyan-700/40" },
      { text: "release", color: "bg-amber-900/40 text-amber-300 border-amber-700/40" },
    ],
    additions: 680,
    deletions: 0,
  },
];

// ─────────────────────────────────────────────────────────────
// Main PullRequestsTab Component
// ─────────────────────────────────────────────────────────────
export function PullRequestsTab({
  isMerged,
  isHacked,
  onMergeFix,
  onActionToast,
}: PullRequestsTabProps) {
  // Navigation & View States
  const [viewMode, setViewMode] = useState<"detail" | "list">("detail");
  const [activeSubTab, setActiveSubTab] = useState<PrSubTab>("conversation");
  const [diffViewMode, setDiffViewMode] = useState<"unified" | "split">("unified");

  // Merge Action States
  const [isConfirmingMerge, setIsConfirmingMerge] = useState(false);
  const [isMergingLocal, setIsMergingLocal] = useState(false);
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>("merge-commit");
  const [mergeDropdownOpen, setMergeDropdownOpen] = useState(false);
  const [commitTitle, setCommitTitle] = useState(
    "Merge pull request #42 from SolGit/solgit-fix-0x2e1a7d-v2"
  );
  const [commitDescription, setCommitDescription] = useState(
    "Promote VaultV2Fixed facet to Stable on Diamond Proxy (selector 0x2e1a7d4d)"
  );

  // Copy Feedback States
  const [copiedPatch, setCopiedPatch] = useState(false);
  const [copiedBranch, setCopiedBranch] = useState(false);
  const [copiedCommit, setCopiedCommit] = useState(false);

  // CI Checks Expandable States
  const [expandedChecks, setExpandedChecks] = useState<Record<string, boolean>>({
    "check-1": false,
    "check-2": false,
  });
  const [allChecksExpanded, setAllChecksExpanded] = useState(false);

  // Diff File Collapse State
  const [fileDiffCollapsed, setFileDiffCollapsed] = useState(false);

  // Search & Filter State for PR List
  const [listSearch, setListSearch] = useState("is:pr is:open");
  const [listStatusFilter, setListStatusFilter] = useState<"all" | "open" | "merged">("all");

  // Format Helper
  const triggerToast = useCallback(
    (msg: string) => {
      if (onActionToast) {
        onActionToast(msg);
      }
    },
    [onActionToast]
  );

  // Copy branch handler
  const handleCopyBranch = () => {
    navigator.clipboard.writeText("solgit-fix-0x2e1a7d-v2");
    setCopiedBranch(true);
    triggerToast("Copied branch name to clipboard");
    setTimeout(() => setCopiedBranch(false), 2000);
  };

  // Copy patch handler
  const handleCopyPatch = () => {
    navigator.clipboard.writeText(RAW_PATCH_DIFF);
    setCopiedPatch(true);
    triggerToast("Copied diff patch to clipboard");
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  // Copy commit hash handler
  const handleCopyCommit = () => {
    navigator.clipboard.writeText("4e7f8a9");
    setCopiedCommit(true);
    triggerToast("Copied commit hash 4e7f8a9");
    setTimeout(() => setCopiedCommit(false), 2000);
  };

  // Toggle single CI check log
  const toggleCheck = (id: string) => {
    setExpandedChecks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Toggle all checks logs
  const toggleAllChecks = () => {
    const nextState = !allChecksExpanded;
    setAllChecksExpanded(nextState);
    const updated: Record<string, boolean> = {};
    CI_CHECKS.forEach((c) => {
      updated[c.id] = nextState;
    });
    setExpandedChecks(updated);
  };

  // Perform Merge Action
  const handleExecuteMerge = () => {
    setIsMergingLocal(true);
    triggerToast("Broadcasting Diamond Cut transaction to MST Blockchain...");

    setTimeout(() => {
      setIsMergingLocal(false);
      setIsConfirmingMerge(false);
      onMergeFix();
      triggerToast("Pull request #42 merged! Promoted VaultV2Fixed to Diamond Proxy.");
    }, 1300);
  };

  // Compute split diff rows for side-by-side view
  const splitDiffRows = useMemo<SplitDiffRow[]>(() => {
    const rows: SplitDiffRow[] = [];
    let i = 0;

    while (i < PR_DIFF_LINES.length) {
      const line = PR_DIFF_LINES[i];

      if (line.type === "header") {
        i++;
        continue;
      }

      if (line.type === "context") {
        rows.push({
          left: { lineNum: line.oldLineNumber, content: line.content, type: "context" },
          right: { lineNum: line.newLineNumber, content: line.content, type: "context" },
        });
        i++;
      } else if (line.type === "delete") {
        // Collect batch of consecutive deletes
        const deleteBatch: DiffLine[] = [];
        while (i < PR_DIFF_LINES.length && PR_DIFF_LINES[i].type === "delete") {
          deleteBatch.push(PR_DIFF_LINES[i]);
          i++;
        }
        // Collect following consecutive adds if any
        const addBatch: DiffLine[] = [];
        while (i < PR_DIFF_LINES.length && PR_DIFF_LINES[i].type === "add") {
          addBatch.push(PR_DIFF_LINES[i]);
          i++;
        }

        const maxLen = Math.max(deleteBatch.length, addBatch.length);
        for (let j = 0; j < maxLen; j++) {
          const del = deleteBatch[j];
          const add = addBatch[j];
          rows.push({
            left: del
              ? { lineNum: del.oldLineNumber, content: del.content, type: "delete" }
              : { content: "", type: "empty" },
            right: add
              ? { lineNum: add.newLineNumber, content: add.content, type: "add" }
              : { content: "", type: "empty" },
          });
        }
      } else if (line.type === "add") {
        // Standalone add without prior delete
        rows.push({
          left: { content: "", type: "empty" },
          right: { lineNum: line.newLineNumber, content: line.content, type: "add" },
        });
        i++;
      }
    }

    return rows;
  }, []);

  // Filtered PR list
  const filteredPrList = useMemo(() => {
    let prs = [
      {
        id: 42,
        title: "[SolGit AI Fix] Secure withdraw underflow patch",
        status: isMerged ? "merged" : "open",
        author: "0xAI...Watcher",
        isBot: true,
        branchFrom: "solgit-fix-0x2e1a7d-v2",
        branchTo: "main",
        timeAgo: "10 minutes ago",
        commentsCount: 3,
        checksSummary: "4/4 passed",
        labels: [
          { text: "solgit-ai-fix", color: "bg-emerald-950/60 text-emerald-400 border-emerald-700/50" },
          { text: "security-patch", color: "bg-rose-950/60 text-rose-300 border-rose-700/50" },
          { text: "diamond-cut", color: "bg-purple-950/60 text-purple-300 border-purple-700/50" },
        ],
        additions: 12,
        deletions: 8,
      },
      ...HISTORICAL_PRS,
    ];

    if (listStatusFilter === "open") {
      prs = prs.filter((p) => p.status === "open");
    } else if (listStatusFilter === "merged") {
      prs = prs.filter((p) => p.status === "merged");
    }

    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      // If it contains "is:open", filter open
      if (q.includes("is:open")) {
        prs = prs.filter((p) => p.status === "open");
      } else if (q.includes("is:merged") || q.includes("is:closed")) {
        prs = prs.filter((p) => p.status === "merged");
      }
    }

    return prs;
  }, [isMerged, listStatusFilter, listSearch]);

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────
          Active Incident Banner (if isHacked && !isMerged)
          ───────────────────────────────────────────────────────── */}
      {isHacked && !isMerged && (
        <div className="rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-zinc-900/60 to-rose-950/20 p-4 shadow-lg backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-rose-200">
                  Active Security Incident: Underflow Exploit Detected
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700/50 uppercase">
                  Selector 0x2e1a7d4d
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1">
                SolGit Guardian automatically rolled back diamond proxy to safe baseline{" "}
                <code className="text-rose-300 bg-rose-950/60 px-1 py-0.5 rounded font-mono">
                  VaultV1
                </code>
                . AI Watcher generated PR #42 to safely patch and promote{" "}
                <code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded font-mono">
                  VaultV2Fixed
                </code>
                .
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setViewMode("detail");
              setActiveSubTab("conversation");
            }}
            className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-black transition shadow-md"
          >
            Review Patch & Merge
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          Navigation Breadcrumb & View Toggle
          ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 text-sm">
          {viewMode === "detail" ? (
            <>
              <button
                onClick={() => setViewMode("list")}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition group cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Pull requests</span>
              </button>
              <span className="text-zinc-600">/</span>
              <span className="font-semibold text-white">#42</span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-white text-base">Pull Requests</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "detail" ? (
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
            >
              View all pull requests ({filteredPrList.length})
            </button>
          ) : (
            <button
              onClick={() => setViewMode("detail")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white transition shadow-sm cursor-pointer"
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              Open PR #42 (AI Fix)
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          VIEW 1: PR LIST VIEW
          ───────────────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 border border-white/[0.08] p-3 rounded-xl backdrop-blur-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search all pull requests..."
                className="w-full pl-9 pr-4 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setListStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  listStatusFilter === "all"
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setListStatusFilter("open")}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  listStatusFilter === "open"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {isMerged ? "0 Open" : "1 Open"}
              </button>
              <button
                onClick={() => setListStatusFilter("merged")}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  listStatusFilter === "merged"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {isMerged ? "4 Merged" : "3 Merged"}
              </button>
            </div>
          </div>

          {/* PR Items Table */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-950/70 overflow-hidden backdrop-blur-md divide-y divide-white/[0.06]">
            {filteredPrList.map((pr) => (
              <div
                key={pr.id}
                onClick={() => {
                  if (pr.id === 42) {
                    setViewMode("detail");
                  } else {
                    triggerToast(`Viewing historical archive for PR #${pr.id}`);
                  }
                }}
                className={`p-4 flex items-start justify-between gap-4 hover:bg-white/[0.03] transition cursor-pointer group ${
                  pr.id === 42 ? "border-l-2 border-emerald-500" : ""
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-1">
                    {pr.status === "open" ? (
                      <span className="text-[#238636] flex">
                        <GitPullRequest className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="text-[#8957e5] flex">
                        <GitMerge className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition truncate">
                        {pr.title}
                      </span>
                      {pr.labels.map((lbl, idx) => (
                        <span
                          key={idx}
                          className={`text-[11px] px-2 py-0.5 rounded-full border font-mono ${lbl.color}`}
                        >
                          {lbl.text}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 flex-wrap font-mono">
                      <span>#{pr.id}</span>
                      <span>by</span>
                      <span className="text-zinc-300 font-semibold flex items-center gap-1">
                        {pr.isBot && <Sparkles className="w-3 h-3 text-emerald-400" />}
                        {pr.author}
                      </span>
                      {pr.isBot && (
                        <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-1 rounded font-bold">
                          BOT
                        </span>
                      )}
                      <span>·</span>
                      <span className="text-zinc-500">{pr.timeAgo}</span>
                      <span>·</span>
                      <span className="text-zinc-300 bg-white/[0.04] px-1.5 py-0.5 rounded">
                        {pr.branchFrom} → {pr.branchTo}
                      </span>
                      <span>·</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {pr.checksSummary}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs text-zinc-400">
                  <div className="hidden sm:flex items-center gap-1 font-mono text-[11px]">
                    <span className="text-emerald-400 font-semibold">+{pr.additions}</span>
                    <span className="text-rose-400 font-semibold">-{pr.deletions}</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-white">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{pr.commentsCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          VIEW 2: PR #42 FULL DETAIL VIEW
          ───────────────────────────────────────────────────────── */}
      {viewMode === "detail" && (
        <div className="space-y-6">
          {/* PR Header Box */}
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    [SolGit AI Fix] Secure withdraw underflow patch
                  </h1>
                  <span className="text-xl sm:text-2xl font-light text-zinc-500">#42</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                  <span className="text-zinc-300 font-medium">Target Selector:</span>
                  <code className="text-cyan-300 bg-cyan-950/50 px-1.5 py-0.5 rounded font-mono border border-cyan-800/40">
                    0x2e1a7d4d
                  </code>
                  <span className="text-zinc-400 font-mono">withdraw(uint256)</span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-zinc-300">Facet:</span>
                  <code className="text-zinc-300 font-mono">VaultV2Fixed.sol</code>
                </div>
              </div>

              {/* Top Action Pills */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyBranch}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
                  title="Copy branch name"
                >
                  {copiedBranch ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy branch</span>
                    </>
                  )}
                </button>
                <a
                  href={`${CONTRACTS.explorer}/address/${CONTRACTS.diamond}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Diamond Explorer</span>
                </a>
              </div>
            </div>

            {/* Status & Routing Pill Bar */}
            <div className="flex items-center gap-3 flex-wrap text-xs pt-1">
              {/* GitHub Open or Merged Pill Badge */}
              {isMerged ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#8957e5] text-white shadow-sm">
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Merged</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#238636] text-white shadow-sm">
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>Open</span>
                </div>
              )}

              {/* Branch Routing */}
              <div className="text-zinc-300 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  0xAI...Watcher
                </span>
                <span className="text-zinc-400">wants to merge 1 commit into</span>
                <span className="font-mono bg-[#161b22] border border-white/10 px-2 py-0.5 rounded text-cyan-300 text-[11px]">
                  main
                </span>
                <span className="text-zinc-400">from</span>
                <span className="font-mono bg-[#161b22] border border-white/10 px-2 py-0.5 rounded text-cyan-300 text-[11px]">
                  solgit-fix-0x2e1a7d-v2
                </span>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              PR Internal Subtabs Bar (GitHub Style)
              ───────────────────────────────────────────────────────── */}
          <div className="border-b border-white/[0.08] flex items-center gap-1 overflow-x-auto scrollbar-none -mb-2">
            <button
              onClick={() => setActiveSubTab("conversation")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeSubTab === "conversation"
                  ? "border-emerald-400 text-white font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Conversation</span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-white/10 text-zinc-300">
                3
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab("commits")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeSubTab === "commits"
                  ? "border-emerald-400 text-white font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <GitCommit className="w-4 h-4 text-cyan-400" />
              <span>Commits</span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-white/10 text-zinc-300">
                1
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab("checks")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeSubTab === "checks"
                  ? "border-emerald-400 text-white font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Checks</span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                4 passed
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab("files")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeSubTab === "files"
                  ? "border-emerald-400 text-white font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>Files changed</span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-white/10 text-zinc-300 font-mono">
                1 <span className="text-emerald-400">+12</span>{" "}
                <span className="text-rose-400">-8</span>
              </span>
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────
              SUBTAB 1: CONVERSATION TAB (TIMELINE + CHECKS + MERGE)
              ───────────────────────────────────────────────────────── */}
          {activeSubTab === "conversation" && (
            <div className="space-y-6 pt-2">
              {/* Timeline Container */}
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-[2px] before:bg-white/[0.08]">
                {/* ─────────────────────────────────────────────
                    TIMELINE ITEM 1: AI Fixer Narrative Card
                    ───────────────────────────────────────────── */}
                <div className="relative">
                  {/* Timeline icon */}
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                  </div>

                  {/* Card Container */}
                  <div className="rounded-xl border border-white/[0.08] bg-[#161b22]/90 backdrop-blur-md overflow-hidden shadow-xl">
                    {/* Comment Header */}
                    <div className="px-4 py-2.5 bg-[#21262d]/60 border-b border-white/[0.08] flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                          <Bot className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-semibold text-white">0xAI...Watcher</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                          BOT
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                          SolGit Guardian
                        </span>
                        <span className="text-zinc-400">commented 10 minutes ago</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-white/[0.05] border border-white/10 text-zinc-300">
                          Author
                        </span>
                      </div>
                    </div>

                    {/* Comment Body */}
                    <div className="p-5 space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      {/* Incident Response Alert Callout */}
                      <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs space-y-2">
                        <div className="flex items-center gap-2 text-rose-300 font-bold">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <span>Incident Response Log — Selector 0x2e1a7d4d</span>
                        </div>
                        <p className="text-zinc-300">
                          An invariant violation was detected on MST Testnet block{" "}
                          <code className="text-rose-300 bg-rose-950 px-1 py-0.5 rounded font-mono">
                            #120486
                          </code>
                          . An attacker initiated an unauthorized withdrawal exceeding the configured{" "}
                          <code className="text-rose-300 bg-rose-950 px-1 py-0.5 rounded font-mono">
                            OUTFLOW_CAP (100 tMSTC)
                          </code>{" "}
                          using an unverified zero-balance account. SolGit Guardian immediately executed an
                          on-chain emergency rollback restoring safe baseline{" "}
                          <code className="text-emerald-300 bg-emerald-950 px-1 py-0.5 rounded font-mono">
                            VaultV1
                          </code>
                          .
                        </p>
                      </div>

                      {/* Root Cause Analysis */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          Root Cause Vulnerability Analysis
                        </h3>
                        <p className="text-zinc-300 text-xs leading-relaxed">
                          The gas optimization commit in{" "}
                          <code className="text-amber-300 bg-zinc-900 px-1 py-0.5 rounded font-mono">
                            VaultV2.sol
                          </code>{" "}
                          removed the required caller balance verification step and placed the balance subtraction
                          within an <code className="text-rose-400 font-mono">unchecked &#123; &#125;</code> block:
                        </p>
                        <div className="p-3 rounded-lg bg-black/60 border border-white/10 font-mono text-[11px] text-zinc-400">
                          <span className="text-zinc-500">// ❌ Vulnerable code in VaultV2.sol:</span>
                          <br />
                          <span className="text-rose-400">unchecked &#123;</span>
                          <br />
                          <span className="text-rose-300 pl-4">
                            vs.balances[msg.sender] -= amount; // No check if caller has sufficient balance!
                          </span>
                          <br />
                          <span className="text-rose-400">&#125;</span>
                        </div>
                        <p className="text-zinc-400 text-xs">
                          Because the subtraction was unchecked, any account with a zero balance could request a
                          withdrawal, triggering an integer underflow to{" "}
                          <code className="text-amber-300 font-mono">2^256 - 1</code>, bypassing internal accounting
                          and draining vault liquidity.
                        </p>
                      </div>

                      {/* Automated Patch Solution */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          Proposed AI Patch Architecture (VaultV2Fixed.sol)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.06] space-y-1">
                            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              1. Explicit Balance Verification
                            </div>
                            <p className="text-zinc-400 text-[11px]">
                              Enforces <code className="text-zinc-300 font-mono">vs.balances[msg.sender] &gt;= amount</code> before state modifications.
                            </p>
                          </div>

                          <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.06] space-y-1">
                            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              2. Standard Checked Math
                            </div>
                            <p className="text-zinc-400 text-[11px]">
                              Removed unsafe unchecked subtraction. EVM 0.8+ reverts automatically on underflow.
                            </p>
                          </div>

                          <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.06] space-y-1">
                            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              3. Strict CEI Pattern Adherence
                            </div>
                            <p className="text-zinc-400 text-[11px]">
                              Internal accounting state updated *before* invoking external low-level transfer.
                            </p>
                          </div>

                          <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.06] space-y-1">
                            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              4. Diamond Storage Cleanliness
                            </div>
                            <p className="text-zinc-400 text-[11px]">
                              Slot <code className="text-zinc-300 font-mono">0x36089...</code> integrity verified. Zero selector overlap.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Reactions */}
                      <div className="pt-2 flex items-center gap-2 border-t border-white/[0.06]">
                        <button
                          onClick={() => triggerToast("Added reaction 👍")}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-zinc-300 hover:bg-white/[0.08] transition cursor-pointer"
                        >
                          <ThumbsUp className="w-3 h-3 text-emerald-400" />
                          <span>3</span>
                        </button>
                        <button
                          onClick={() => triggerToast("Added reaction 🚀")}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-zinc-300 hover:bg-white/[0.08] transition cursor-pointer"
                        >
                          <span>🚀</span>
                          <span>2</span>
                        </button>
                        <button
                          onClick={() => triggerToast("Added reaction 🛡️")}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-zinc-300 hover:bg-white/[0.08] transition cursor-pointer"
                        >
                          <span>🛡️</span>
                          <span>1</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────
                    TIMELINE ITEM 2: Git Commit Node
                    ───────────────────────────────────────────── */}
                <div className="relative flex items-center justify-between gap-3 text-xs text-zinc-400 pl-1">
                  <div className="absolute -left-6 sm:-left-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#161b22] border-2 border-cyan-500 flex items-center justify-center">
                    <GitCommit className="w-2.5 h-2.5 text-cyan-400" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-semibold text-white">0xAI...Watcher</span>
                    <span>added commit</span>
                    <button
                      onClick={handleCopyCommit}
                      className="font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded hover:bg-cyan-900/60 transition cursor-pointer flex items-center gap-1"
                      title="Click to copy SHA"
                    >
                      {copiedCommit ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                      <span>4e7f8a9</span>
                    </button>
                    <span className="text-zinc-300 truncate">
                      fix(withdraw): AI-healed CEI balance verification patch
                    </span>
                  </div>
                  <span className="text-zinc-500 shrink-0">10m ago</span>
                </div>

                {/* ─────────────────────────────────────────────
                    TIMELINE ITEM 3: Lead Security Auditor Review Approval
                    ───────────────────────────────────────────── */}
                <div className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#161b22]/90 backdrop-blur-md overflow-hidden shadow-xl">
                    <div className="px-4 py-2.5 bg-[#21262d]/60 border-b border-white/[0.08] flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-mono text-[10px] font-bold">
                          0xF
                        </span>
                        <span className="font-semibold text-white">0xF880...416B</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                          Lead Security Auditor
                        </span>
                        <span className="text-zinc-400">reviewed 8 minutes ago</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approved</span>
                      </div>
                    </div>

                    <div className="p-4 text-xs text-zinc-300 space-y-2">
                      <p>
                        Audit verified via Foundry invariant harness & Slither AST inspector. Facet bytecode is clean,
                        Checks-Effects-Interactions is strictly honored, and storage slot{" "}
                        <code className="text-purple-300 bg-black/40 px-1 py-0.5 rounded font-mono">
                          0x36089...
                        </code>{" "}
                        maintains complete layout integrity.
                      </p>
                      <p className="text-zinc-400">
                        Safe for owner execution of the EIP-2535 Diamond Cut promoting{" "}
                        <code className="text-emerald-300 font-mono">VaultV2Fixed</code> to Stable on production Diamond.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────
                    TIMELINE ITEM 4: Automated Verification / CI Checks Box
                    ───────────────────────────────────────────── */}
                <div className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#161b22]/90 backdrop-blur-md overflow-hidden shadow-xl">
                    <div className="px-4 py-3 bg-[#21262d]/60 border-b border-white/[0.08] flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                            All checks have passed
                            <span className="text-[11px] font-normal text-emerald-400 bg-emerald-950/60 px-2 py-0.2 rounded border border-emerald-800/40">
                              4/4 successful
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400">
                            Automated CI completed in 4.6s · 0 failed, 0 warnings
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={toggleAllChecks}
                        className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>{allChecksExpanded ? "Collapse logs" : "Expand all logs"}</span>
                        {allChecksExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* CI Checks List */}
                    <div className="divide-y divide-white/[0.06]">
                      {CI_CHECKS.map((check) => {
                        const isExp = expandedChecks[check.id] || allChecksExpanded;
                        return (
                          <div key={check.id} className="text-xs">
                            <div
                              onClick={() => toggleCheck(check.id)}
                              className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <div className="truncate">
                                  <span className="font-semibold text-white">{check.name}</span>
                                  <span className="text-zinc-500 font-mono ml-2 text-[11px]">
                                    ({check.duration})
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-bold uppercase">
                                  PASSED
                                </span>
                                {isExp ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                                )}
                              </div>
                            </div>

                            {/* Terminal Log Output if Expanded */}
                            {isExp && (
                              <div className="px-4 pb-4 pt-1">
                                <div className="rounded-lg bg-black/80 border border-white/10 p-3 font-mono text-[11px] text-zinc-300 space-y-1 overflow-x-auto shadow-inner">
                                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-zinc-500">
                                    <div className="flex items-center gap-1.5">
                                      <Terminal className="w-3 h-3 text-cyan-400" />
                                      <span className="text-zinc-400">{check.command}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500">{check.suiteName}</span>
                                  </div>
                                  {check.logs.map((logLine, lIdx) => (
                                    <div
                                      key={lIdx}
                                      className={`leading-relaxed ${
                                        logLine.startsWith("[PASS]") || logLine.includes("CLEAN")
                                          ? "text-emerald-400 font-semibold"
                                          : logLine.startsWith("[EXPECT REVERT]")
                                          ? "text-amber-400"
                                          : logLine.startsWith("[ASSERT]")
                                          ? "text-cyan-300"
                                          : "text-zinc-400"
                                      }`}
                                    >
                                      {logLine}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────
                    TIMELINE ITEM 5: Code Diff Inspector
                    ───────────────────────────────────────────── */}
                <div className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-zinc-900 border-2 border-zinc-500 flex items-center justify-center">
                    <FileCode className="w-3.5 h-3.5 text-zinc-300" />
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#161b22]/90 backdrop-blur-md overflow-hidden shadow-xl">
                    {/* Diff Header */}
                    <div className="px-4 py-3 bg-[#21262d]/60 border-b border-white/[0.08] flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setFileDiffCollapsed(!fileDiffCollapsed)}
                          className="text-zinc-400 hover:text-white transition"
                        >
                          {fileDiffCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <FileCode className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono text-xs font-semibold text-white">
                          contracts/facets/VaultV2Fixed.sol
                        </span>
                        <div className="flex items-center gap-1 font-mono text-[11px] ml-2">
                          <span className="text-emerald-400 font-bold">+12</span>
                          <span className="text-rose-400 font-bold">-8</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Split vs Unified Toggle */}
                        <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 text-xs">
                          <button
                            onClick={() => setDiffViewMode("unified")}
                            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                              diffViewMode === "unified"
                                ? "bg-white/10 text-white font-medium"
                                : "text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            Unified
                          </button>
                          <button
                            onClick={() => setDiffViewMode("split")}
                            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                              diffViewMode === "split"
                                ? "bg-white/10 text-white font-medium"
                                : "text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            Split
                          </button>
                        </div>

                        {/* Copy Patch Button */}
                        <button
                          onClick={handleCopyPatch}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-white/10 bg-white/[0.04] text-xs text-zinc-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
                          title="Copy raw patch"
                        >
                          {copiedPatch ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy patch</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Diff Viewer Body */}
                    {!fileDiffCollapsed && (
                      <div className="overflow-x-auto text-xs font-mono select-text bg-[#0d1117]">
                        {diffViewMode === "unified" ? (
                          /* UNIFIED DIFF VIEW */
                          <div className="divide-y divide-white/[0.02]">
                            {PR_DIFF_LINES.map((line, idx) => {
                              const isAdd = line.type === "add";
                              const isDel = line.type === "delete";
                              const isHdr = line.type === "header";

                              return (
                                <div
                                  key={idx}
                                  className={`flex items-start leading-relaxed ${
                                    isAdd
                                      ? "bg-emerald-950/20 text-emerald-200 hover:bg-emerald-950/30"
                                      : isDel
                                      ? "bg-rose-950/20 text-rose-200 hover:bg-rose-950/30"
                                      : isHdr
                                      ? "bg-blue-950/30 text-blue-300 font-semibold"
                                      : "text-zinc-300 hover:bg-white/[0.02]"
                                  }`}
                                >
                                  {/* Old line number */}
                                  <div className="w-12 py-0.5 text-right pr-3 select-none text-[11px] text-zinc-600 border-r border-white/[0.04]">
                                    {line.oldLineNumber ?? ""}
                                  </div>
                                  {/* New line number */}
                                  <div className="w-12 py-0.5 text-right pr-3 select-none text-[11px] text-zinc-600 border-r border-white/[0.04]">
                                    {line.newLineNumber ?? ""}
                                  </div>
                                  {/* Prefix symbol */}
                                  <div className="w-6 py-0.5 text-center select-none font-bold">
                                    {isAdd ? (
                                      <span className="text-emerald-400">+</span>
                                    ) : isDel ? (
                                      <span className="text-rose-400">-</span>
                                    ) : (
                                      " "
                                    )}
                                  </div>
                                  {/* Content */}
                                  <div className="flex-1 py-0.5 pr-4 whitespace-pre font-mono overflow-x-visible">
                                    {line.content}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* SPLIT (SIDE-BY-SIDE) DIFF VIEW */
                          <div className="min-w-[700px] divide-y divide-white/[0.04]">
                            {/* Subheaders for Left/Right */}
                            <div className="grid grid-cols-2 bg-[#161b22] text-zinc-400 border-b border-white/10 text-[11px] py-1.5 px-3">
                              <div className="font-semibold text-rose-300">
                                VaultV2.sol (Buggy Facet)
                              </div>
                              <div className="font-semibold text-emerald-300 pl-4 border-l border-white/10">
                                VaultV2Fixed.sol (AI Patched Facet)
                              </div>
                            </div>

                            {splitDiffRows.map((row, rIdx) => (
                              <div key={rIdx} className="grid grid-cols-2 divide-x divide-white/10">
                                {/* Left Side (Old) */}
                                <div
                                  className={`flex items-start py-0.5 ${
                                    row.left?.type === "delete"
                                      ? "bg-rose-950/25 text-rose-200"
                                      : row.left?.type === "empty"
                                      ? "bg-zinc-950/40 text-transparent"
                                      : "text-zinc-300"
                                  }`}
                                >
                                  <div className="w-10 pr-2 text-right select-none text-[10px] text-zinc-600">
                                    {row.left?.lineNum ?? ""}
                                  </div>
                                  <div className="w-4 text-center select-none font-bold text-rose-400">
                                    {row.left?.type === "delete" ? "-" : " "}
                                  </div>
                                  <div className="flex-1 pr-2 whitespace-pre overflow-hidden">
                                    {row.left?.content ?? ""}
                                  </div>
                                </div>

                                {/* Right Side (New) */}
                                <div
                                  className={`flex items-start py-0.5 ${
                                    row.right?.type === "add"
                                      ? "bg-emerald-950/25 text-emerald-200"
                                      : row.right?.type === "empty"
                                      ? "bg-zinc-950/40 text-transparent"
                                      : "text-zinc-300"
                                  }`}
                                >
                                  <div className="w-10 pr-2 text-right select-none text-[10px] text-zinc-600">
                                    {row.right?.lineNum ?? ""}
                                  </div>
                                  <div className="w-4 text-center select-none font-bold text-emerald-400">
                                    {row.right?.type === "add" ? "+" : " "}
                                  </div>
                                  <div className="flex-1 pr-2 whitespace-pre overflow-hidden">
                                    {row.right?.content ?? ""}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ─────────────────────────────────────────────
                    TIMELINE ITEM 6: GitHub Merge Box
                    ───────────────────────────────────────────── */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isMerged
                        ? "bg-[#8957e5]/20 border-[#8957e5] text-[#8957e5]"
                        : "bg-[#238636]/20 border-[#238636] text-[#238636]"
                    }`}
                  >
                    {isMerged ? (
                      <GitMerge className="w-3.5 h-3.5" />
                    ) : (
                      <GitPullRequest className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Merge Box Container */}
                  {!isMerged ? (
                    <div className="rounded-xl border border-white/[0.08] bg-[#161b22]/90 backdrop-blur-md overflow-hidden shadow-xl">
                      {/* Merge Pre-checks Status */}
                      <div className="p-4 sm:p-5 flex items-start justify-between gap-4 border-b border-white/[0.08]">
                        <div className="flex items-start gap-3">
                          <span className="p-2 rounded-full bg-[#238636]/20 text-[#238636] shrink-0 mt-0.5">
                            <CheckCircle2 className="w-5 h-5" />
                          </span>
                          <div>
                            <div className="text-sm font-bold text-white">
                              This branch has no conflicts with the base branch
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Merging can be performed automatically. 1 approving review from Lead Security Auditor.
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                          Target: Diamond Proxy
                        </span>
                      </div>

                      {/* Merge Action Form / Controls */}
                      <div className="p-4 sm:p-5 bg-[#0d1117]/60 space-y-4">
                        {!isConfirmingMerge ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Main Green Merge Button */}
                            <div className="inline-flex rounded-md shadow-md">
                              <button
                                onClick={() => setIsConfirmingMerge(true)}
                                className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white font-semibold text-xs sm:text-sm rounded-l-md transition cursor-pointer flex items-center gap-2 shadow-sm"
                              >
                                <GitMerge className="w-4 h-4" />
                                <span>Merge pull request</span>
                              </button>
                              <div className="relative">
                                <button
                                  onClick={() => setMergeDropdownOpen(!mergeDropdownOpen)}
                                  className="px-2.5 py-2 bg-[#238636] hover:bg-[#2ea043] text-white border-l border-white/20 rounded-r-md transition cursor-pointer flex items-center justify-center"
                                  title="Merge strategies"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>

                                {/* Dropdown Menu */}
                                {mergeDropdownOpen && (
                                  <div className="absolute left-0 mt-1 w-64 rounded-lg bg-[#161b22] border border-white/10 shadow-2xl py-1 z-30 text-xs">
                                    <button
                                      onClick={() => {
                                        setMergeStrategy("merge-commit");
                                        setMergeDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 hover:bg-white/[0.05] transition flex items-start gap-2 ${
                                        mergeStrategy === "merge-commit" ? "text-emerald-400" : "text-zinc-200"
                                      }`}
                                    >
                                      <Check
                                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                                          mergeStrategy === "merge-commit" ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      <div>
                                        <div className="font-semibold">Create a merge commit</div>
                                        <div className="text-[11px] text-zinc-400">
                                          Promote V3 to Diamond Proxy via FacetCut.
                                        </div>
                                      </div>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setMergeStrategy("squash");
                                        setMergeDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 hover:bg-white/[0.05] transition flex items-start gap-2 ${
                                        mergeStrategy === "squash" ? "text-emerald-400" : "text-zinc-200"
                                      }`}
                                    >
                                      <Check
                                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                                          mergeStrategy === "squash" ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      <div>
                                        <div className="font-semibold">Squash and merge</div>
                                        <div className="text-[11px] text-zinc-400">
                                          Combine hotfix commits into one before cut.
                                        </div>
                                      </div>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <span className="text-xs text-zinc-400">
                              You can also merge via SolGit CLI:{" "}
                              <code className="text-cyan-300 font-mono bg-black/40 px-1 py-0.5 rounded border border-white/5">
                                agy pr merge 42
                              </code>
                            </span>
                          </div>
                        ) : (
                          /* Confirm Merge Dialog Form */
                          <div className="space-y-3 rounded-lg border border-white/10 bg-[#161b22] p-4 shadow-inner">
                            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <GitMerge className="w-4 h-4 text-emerald-400" />
                                Confirm Diamond Cut & Merge
                              </span>
                              <button
                                onClick={() => setIsConfirmingMerge(false)}
                                className="text-xs text-zinc-400 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[11px] text-zinc-400 font-medium">Commit Title</label>
                              <input
                                type="text"
                                value={commitTitle}
                                onChange={(e) => setCommitTitle(e.target.value)}
                                className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-md text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[11px] text-zinc-400 font-medium">
                                Extended Description
                              </label>
                              <textarea
                                rows={2}
                                value={commitDescription}
                                onChange={(e) => setCommitDescription(e.target.value)}
                                className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-md text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                              />
                            </div>

                            <div className="pt-2 flex items-center gap-2">
                              <button
                                onClick={handleExecuteMerge}
                                disabled={isMergingLocal}
                                className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-md transition cursor-pointer flex items-center gap-2 shadow-sm"
                              >
                                {isMergingLocal ? (
                                  <>
                                    <RotateCcw className="w-4 h-4 animate-spin" />
                                    <span>Executing Diamond Cut on MST...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4" />
                                    <span>Confirm merge</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => setIsConfirmingMerge(false)}
                                disabled={isMergingLocal}
                                className="px-3 py-2 text-xs text-zinc-400 hover:text-white transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* PURPLE MERGED CARD */
                    <div className="rounded-xl border border-[#8957e5]/40 bg-gradient-to-r from-[#8957e5]/10 via-[#161b22] to-[#8957e5]/5 p-5 shadow-xl backdrop-blur-md space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="p-2 rounded-full bg-[#8957e5]/20 text-[#8957e5] shrink-0 mt-0.5">
                          <GitMerge className="w-5 h-5" />
                        </span>
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            Pull request successfully merged and closed
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8957e5]/30 text-purple-300 border border-[#8957e5]/50 uppercase font-semibold">
                              Diamond Cut Executed
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300">
                            Commit <code className="text-purple-300 font-mono">4e7f8a9</code> merged into{" "}
                            <code className="text-cyan-300 font-mono">main</code>. Facet{" "}
                            <code className="text-emerald-300 font-mono">VaultV2Fixed</code> has been promoted to{" "}
                            <span className="text-emerald-400 font-semibold">Stable V3</span> on Diamond Proxy.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-black/40 border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                        <div className="space-y-0.5 text-zinc-400 text-[11px]">
                          <div>
                            <span className="text-zinc-500">Diamond Proxy: </span>
                            <span className="text-zinc-300">{CONTRACTS.diamond}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Promoted Implementation: </span>
                            <span className="text-emerald-300">
                              0xb1C889707d426A7A386870A03bc70d1b0697599 (V3)
                            </span>
                          </div>
                        </div>

                        <a
                          href={`${CONTRACTS.explorer}/tx/0x4e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#8957e5]/20 hover:bg-[#8957e5]/30 text-purple-300 border border-[#8957e5]/40 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Diamond Cut on Explorer</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              SUBTAB 2: COMMITS TAB
              ───────────────────────────────────────────────────────── */}
          {activeSubTab === "commits" && (
            <div className="rounded-xl border border-white/[0.08] bg-[#161b22]/90 backdrop-blur-md overflow-hidden shadow-xl">
              <div className="px-4 py-3 bg-[#21262d]/60 border-b border-white/[0.08] flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Commits on solgit-fix-0x2e1a7d-v2</span>
                <span className="text-zinc-400">1 commit</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="p-4 rounded-xl border border-white/[0.06] bg-black/40 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-xs sm:text-sm">
                        fix(withdraw): AI-healed CEI balance verification patch
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                        Verified GPG
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-zinc-300">0xAI...Watcher</span>
                      <span>committed 10 minutes ago</span>
                      <span>·</span>
                      <span className="text-zinc-500">Tree fa0194b</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCommit}
                      className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] text-cyan-300 transition"
                    >
                      {copiedCommit ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>4e7f8a9</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              SUBTAB 3: CHECKS TAB (DEDICATED FULL VIEW)
              ───────────────────────────────────────────────────────── */}
          {activeSubTab === "checks" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-md flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">Continuous Integration Passed</h3>
                    <p className="text-xs text-zinc-300">
                      All 4 security and invariant assertions verified against local EVM state and Diamond storage.
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleAllChecks}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 transition"
                >
                  {allChecksExpanded ? "Collapse All" : "Expand All"}
                </button>
              </div>

              <div className="space-y-3">
                {CI_CHECKS.map((check) => {
                  const isExp = expandedChecks[check.id] || allChecksExpanded;
                  return (
                    <div
                      key={check.id}
                      className="rounded-xl border border-white/[0.08] bg-[#161b22] overflow-hidden shadow-md"
                    >
                      <div
                        onClick={() => toggleCheck(check.id)}
                        className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <div>
                            <div className="font-semibold text-white text-xs sm:text-sm">
                              {check.name}
                            </div>
                            <div className="text-zinc-500 font-mono text-[11px]">{check.suiteName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-mono text-zinc-400">{check.duration}</span>
                          <span className="font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold">
                            SUCCESS
                          </span>
                          {isExp ? (
                            <ChevronUp className="w-4 h-4 text-zinc-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-zinc-500" />
                          )}
                        </div>
                      </div>

                      {isExp && (
                        <div className="px-4 pb-4 border-t border-white/[0.04] pt-3">
                          <div className="p-3 rounded-lg bg-black/80 font-mono text-[11px] text-zinc-300 space-y-1 overflow-x-auto">
                            <div className="text-zinc-500 pb-1 mb-1 border-b border-white/10">
                              $ {check.command}
                            </div>
                            {check.logs.map((line, idx) => (
                              <div
                                key={idx}
                                className={
                                  line.startsWith("[PASS]") || line.includes("CLEAN")
                                    ? "text-emerald-400"
                                    : "text-zinc-400"
                                }
                              >
                                {line}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              SUBTAB 4: FILES CHANGED (DEDICATED FULL DIFF VIEW)
              ───────────────────────────────────────────────────────── */}
          {activeSubTab === "files" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-400">Showing 1 changed file with</span>
                  <span className="text-emerald-400 font-mono font-semibold">+12 additions</span>
                  <span className="text-zinc-600">and</span>
                  <span className="text-rose-400 font-mono font-semibold">-8 deletions</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 text-xs">
                    <button
                      onClick={() => setDiffViewMode("unified")}
                      className={`px-3 py-1 rounded-md transition cursor-pointer ${
                        diffViewMode === "unified"
                          ? "bg-white/10 text-white font-medium"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Unified
                    </button>
                    <button
                      onClick={() => setDiffViewMode("split")}
                      className={`px-3 py-1 rounded-md transition cursor-pointer ${
                        diffViewMode === "split"
                          ? "bg-white/10 text-white font-medium"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Split
                    </button>
                  </div>
                  <button
                    onClick={handleCopyPatch}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
                  >
                    {copiedPatch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPatch ? "Copied" : "Copy patch"}</span>
                  </button>
                </div>
              </div>

              {/* Diff Viewer Card */}
              <div className="rounded-xl border border-white/[0.08] bg-[#0d1117] overflow-hidden shadow-xl text-xs font-mono">
                <div className="px-4 py-2.5 bg-[#161b22] border-b border-white/[0.08] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-white">contracts/facets/VaultV2Fixed.sol</span>
                  </div>
                  <span className="text-[11px] text-zinc-500">Modified facet implementation</span>
                </div>

                {diffViewMode === "unified" ? (
                  <div className="divide-y divide-white/[0.02] overflow-x-auto">
                    {PR_DIFF_LINES.map((line, idx) => {
                      const isAdd = line.type === "add";
                      const isDel = line.type === "delete";
                      const isHdr = line.type === "header";

                      return (
                        <div
                          key={idx}
                          className={`flex items-start leading-relaxed ${
                            isAdd
                              ? "bg-emerald-950/20 text-emerald-200"
                              : isDel
                              ? "bg-rose-950/20 text-rose-200"
                              : isHdr
                              ? "bg-blue-950/30 text-blue-300 font-semibold"
                              : "text-zinc-300 hover:bg-white/[0.02]"
                          }`}
                        >
                          <div className="w-12 py-0.5 text-right pr-3 select-none text-[11px] text-zinc-600 border-r border-white/[0.04]">
                            {line.oldLineNumber ?? ""}
                          </div>
                          <div className="w-12 py-0.5 text-right pr-3 select-none text-[11px] text-zinc-600 border-r border-white/[0.04]">
                            {line.newLineNumber ?? ""}
                          </div>
                          <div className="w-6 py-0.5 text-center select-none font-bold">
                            {isAdd ? <span className="text-emerald-400">+</span> : isDel ? <span className="text-rose-400">-</span> : " "}
                          </div>
                          <div className="flex-1 py-0.5 pr-4 whitespace-pre font-mono">
                            {line.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="min-w-[700px] divide-y divide-white/[0.04] overflow-x-auto">
                    <div className="grid grid-cols-2 bg-[#161b22] text-zinc-400 border-b border-white/10 text-[11px] py-1.5 px-3">
                      <div className="font-semibold text-rose-300">VaultV2.sol (Buggy)</div>
                      <div className="font-semibold text-emerald-300 pl-4 border-l border-white/10">
                        VaultV2Fixed.sol (AI Patched)
                      </div>
                    </div>
                    {splitDiffRows.map((row, rIdx) => (
                      <div key={rIdx} className="grid grid-cols-2 divide-x divide-white/10">
                        <div
                          className={`flex items-start py-0.5 ${
                            row.left?.type === "delete"
                              ? "bg-rose-950/25 text-rose-200"
                              : row.left?.type === "empty"
                              ? "bg-zinc-950/40 text-transparent"
                              : "text-zinc-300"
                          }`}
                        >
                          <div className="w-10 pr-2 text-right select-none text-[10px] text-zinc-600">
                            {row.left?.lineNum ?? ""}
                          </div>
                          <div className="w-4 text-center select-none font-bold text-rose-400">
                            {row.left?.type === "delete" ? "-" : " "}
                          </div>
                          <div className="flex-1 pr-2 whitespace-pre overflow-hidden">
                            {row.left?.content ?? ""}
                          </div>
                        </div>

                        <div
                          className={`flex items-start py-0.5 ${
                            row.right?.type === "add"
                              ? "bg-emerald-950/25 text-emerald-200"
                              : row.right?.type === "empty"
                              ? "bg-zinc-950/40 text-transparent"
                              : "text-zinc-300"
                          }`}
                        >
                          <div className="w-10 pr-2 text-right select-none text-[10px] text-zinc-600">
                            {row.right?.lineNum ?? ""}
                          </div>
                          <div className="w-4 text-center select-none font-bold text-emerald-400">
                            {row.right?.type === "add" ? "+" : " "}
                          </div>
                          <div className="flex-1 pr-2 whitespace-pre overflow-hidden">
                            {row.right?.content ?? ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
