"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Code,
  GitCommit,
  GitPullRequest,
  ShieldAlert,
  Layers,
  FileCode,
  FileText,
  Flame,
  GitMerge,
  RotateCcw,
  Copy,
  ExternalLink,
  Coins,
  CornerDownLeft,
  Sparkles,
} from "lucide-react";
import type { TabType } from "../lib/types";
import { CONTRACTS, INITIAL_SELECTORS, REPO_FILES } from "../lib/data";

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: TabType) => void;
  onSelectFile: (fileName: string) => void;
  onTriggerHack: () => void;
  onMergeFix: () => void;
  onReset?: () => void;
  onCopyAddress?: (addr: string, label?: string) => void;
  isHacked?: boolean;
  isMerged?: boolean;
}

export interface CommandItem {
  id: string;
  category: "Navigation" | "Files" | "Function Selectors" | "Actions";
  title: string;
  description?: string;
  keywords?: string[];
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  shortcut?: string;
  perform: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelectTab,
  onSelectFile,
  onTriggerHack,
  onMergeFix,
  onReset,
  onCopyAddress,
  isHacked = false,
  isMerged = false,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  // Focus input and reset state on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setSearch("");
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Define full command items list
  const allCommands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [
      // 1. Navigation
      {
        id: "nav-code",
        category: "Navigation",
        title: "Code",
        description: "Browse smart contracts, facets, and documentation",
        keywords: ["code", "contracts", "files", "facets", "explorer", "solidity", "tree"],
        icon: <Code className="h-4 w-4 text-emerald-400" />,
        badge: "Tab 1",
        shortcut: "⌥1",
        perform: () => {
          onSelectTab("code");
          onClose();
        },
      },
      {
        id: "nav-commits",
        category: "Navigation",
        title: "Commits & Audit Trail",
        description: "Per-selector commit logs, diffs, and cryptographic code hashes",
        keywords: ["commits", "history", "log", "git", "diff", "hashes", "audit"],
        icon: <GitCommit className="h-4 w-4 text-cyan-400" />,
        badge: "Tab 2",
        shortcut: "⌥2",
        perform: () => {
          onSelectTab("commits");
          onClose();
        },
      },
      {
        id: "nav-pulls",
        category: "Navigation",
        title: "Pull Requests",
        description: "AI automated fix PR #42 & security review approval pipeline",
        keywords: ["pulls", "pull requests", "pr", "ai", "hotfix", "review", "merge", "fix"],
        icon: <GitPullRequest className="h-4 w-4 text-purple-400" />,
        badge: "Tab 3",
        shortcut: "⌥3",
        perform: () => {
          onSelectTab("pulls");
          onClose();
        },
      },
      {
        id: "nav-security",
        category: "Navigation",
        title: "Security & Invariants",
        description: "SolGit Guardian engine, exploit simulator & real-time rollback events",
        keywords: ["security", "guardian", "invariants", "exploit", "hack", "rollback", "events"],
        icon: <ShieldAlert className="h-4 w-4 text-amber-400" />,
        badge: "Tab 4",
        shortcut: "⌥4",
        perform: () => {
          onSelectTab("security");
          onClose();
        },
      },
      {
        id: "nav-loupe",
        category: "Navigation",
        title: "Diamond Loupe (EIP-2535)",
        description: "Interactive facet inspector, diamondCut history & function dispatch table",
        keywords: ["loupe", "diamond", "eip-2535", "facets", "selectors", "proxy", "dispatch"],
        icon: <Layers className="h-4 w-4 text-blue-400" />,
        badge: "Tab 5",
        shortcut: "⌥5",
        perform: () => {
          onSelectTab("loupe");
          onClose();
        },
      },

      // 2. Files
      ...REPO_FILES.map((file) => ({
        id: `file-${file.name}`,
        category: "Files" as const,
        title: file.name,
        description: `${file.path} — ${file.description}`,
        keywords: [file.name, file.path, file.language, "file", "contract", "source"],
        icon: file.name.endsWith(".md") ? (
          <FileText className="h-4 w-4 text-amber-300" />
        ) : (
          <FileCode className="h-4 w-4 text-emerald-400" />
        ),
        badge: file.size,
        perform: () => {
          onSelectFile(file.name);
          onSelectTab("code");
          onClose();
        },
      })),

      // 3. Function Selectors
      ...INITIAL_SELECTORS.map((sel) => ({
        id: `sel-${sel.selector}`,
        category: "Function Selectors" as const,
        title: `${sel.selector} (${sel.name.toLowerCase()})`,
        description: `${sel.signature} — ${sel.description}`,
        keywords: [sel.selector, sel.signature, sel.name, "selector", "function", "method"],
        icon: <Code className="h-4 w-4 text-indigo-400" />,
        badge: `v${sel.currentVersion} Active`,
        perform: () => {
          onSelectTab("loupe");
          onClose();
        },
      })),

      // 4. Actions
      {
        id: "action-hack",
        category: "Actions",
        title: "Simulate Exploit Attack",
        description: "Trigger 200 tMSTC flash underflow drain attempt to activate Guardian rollback",
        keywords: ["hack", "exploit", "simulate", "attack", "drain", "underflow", "rollback", "flash loan"],
        icon: <Flame className="h-4 w-4 text-rose-400" />,
        badge: isHacked ? "Blocked & Rolled Back" : "Ready to Attack",
        badgeColor: isHacked
          ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
          : "text-rose-400 border-rose-500/30 bg-rose-500/10",
        perform: () => {
          onTriggerHack();
          onClose();
        },
      },
      {
        id: "action-merge",
        category: "Actions",
        title: "Merge AI Pull Request #42",
        description: "Apply AI-generated hotfix to restore CEI balance check and promote VaultV2Fixed",
        keywords: ["merge", "pr", "ai", "fix", "pull request", "promote", "patch", "pr #42"],
        icon: <GitMerge className="h-4 w-4 text-emerald-400" />,
        badge: isMerged ? "Merged (v3 Stable)" : "Open (PR #42)",
        badgeColor: isMerged
          ? "text-purple-400 border-purple-500/30 bg-purple-500/10"
          : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
        perform: () => {
          onMergeFix();
          onClose();
        },
      },
      {
        id: "action-reset",
        category: "Actions",
        title: "Reset Sandbox Environment",
        description: "Reset contract versions, rollback events, and PR states back to initial baseline",
        keywords: ["reset", "sandbox", "restore", "clean", "restart"],
        icon: <RotateCcw className="h-4 w-4 text-cyan-400" />,
        badge: "Clean State",
        perform: () => {
          onReset?.();
          onClose();
        },
      },
      {
        id: "action-copy-router",
        category: "Actions",
        title: "Copy Diamond Router Address",
        description: `EIP-2535 Router: ${CONTRACTS.router}`,
        keywords: ["copy", "router", "diamond", "address", "proxy"],
        icon: <Copy className="h-4 w-4 text-zinc-300" />,
        badge: `${CONTRACTS.router.slice(0, 6)}...${CONTRACTS.router.slice(-4)}`,
        perform: () => {
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(CONTRACTS.router).catch(() => {});
          }
          onCopyAddress?.(CONTRACTS.router, "Diamond Router Address");
          onClose();
        },
      },
      {
        id: "action-explorer",
        category: "Actions",
        title: "Open MSTScan Explorer",
        description: "Browse MST Blockchain transactions, diamond proxy contracts, and event logs",
        keywords: ["mstscan", "explorer", "blockchain", "testnet", "mst", "tx"],
        icon: <ExternalLink className="h-4 w-4 text-zinc-300" />,
        badge: "MST Testnet",
        perform: () => {
          if (typeof window !== "undefined") {
            window.open(CONTRACTS.explorer, "_blank");
          }
          onClose();
        },
      },
      {
        id: "action-faucet",
        category: "Actions",
        title: "Open MST Faucet",
        description: "Request testnet tMSTC tokens for deploying facets and interacting with SolGit",
        keywords: ["faucet", "tokens", "tmstc", "claim", "free", "funds"],
        icon: <Coins className="h-4 w-4 text-amber-400" />,
        badge: "tMSTC Faucet",
        perform: () => {
          if (typeof window !== "undefined") {
            window.open("https://faucet.mstblockchain.com", "_blank");
          }
          onClose();
        },
      },
    ];

    return items;
  }, [
    onSelectTab,
    onSelectFile,
    onTriggerHack,
    onMergeFix,
    onReset,
    onCopyAddress,
    isHacked,
    isMerged,
    onClose,
  ]);

  // Filter commands by search term
  const filteredItems = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    if (!trimmed) return allCommands;

    const terms = trimmed.split(/\s+/).filter(Boolean);
    return allCommands.filter((item) => {
      const matchTarget = [
        item.title,
        item.description || "",
        item.category,
        item.badge || "",
        ...(item.keywords || []),
      ]
        .join(" ")
        .toLowerCase();

      return terms.every((term) => matchTarget.includes(term));
    });
  }, [allCommands, search]);

  // Scroll active item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length === 0 ? 0 : (prev + 1) % filteredItems.length
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length === 0
            ? 0
            : (prev - 1 + filteredItems.length) % filteredItems.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].perform();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  // Group filtered items by category
  const categories: Array<CommandItem["category"]> = [
    "Navigation",
    "Files",
    "Function Selectors",
    "Actions",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24 px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="SolGit Command Palette"
    >
      <div
        className="w-full max-w-2xl bg-[#0d1117]/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[80vh] macos-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Window Chrome / Titlebar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/[0.06] select-none bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5" aria-label="Window controls">
              <span
                onClick={onClose}
                className="macos-traffic-dot macos-traffic-close hover:opacity-80 cursor-pointer"
                title="Close"
              />
              <span
                onClick={onClose}
                className="macos-traffic-dot macos-traffic-minimize hover:opacity-80 cursor-pointer"
                title="Minimize"
              />
              <span
                className="macos-traffic-dot macos-traffic-expand hover:opacity-80 cursor-pointer"
                title="Expand"
              />
            </div>
            <div className="h-3 w-px bg-white/10 ml-1" />
            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span>SolGit Spotlight</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
            <span>MST Testnet: 91562037</span>
          </div>
        </div>

        {/* Search Bar Input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-white/10 gap-3 bg-white/[0.01]">
          <Search className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, file, selector, or action..."
            className="w-full bg-transparent text-white placeholder-zinc-500 text-sm sm:text-base focus:outline-none"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedIndex(0);
              }}
              className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 transition"
              title="Clear search"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.08] text-zinc-400 border border-white/10 shadow-sm">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-3 max-h-[50vh] divide-y divide-white/[0.04]"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Search className="h-8 w-8 text-zinc-600 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-zinc-300">
                No commands or files matching &ldquo;{search}&rdquo;
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Try searching for &ldquo;withdraw&rdquo;, &ldquo;PR #42&rdquo;, &ldquo;VaultV2&rdquo;, &ldquo;Security&rdquo;, or &ldquo;0x2e1a...&rdquo;
              </p>
            </div>
          ) : (
            categories.map((category) => {
              const categoryItems = filteredItems.filter(
                (item) => item.category === category
              );
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="pt-2 first:pt-0">
                  <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-zinc-400 flex items-center justify-between">
                    <span>{category}</span>
                    <span className="text-zinc-600 font-mono text-[9px]">
                      {categoryItems.length}
                    </span>
                  </div>

                  <div className="space-y-0.5 mt-1">
                    {categoryItems.map((item) => {
                      const flatIndex = filteredItems.indexOf(item);
                      const isSelected = selectedIndex === flatIndex;

                      return (
                        <div
                          key={item.id}
                          ref={isSelected ? selectedItemRef : null}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                          onClick={() => item.perform()}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-sm transition-all group ${
                            isSelected
                              ? "bg-emerald-500/15 text-white border border-emerald-500/30 shadow-sm shadow-emerald-500/5"
                              : "hover:bg-white/[0.05] text-zinc-300 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-white/[0.05] text-zinc-400 group-hover:bg-white/10 group-hover:text-zinc-200"
                              }`}
                            >
                              {item.icon}
                            </div>
                            <div className="truncate flex-1">
                              <div className="font-medium text-xs sm:text-sm text-zinc-200 group-hover:text-white flex items-center gap-2">
                                <span className="truncate">{item.title}</span>
                                {item.badge && (
                                  <span
                                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                      item.badgeColor ||
                                      "text-zinc-400 border-white/10 bg-white/[0.04]"
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <div className="text-[11px] text-zinc-400 truncate">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 ml-3 text-xs text-zinc-500">
                            {item.shortcut && (
                              <kbd className="hidden sm:inline-flex font-mono text-[10px] bg-white/[0.06] border border-white/10 px-1.5 py-0.5 rounded text-zinc-400">
                                {item.shortcut}
                              </kbd>
                            )}
                            {isSelected && (
                              <CornerDownLeft className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-black/40 border-t border-white/[0.08] text-xs text-zinc-400 select-none">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px]">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px]">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px]">esc</kbd>
              <span>to close</span>
            </span>
          </div>

          <div className="font-mono text-[11px] text-zinc-500">
            {filteredItems.length} result{filteredItems.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
    </div>
  );
}
