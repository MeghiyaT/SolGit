"use client";

import React from "react";
import { Code, GitCommit, GitPullRequest, ShieldAlert, Cpu } from "lucide-react";
import type { TabType } from "../lib/types";

export interface TabNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  prCount?: number;
  hasSecurityAlert?: boolean;
}

interface NavTabItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  hasAlert?: boolean;
}

export function TabNav({
  activeTab,
  onTabChange,
  prCount = 1,
  hasSecurityAlert = false,
}: TabNavProps) {
  const tabs: NavTabItem[] = [
    {
      id: "code",
      label: "Code",
      icon: Code,
    },
    {
      id: "commits",
      label: "Commits",
      icon: GitCommit,
    },
    {
      id: "pulls",
      label: "Pull Requests",
      icon: GitPullRequest,
      badge: prCount,
    },
    {
      id: "security",
      label: "Security",
      icon: ShieldAlert,
      hasAlert: hasSecurityAlert,
      badge: hasSecurityAlert ? "ALERT" : undefined,
    },
    {
      id: "loupe",
      label: "Diamond Loupe",
      icon: Cpu,
    },
  ];

  return (
    <nav
      aria-label="Repository subnavigation"
      className="w-full border-b border-white/[0.08] bg-[#0d1117]/60 backdrop-blur-md px-4 sm:px-6"
    >
      <div
        role="tablist"
        aria-label="Repository tabs"
        className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto scrollbar-none -mb-[1px]"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`group relative flex items-center gap-2 px-3.5 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap outline-none cursor-pointer ${
                isActive
                  ? "border-emerald-400 text-white bg-white/[0.04]"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-white/20 hover:bg-white/[0.02]"
              }`}
            >
              {/* Alert pulse indicator for security */}
              {tab.hasAlert && (
                <span className="relative flex h-2 w-2 mr-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
              )}

              {/* Tab Icon */}
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive
                    ? "text-emerald-400"
                    : tab.hasAlert
                    ? "text-rose-400"
                    : "text-zinc-400 group-hover:text-zinc-200"
                }`}
              />

              {/* Tab Label */}
              <span>{tab.label}</span>

              {/* Counter or Alert Badge */}
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono transition ${
                    tab.hasAlert
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold animate-pulse"
                      : isActive
                      ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                      : "bg-white/[0.08] text-zinc-300 border border-white/10 group-hover:border-white/20"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default TabNav;
