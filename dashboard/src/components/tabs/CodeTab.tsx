"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  GitBranch,
  Tag,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  FileCode,
  FileText,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Cpu,
  Maximize2,
  Minimize2,
  Folder,
  History,
  Sparkles,
  Code,
  Info,
  BookOpen,
  AlertTriangle,
  Package,
  Search,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  REPO_FILES,
  REPO_FILES_MAP,
  CONTRACTS,
  type RepoFile,
} from "../../lib/data";

export interface CodeTabProps {
  selectedFile: string;
  onSelectFile: (fileName: string) => void;
  isHacked?: boolean;
  isMerged?: boolean;
  onCopyToast?: (text: string) => void;
}

// ─────────────────────────────────────────────────────────────
// Lightweight Syntax Highlighter Tokenizer
// ─────────────────────────────────────────────────────────────
interface SyntaxToken {
  text: string;
  type: "comment" | "keyword" | "type" | "string" | "number" | "annotation" | "plain";
}

const SOLIDITY_KEYWORDS = new Set([
  "pragma",
  "solidity",
  "contract",
  "interface",
  "library",
  "is",
  "function",
  "modifier",
  "event",
  "error",
  "struct",
  "enum",
  "mapping",
  "return",
  "returns",
  "if",
  "else",
  "for",
  "while",
  "require",
  "revert",
  "emit",
  "override",
  "virtual",
  "external",
  "public",
  "internal",
  "private",
  "view",
  "pure",
  "payable",
  "memory",
  "storage",
  "calldata",
  "import",
  "unchecked",
  "assembly",
  "delete",
  "new",
  "true",
  "false",
]);

const SOLIDITY_TYPES = new Set([
  "uint256",
  "uint128",
  "uint96",
  "uint64",
  "uint32",
  "uint16",
  "uint8",
  "int256",
  "address",
  "bool",
  "bytes32",
  "bytes4",
  "bytes",
  "string",
]);

function tokenizeSolidityLine(line: string): SyntaxToken[] {
  const trimmed = line.trim();
  if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
    return [{ text: line, type: "comment" }];
  }

  let codePart = line;
  let commentPart = "";
  const commentIdx = line.indexOf("//");
  if (commentIdx !== -1) {
    codePart = line.slice(0, commentIdx);
    commentPart = line.slice(commentIdx);
  }

  const regex = /("[^"]*"|'[^']*'|[a-zA-Z_$][a-zA-Z0-9_$]*|0x[0-9a-fA-F]+|\d+|[^\s\w]+|\s+)/g;
  const tokens: SyntaxToken[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(codePart)) !== null) {
    const text = match[0];
    if (text.startsWith('"') || text.startsWith("'")) {
      tokens.push({ text, type: "string" });
    } else if (SOLIDITY_KEYWORDS.has(text)) {
      tokens.push({ text, type: "keyword" });
    } else if (SOLIDITY_TYPES.has(text)) {
      tokens.push({ text, type: "type" });
    } else if (/^(true|false|0x[0-9a-fA-F]+|\d+)$/.test(text)) {
      tokens.push({ text, type: "number" });
    } else if (/^@[a-zA-Z]+/.test(text)) {
      tokens.push({ text, type: "annotation" });
    } else {
      tokens.push({ text, type: "plain" });
    }
  }

  if (commentPart) {
    tokens.push({ text: commentPart, type: "comment" });
  }

  return tokens;
}

