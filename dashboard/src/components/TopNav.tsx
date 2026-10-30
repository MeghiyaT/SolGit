"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Plus,
  Search,
  BookOpen,
  GitPullRequest,
  UploadCloud,
  ChevronDown,
} from "lucide-react";
import { WalletButton } from "./wallet/WalletButton";
import type { ViewType } from "../lib/types";

export interface TopNavProps {
  currentView?: ViewType;
  onNavigateHome?: () => void;
  onOpenNewRepoModal?: () => void;
  onOpenCommandPalette: () => void;
  onCopyAddress?: (addr: string, label?: string) => void;
  onActionToast?: (title: string, desc?: string, type?: "info" | "success" | "warning" | "error") => void;
  activeRepo?: {
    owner: string;
    name: string;
  };
}

export function TopNav({
  currentView = "dashboard",
  onNavigateHome = () => {},
  onOpenNewRepoModal = () => {},
  onOpenCommandPalette,
  onActionToast,
  activeRepo = { owner: "mst-protocol", name: "solgit-vault-diamond" },
}: TopNavProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Close create menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setIsCreateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationsClick = () => {
    setHasNotifications(false);
    onActionToast?.("Notifications", "You have no unread smart contract alerts.", "info");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#30363d] bg-[#0d1117] px-4 py-2 text-xs">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
        {/* Left Section: GitHub Octocat Glyph + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {/* GitHub Octocat Brand Button */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-white hover:text-[#58a6ff] transition flex items-center gap-2 group flex-shrink-0 cursor-pointer"
            title="Return to SolGit Dashboard"
            aria-label="Return to SolGit Dashboard"
          >
            <svg
              height="32"
              viewBox="0 0 16 16"
              width="32"
              fill="currentColor"
              className="text-white group-hover:scale-105 transition-transform"
              aria-hidden="true"
            >
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
            <span className="font-semibold text-white text-sm tracking-tight hidden sm:inline">
              SolGit
            </span>
          </button>

          {/* Location Title / Breadcrumb */}
          {currentView === "dashboard" ? (
            <div className="flex items-center gap-2">
              <span className="text-[#30363d] hidden sm:inline">/</span>
              <span className="font-semibold text-[#f0f6fc] text-sm">Dashboard</span>
            </div>
          ) : (
            <nav aria-label="Repository Breadcrumb" className="flex items-center gap-1.5 text-xs truncate">
              <span className="text-[#30363d]">/</span>
              <button
                type="button"
                onClick={onNavigateHome}
                className="text-[#8b949e] hover:text-[#58a6ff] transition cursor-pointer truncate"
              >
                {activeRepo.owner}
              </button>
              <span className="text-[#30363d]">/</span>
              <span className="font-semibold text-[#f0f6fc] truncate">
                {activeRepo.name}
              </span>
            </nav>
          )}
        </div>

        {/* Center: Search Bar (Type / to search) */}
        <div className="flex-1 max-w-md mx-2">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-md bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#8b949e] text-xs text-[#8b949e] hover:text-[#f0f6fc] transition shadow-inner group"
            title="Search or jump to... (Press /)"
            aria-label="Search or jump to"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="h-3.5 w-3.5 text-[#8b949e] group-hover:text-[#58a6ff] transition" />
              <span className="truncate">Type <span className="font-mono text-zinc-300">/</span> to search</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="hidden sm:inline-flex items-center font-mono text-[10px] bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d] text-[#8b949e]">
                /
              </kbd>
            </div>
          </button>
        </div>

        {/* Right Section: Create (+) Dropdown + Notifications + Web3 Wallet */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Create (+) Dropdown */}
          <div className="relative" ref={createMenuRef}>
            <button
              type="button"
              onClick={() => setIsCreateOpen((prev) => !prev)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-[#21262d] text-[#c9d1d9] hover:text-white border border-transparent hover:border-[#30363d] transition cursor-pointer"
              title="Create new..."
              aria-label="Create new repository or contract"
              aria-expanded={isCreateOpen}
            >
              <Plus className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 text-[#8b949e]" />
            </button>

            {isCreateOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1.5 w-60 rounded-md bg-[#161b22] border border-[#30363d] shadow-2xl py-1 z-50 text-xs animate-in fade-in duration-100"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    onOpenNewRepoModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#58a6ff] transition text-left cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#8b949e]" />
                  <div>
                    <div className="font-medium text-[#f0f6fc]">New repository</div>
                    <div className="text-[11px] text-[#8b949e]">Create versioned contract repository</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    onOpenNewRepoModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[#c9d1d9] hover:bg-[#21262d] hover:text-emerald-400 transition text-left cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-[#8b949e]" />
                  <div>
                    <div className="font-medium text-[#f0f6fc]">Upload smart contract</div>
                    <div className="text-[11px] text-[#8b949e]">Deploy .sol behind Diamond proxy</div>
                  </div>
                </button>

                <div className="my-1 border-t border-[#30363d]" />

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    onActionToast?.("New Pull Request", "Opening Pull Request creation view...", "info");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[#c9d1d9] hover:bg-[#21262d] hover:text-purple-400 transition text-left cursor-pointer"
                >
                  <GitPullRequest className="w-4 h-4 text-[#8b949e]" />
                  <div>
                    <div className="font-medium text-[#f0f6fc]">New pull request</div>
                    <div className="text-[11px] text-[#8b949e]">Propose facet upgrade or hotfix</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={handleNotificationsClick}
            className="relative p-1.5 rounded-md hover:bg-[#21262d] text-[#c9d1d9] hover:text-white border border-transparent hover:border-[#30363d] transition cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {hasNotifications && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#1f6feb] ring-2 ring-[#0d1117]" />
            )}
          </button>

          {/* Strict Web3 Wallet Authentication */}
          <WalletButton onNotify={onActionToast} />
        </div>
      </div>
    </header>
  );
}