export function CodeTab({
  selectedFile,
  onSelectFile,
  isHacked = false,
  isMerged = false,
  onCopyToast,
}: CodeTabProps) {
  // Branch state
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [branchFilter, setBranchFilter] = useState("");

  // Code popover state
  const [isCodePopoverOpen, setIsCodePopoverOpen] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"diamond" | "foundry" | "rpc">("diamond");

  // macOS Window Code Viewer state
  const [isViewerMinimized, setIsViewerMinimized] = useState(false);
  const [isViewerFullscreen, setIsViewerFullscreen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // File filter
  const [fileSearch, setFileSearch] = useState("");

  // Refs for click outside
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const codePopoverRef = useRef<HTMLDivElement>(null);

  // Resolve currently active file
  const activeFile: RepoFile = useMemo(() => {
    return (
      REPO_FILES_MAP[selectedFile] ||
      REPO_FILES.find((f) => f.name === selectedFile || f.path === selectedFile) ||
      REPO_FILES[0]
    );
  }, [selectedFile]);

  // Handle outside clicks to close popovers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        branchDropdownRef.current &&
        !branchDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBranchDropdownOpen(false);
      }
      if (
        codePopoverRef.current &&
        !codePopoverRef.current.contains(event.target as Node)
      ) {
        setIsCodePopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    if (onCopyToast) {
      onCopyToast(`Copied ${label} to clipboard!`);
    }
    setTimeout(() => {
      setCopiedKey((prev) => (prev === label ? null : prev));
    }, 2000);
  };

  // Branches list
  const branches = [
    {
      name: "main",
      isDefault: true,
      description: "Production stable Diamond contracts with active VersionRegistry",
    },
    {
      name: "solgit-fix-0x2e1a7d-v2",
      isDefault: false,
      description: "AI autonomous repair branch restoring CEI checks (PR #42)",
    },
    {
      name: "v2-optimize-gas",
      isDefault: false,
      description: "Experimental gas-optimization facet with unchecked math",
    },
  ];

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(branchFilter.toLowerCase())
  );

  // Parse lines for code window
  const lines = useMemo(() => {
    return activeFile.content.split("\n");
  }, [activeFile]);

  const tokenizedLines = useMemo(() => {
    return lines.map((line, idx) => {
      const isSolidity = activeFile.language === "solidity";
      const tokens = isSolidity
        ? tokenizeSolidityLine(line)
        : [{ text: line, type: "plain" as const }];

      // Hazard detection for VaultV2
      const isHazard =
        activeFile.name === "VaultV2.sol" &&
        (line.includes("unchecked {") || line.includes("balances[msg.sender] -= amount;"));

      // Fix detection for VaultV2Fixed
      const isFix =
        activeFile.name === "VaultV2Fixed.sol" &&
        (line.includes("require(userBalance >= amount") ||
          line.includes("balances[msg.sender] = userBalance - amount"));

      return {
        lineNum: idx + 1,
        tokens,
        isHazard,
        isFix,
      };
    });
  }, [lines, activeFile]);

  // Filtered files for table
  const displayedFiles = useMemo(() => {
    if (!fileSearch.trim()) return REPO_FILES;
    const query = fileSearch.toLowerCase();
    return REPO_FILES.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.path.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query)
    );
  }, [fileSearch]);

  // Commit summary data based on state
  const commitSummary = useMemo(() => {
    if (isMerged) {
      return {
        author: "0xAI-Watcher-Bot",
        role: "AI Autonomous Sentinel",
        avatarBg: "bg-purple-600/30 text-purple-300 border-purple-500/50",
        message: "fix(withdraw): AI-healed CEI balance verification patch (PR #42)",
        sha: "7b9e4a2",
        time: "10 minutes ago",
        statusBadge: "PR #42 Merged",
        commitsCount: 5,
      };
    }
    if (isHacked) {
      return {
        author: "0xSolGit-Guardian",
        role: "Emergency Rollback Guard",
        avatarBg: "bg-rose-600/30 text-rose-300 border-rose-500/50",
        message: "emergency(rollback): Guardian restored selector 0x2e1a7d4d to VaultV1",
        sha: "3f5c9e2",
        time: "Just now",
        statusBadge: "Guardian Emergency Active",
        commitsCount: 4,
      };
    }
    return {
      author: "0xF880...416B",
      role: "SolGit Core Dev",
      avatarBg: "bg-emerald-600/30 text-emerald-300 border-emerald-500/50",
      message: "feat: deploy EIP-2535 Diamond Proxy with dynamic VersionRegistry",
      sha: "4e7f8a9",
      time: "1 day ago",
      statusBadge: "Genesis Stable",
      commitsCount: 4,
    };
  }, [isMerged, isHacked]);

  return (
    <div className="w-full space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          Top Action Bar: Branch, Tag, Commits & Clone Popover
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Branch Switcher & Tag Count */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Branch Dropdown */}
          <div className="relative" ref={branchDropdownRef}>
            <button
              type="button"
              onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-zinc-200 border border-white/10 font-medium transition cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-semibold text-white">{selectedBranch}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Branch Selector Popover */}
            {isBranchDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 rounded-xl bg-[#161b22] border border-white/10 shadow-2xl p-3 z-30 macos-card">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-zinc-300 font-semibold">
                  <span>Switch branches</span>
                  <span className="text-[10px] text-zinc-500 font-normal">3 branches</span>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                  <input
                    type="text"
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    placeholder="Find a branch..."
                    className="w-full bg-[#0d1117] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {filteredBranches.map((b) => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => {
                        setSelectedBranch(b.name);
                        setIsBranchDropdownOpen(false);
                        if (onCopyToast) onCopyToast(`Switched to branch: ${b.name}`);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex flex-col gap-0.5 transition cursor-pointer ${
                        selectedBranch === b.name
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "text-zinc-300 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium font-mono">{b.name}</span>
                        {b.isDefault && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded">
                            default
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 line-clamp-1">
                        {b.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tag Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#21262d]/60 border border-white/10 text-zinc-300">
            <Tag className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-medium">1 tag</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-emerald-400 font-mono">
              v1.0.0-stable
            </span>
          </div>

          {/* Commit Count Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#21262d]/60 border border-white/10 text-zinc-400">
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-medium text-zinc-300">
              {commitSummary.commitsCount} commits
            </span>
          </div>
        </div>

        {/* Right Side: macOS Green Code Popover Button */}
        <div className="relative" ref={codePopoverRef}>
          <button
            type="button"
            onClick={() => setIsCodePopoverOpen(!isCodePopoverOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-950/40 transition cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Code</span>
            <ChevronDown className="w-3 h-3 text-emerald-200" />
          </button>

          {/* Code Clone / Address Popover */}
          {isCodePopoverOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl bg-[#161b22] border border-white/10 shadow-2xl p-4 z-30 macos-card">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-white">
                    Clone & Diamond Router
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                  Chain: 91562037
                </span>
              </div>

              {/* Subtabs */}
              <div className="flex gap-2 mt-3 p-1 rounded-lg bg-[#0d1117] border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab("diamond")}
                  className={`flex-1 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    activeCodeTab === "diamond"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Diamond Router
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab("foundry")}
                  className={`flex-1 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    activeCodeTab === "foundry"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Foundry CLI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab("rpc")}
                  className={`flex-1 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    activeCodeTab === "rpc"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  MST Network
                </button>
              </div>

              {/* Tab Contents */}
              <div className="mt-3 text-xs space-y-2">
                {activeCodeTab === "diamond" && (
                  <div>
                    <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                      Permanent EIP-2535 Diamond Proxy Address
                    </label>
                    <div className="flex items-center gap-1.5 bg-[#0d1117] border border-white/10 rounded-lg p-2 font-mono text-[11px] text-emerald-300">
                      <span className="truncate flex-1">{CONTRACTS.diamond}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(CONTRACTS.diamond, "Diamond Address")}
                        className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
                        title="Copy Diamond Router Address"
                      >
                        {copiedKey === "Diamond Address" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Delegatecalls all facet functions through this single verified contract.
                    </p>
                  </div>
                )}

                {activeCodeTab === "foundry" && (
                  <div>
                    <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                      Foundry Package Installation Command
                    </label>
                    <div className="flex items-center gap-1.5 bg-[#0d1117] border border-white/10 rounded-lg p-2 font-mono text-[11px] text-cyan-300">
                      <Terminal className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate flex-1">
                        forge install SolGit/solgit-diamond
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            "forge install SolGit/solgit-diamond",
                            "Foundry Command"
                          )
                        }
                        className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
                        title="Copy Foundry Command"
                      >
                        {copiedKey === "Foundry Command" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Includes interfaces, mock facets, and Guardian invariant test harnesses.
                    </p>
                  </div>
                )}

                {activeCodeTab === "rpc" && (
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">RPC Endpoint</span>
                      <span className="text-[11px] font-mono text-zinc-300">
                        {CONTRACTS.rpcUrl}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Chain ID</span>
                      <span className="text-[11px] font-mono text-zinc-300">
                        {CONTRACTS.chainId} (MST Blockchain Testnet)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Explorer Quick Link */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <a
                  href={`${CONTRACTS.explorer}/address/${CONTRACTS.diamond}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition"
                >
                  <span>View on MSTScan Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          GitHub-Style Latest Commit Bar
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#161b22] border border-white/10 rounded-t-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Author, Avatar & Message */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar */}
          <div
            className={`w-6 h-6 rounded-full border flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${commitSummary.avatarBg}`}
          >
            {isMerged ? (
              <Sparkles className="w-3.5 h-3.5" />
            ) : isHacked ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <span>0x</span>
            )}
          </div>

          {/* Author & Commit Message */}
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-white truncate">
              {commitSummary.author}
            </span>
            <span className="text-zinc-400 truncate hidden sm:inline">
              {commitSummary.message}
            </span>
          </div>
        </div>

        {/* Right: Commit SHA, Time, Status */}
        <div className="flex items-center gap-3 shrink-0 text-zinc-400">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-mono">
            {commitSummary.statusBadge}
          </span>
          <button
            type="button"
            onClick={() => handleCopy(commitSummary.sha, `Commit ${commitSummary.sha}`)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#0d1117] hover:bg-white/10 text-zinc-300 font-mono text-[11px] transition cursor-pointer"
            title="Copy commit SHA"
          >
            <span>{commitSummary.sha}</span>
            {copiedKey === `Commit ${commitSummary.sha}` ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-zinc-500" />
            )}
          </button>
          <span className="text-[11px] text-zinc-500 whitespace-nowrap">
            {commitSummary.time}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          GitHub-Style File Explorer Table (Connected to Commit Bar)
          ───────────────────────────────────────────────────────────── */}
      <div className="border border-t-0 border-white/10 rounded-b-xl overflow-hidden bg-[#0d1117] -mt-6">
        {/* Table header bar */}
        <div className="px-4 py-2.5 bg-[#161b22]/70 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2 font-mono">
            <Folder className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-300 font-medium">solgit-vault-diamond</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">contracts</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search / Go to file filter */}
            <div className="relative flex items-center">
              <Search className="w-3 h-3 absolute left-2 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                placeholder="Go to file..."
                className="bg-[#0d1117] border border-white/10 rounded-md pl-6 pr-6 py-1 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-28 sm:w-36 transition-all"
              />
              {fileSearch && (
                <button
                  type="button"
                  onClick={() => setFileSearch("")}
                  className="absolute right-1.5 text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="text-[11px] text-zinc-500 hidden sm:block">
              {displayedFiles.length} {displayedFiles.length === 1 ? "file" : "files"}
            </div>
          </div>
        </div>

        {/* File Rows */}
        <div className="divide-y divide-white/[0.06]">
          {displayedFiles.map((file) => {
            const isSelected =
              activeFile.name === file.name || activeFile.path === file.path;
            const isSol = file.name.endsWith(".sol");

            return (
              <div
                key={file.path}
                onClick={() => onSelectFile(file.name)}
                className={`group flex items-center justify-between px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500/[0.08] border-l-2 border-emerald-400"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                {/* File Icon & Name */}
                <div className="flex items-center gap-2.5 min-w-[200px] sm:min-w-[260px]">
                  {isSol ? (
                    <FileCode
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isSelected ? "text-emerald-400" : "text-cyan-400"
                      }`}
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  )}

                  <span
                    className={`font-mono transition-colors ${
                      isSelected
                        ? "text-emerald-300 font-semibold"
                        : "text-zinc-200 group-hover:text-cyan-300 group-hover:underline"
                    }`}
                  >
                    {file.name}
                  </span>

                  {/* Contextual Status Badges for Key Files */}
                  {file.name === "VaultV2.sol" && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                        isHacked
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {isHacked ? "Quarantined" : "Vulnerable (v2)"}
                    </span>
                  )}
                  {file.name === "VaultV2Fixed.sol" && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                      AI Patched
                    </span>
                  )}
                  {file.name === "SolGitDiamond.sol" && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 font-mono hidden md:inline">
                      Diamond Core
                    </span>
                  )}
                  {file.name === "VersionRegistry.sol" && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 font-mono hidden md:inline">
                      Registry
                    </span>
                  )}
                </div>

                {/* Last Commit Message */}
                <div className="hidden md:block flex-1 px-4 text-zinc-400 truncate text-[11px]">
                  {file.lastCommit.message}
                </div>

                {/* Size & Timestamp */}
                <div className="flex items-center gap-4 text-zinc-500 text-[11px] font-mono shrink-0">
                  <span className="hidden sm:inline">{file.size}</span>
                  <span className="text-right whitespace-nowrap">
                    {file.lastCommit.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          Grid: macOS Code Window Viewer & Repository Metadata Sidebar
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column: macOS Code Window Viewer (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="macos-window bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            {/* macOS Window Header with Traffic Light Dots */}
            <div className="px-4 py-3 bg-[#161b22] border-b border-white/10 flex items-center justify-between">
              {/* Left: macOS Traffic Lights & File Breadcrumb */}
              <div className="flex items-center gap-3">
                {/* Traffic Lights */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onCopyToast) onCopyToast("Closed file preview");
                    }}
                    className="macos-traffic-dot macos-traffic-close cursor-pointer"
                    title="Close"
                  />
                  <button
                    type="button"
                    onClick={() => setIsViewerMinimized(!isViewerMinimized)}
                    className="macos-traffic-dot macos-traffic-minimize cursor-pointer"
                    title="Minimize / Collapse"
                  />
                  <button
                    type="button"
                    onClick={() => setIsViewerFullscreen(!isViewerFullscreen)}
                    className="macos-traffic-dot macos-traffic-expand cursor-pointer"
                    title="Toggle Expand"
                  />
                </div>

                {/* File Path */}
                <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 pl-2 border-l border-white/10">
                  <Folder className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-500">solgit/</span>
                  <span className="font-semibold text-white">{activeFile.path}</span>
                </div>
              </div>

              {/* Right: File Metrics & Action Buttons */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  {lines.length} lines
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono hidden sm:inline">
                  {activeFile.size}
                </span>

                {/* Copy Raw Button */}
                <button
                  type="button"
                  onClick={() => handleCopy(activeFile.content, activeFile.name)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-zinc-300 hover:text-white transition cursor-pointer text-[11px] font-medium"
                >
                  {copiedKey === activeFile.name ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy raw</span>
                    </>
                  )}
                </button>

                {/* Toggle Collapse/Expand */}
                <button
                  type="button"
                  onClick={() => setIsViewerFullscreen(!isViewerFullscreen)}
                  className="p-1 rounded bg-[#21262d] hover:bg-[#30363d] text-zinc-400 hover:text-white transition cursor-pointer"
                  title={isViewerFullscreen ? "Normal height" : "Expand viewer"}
                >
                  {isViewerFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Code Body */}
            {isViewerMinimized ? (
              <div className="p-6 text-center text-xs text-zinc-500 bg-[#0d1117]">
                <span>Code window minimized. Click the yellow traffic light or expand button to view code.</span>
              </div>
            ) : (
              <div
                className={`overflow-auto font-mono text-xs leading-relaxed bg-[#0d1117] ${
                  isViewerFullscreen ? "max-h-[850px]" : "max-h-[520px]"
                }`}
              >
                <div className="min-w-full divide-y divide-transparent">
                  {tokenizedLines.map(({ lineNum, tokens, isHazard, isFix }) => (
                    <div
                      key={lineNum}
                      className={`flex items-start transition-colors ${
                        isHazard
                          ? "bg-rose-500/15 border-l-4 border-rose-500"
                          : isFix
                          ? "bg-emerald-500/15 border-l-4 border-emerald-400"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      {/* Line Number Gutter */}
                      <span className="w-12 shrink-0 py-0.5 pr-3 text-right text-zinc-600 select-none text-[11px] border-r border-white/[0.06] bg-[#0d1117]/80">
                        {lineNum}
                      </span>

                      {/* Code Tokens */}
                      <div className="py-0.5 px-3 whitespace-pre flex-1 overflow-x-visible">
                        {tokens.map((token, tIdx) => {
                          let colorClass = "text-zinc-300";
                          if (token.type === "comment") colorClass = "text-zinc-500 italic";
                          if (token.type === "keyword") colorClass = "text-cyan-400 font-medium";
                          if (token.type === "type") colorClass = "text-amber-300 font-medium";
                          if (token.type === "string") colorClass = "text-emerald-300";
                          if (token.type === "number") colorClass = "text-purple-300";
                          if (token.type === "annotation") colorClass = "text-teal-300 font-medium";

                          return (
                            <span key={tIdx} className={colorClass}>
                              {token.text}
                            </span>
                          );
                        })}

                        {/* Inline Hazard Callout */}
                        {isHazard && (
                          <span className="ml-3 px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-300 text-[10px] font-sans font-semibold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            CRITICAL HAZARD: Unchecked underflow enables balance draining
                          </span>
                        )}

                        {/* Inline Fix Callout */}
                        {isFix && (
                          <span className="ml-3 px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 text-[10px] font-sans font-semibold inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            AI DEFENSE FIX: Enforces Checks-Effects-Interactions (CEI)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* macOS Window Footer Bar */}
            <div className="px-4 py-2 bg-[#161b22] border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <div className="flex items-center gap-3">
                <span>UTF-8</span>
                <span>•</span>
                <span>LF</span>
                <span>•</span>
                <span className="text-emerald-400">Solidity 0.8.24</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>EIP-2535 Diamond Standard Compatible</span>
              </div>
            </div>
          </div>

          {/* README.md Preview Container (GitHub Default) */}
          <div className="macos-card bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10 text-sm font-semibold text-white">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>README.md</span>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <span>SolGit: Git-Style Smart Contract Platform</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  MST Testnet
                </span>
              </h1>
              <p>
                SolGit implements an on-chain version-controlled modular protocol using the{" "}
                <strong className="text-cyan-300">EIP-2535 Diamond Standard</strong>. With dynamic
                selector version registration, runtime invariant monitoring, and automated AI
                self-healing rollback, SolGit stops exploits before funds are lost.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-[#161b22] border border-white/10">
                  <span className="text-zinc-500 text-[10px] block font-mono">CORE DEFENSE</span>
                  <span className="font-semibold text-white text-xs">Guardian Rollback</span>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Instant selector rollback to verified stable facets upon invariant violation.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#161b22] border border-white/10">
                  <span className="text-zinc-500 text-[10px] block font-mono">ORCHESTRATION</span>
                  <span className="font-semibold text-white text-xs">Autonomous PR Healing</span>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    AI Watcher generates pull requests with verified CEI logic and test proofs.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#161b22] border border-white/10">
                  <span className="text-zinc-500 text-[10px] block font-mono">REGISTRY</span>
                  <span className="font-semibold text-white text-xs">Version History</span>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Every facet deployment is hashed, tagged, and tracked on-chain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Repository Metadata (Span 4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* About Card */}
          <div className="macos-card bg-[#161b22] border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center justify-between">
              <span>About</span>
              <Info className="w-3.5 h-3.5 text-zinc-500" />
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              SolGit Vault Diamond: Modular EIP-2535 smart contract architecture on MST Blockchain
              with autonomous AI self-healing and Guardian emergency rollback.
            </p>

            {/* Topics Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                "solidity",
                "diamond-eip2535",
                "mst-blockchain",
                "self-healing",
                "foundry",
                "security-guardian",
              ].map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Protocol Meta Table */}
            <div className="pt-2 border-t border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Network</span>
                <span className="font-semibold text-white">MST Blockchain Testnet</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Chain ID</span>
                <span className="font-mono text-emerald-400">91562037</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Native Token</span>
                <span className="font-mono text-zinc-200">tMSTC</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Block Time</span>
                <span className="font-mono text-zinc-200">~3.0s</span>
              </div>
            </div>

            {/* Diamond Proxy Box */}
            <div className="pt-2 border-t border-white/10">
              <label className="text-[11px] text-zinc-400 block mb-1">Diamond Router Address</label>
              <div className="flex items-center gap-1.5 bg-[#0d1117] border border-white/10 rounded-lg p-2 font-mono text-[11px] text-zinc-300">
                <span className="truncate flex-1 text-emerald-300">{CONTRACTS.diamond}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(CONTRACTS.diamond, "Diamond Address")}
                  className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  {copiedKey === "Diamond Address" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Verified Facets Card */}
          <div className="macos-card bg-[#161b22] border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Verified Diamond Facets</span>
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-lg bg-[#0d1117] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">DiamondCutFacet</div>
                  <div className="text-[10px] text-zinc-500 font-mono">0xCEe1...19EB</div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  Core
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[#0d1117] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">DiamondLoupeFacet</div>
                  <div className="text-[10px] text-zinc-500 font-mono">0xCEe1...19EB</div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  Loupe
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[#0d1117] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">SolGitGuardianFacet</div>
                  <div className="text-[10px] text-zinc-500 font-mono">0x6A7C...5e27</div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                  Guardian
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[#0d1117] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">VaultFacet (Active)</div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {isMerged
                      ? "0xb1C8...599 (v3 AI Fix)"
                      : isHacked
                      ? "0xF717...53f8 (v1 Safe)"
                      : "0x9169...BCB7 (v2 Active)"}
                  </div>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isMerged
                      ? "bg-purple-500/20 text-purple-300"
                      : isHacked
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {isMerged ? "v3" : isHacked ? "v1 (Rollback)" : "v2"}
                </span>
              </div>
            </div>
          </div>

          {/* Guardian Defense Invariants */}
          <div className="macos-card bg-[#161b22] border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Guardian Invariants</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">OUTFLOW_CAP</span>
                <span className="font-mono text-emerald-400 font-semibold">100 tMSTC / tx</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">CEI Pattern</span>
                <span className="font-mono text-emerald-400 font-semibold">Enforced</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Auto Rollback Hook</span>
                <span className="font-mono text-emerald-400 font-semibold">Enabled</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400">Status</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    isHacked ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {isHacked ? "Rollback Engaged" : "All Invariants Passing"}
                </span>
              </div>
            </div>
          </div>

          {/* Releases Card */}
          <div className="macos-card bg-[#161b22] border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Releases</span>
              <Package className="w-3.5 h-3.5 text-zinc-500" />
            </h3>

            <div className="p-3 rounded-lg bg-[#0d1117] border border-white/10 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">v1.0.0-stable</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                  Latest
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                MST Testnet Genesis deployment with dynamic DiamondCut and VersionRegistry.
              </p>
              <div className="text-[10px] text-zinc-500 pt-1">
                Released 1 day ago • 4 verified bytecode artifacts
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
