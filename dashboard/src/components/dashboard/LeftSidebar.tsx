"use client";

import React, { useState } from "react";
import {
  Home,
  Rss,
  Search,
  BookOpen,
  Plus,
  Lock,
  Globe,
  Shield,
} from "lucide-react";
import type { Repository } from "../../lib/types";

export interface LeftSidebarProps {
  repos: Repository[];
  selectedRepoId?: string;
  onSelectRepo: (repoId: string) => void;
  onOpenNewRepoModal: () => void;
}

export function LeftSidebar({
  repos,
  selectedRepoId,
  onSelectRepo,
  onOpenNewRepoModal,
}: LeftSidebarProps) {
  const [activeNav, setActiveNav] = useState<"home" | "feed">("home");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRepos = repos.filter((repo) =>
    `${repo.owner}/${repo.name}`.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <aside className="space-y-6 text-xs text-[#c9d1d9]" aria-label="Left Sidebar">
      {/* Top Navigation Links */}
      <nav aria-label="Dashboard Primary Navigation" className="space-y-1">
        <button
          type="button"
          onClick={() => setActiveNav("home")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-medium transition cursor-pointer text-left ${
            activeNav === "home"
              ? "bg-[#21262d] text-white"
              : "text-[#8b949e] hover:bg-[#161b22] hover:text-[#f0f6fc]"
          }`}
        >
          <Home className="w-4 h-4 text-[#8b949e]" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav("feed")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-medium transition cursor-pointer text-left ${
            activeNav === "feed"
              ? "bg-[#21262d] text-white"
              : "text-[#8b949e] hover:bg-[#161b22] hover:text-[#f0f6fc]"
          }`}
        >
          <Rss className="w-4 h-4 text-[#8b949e]" />
          <span>Feed</span>
        </button>
      </nav>

      {/* Top Repositories Section */}
      <div className="space-y-3 pt-2 border-t border-[#30363d]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[#f0f6fc] text-xs">Top repositories</h2>
          <button
            type="button"
            onClick={onOpenNewRepoModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white font-medium text-xs transition shadow-sm border border-[#2ea043]/30 cursor-pointer"
            title="Create a new repository"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Repository Filter Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find a repository..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] text-xs text-[#f0f6fc] placeholder-[#8b949e] outline-none transition"
          />
        </div>

        {/* Repositories List */}
        <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
          {filteredRepos.length > 0 ? (
            filteredRepos.map((repo) => {
              const isSelected = repo.id === selectedRepoId;
              return (
                <button
                  key={repo.id}
                  type="button"
                  onClick={() => onSelectRepo(repo.id)}
                  className={`w-full group flex items-start gap-2.5 p-2 rounded-md transition text-left cursor-pointer ${
                    isSelected
                      ? "bg-[#21262d] text-white border border-[#30363d]"
                      : "hover:bg-[#161b22] text-[#c9d1d9] hover:text-[#f0f6fc]"
                  }`}
                >
                  <div className="mt-0.5 p-1 rounded bg-[#21262d] border border-[#30363d] text-[#8b949e] group-hover:text-emerald-400 flex-shrink-0">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold truncate text-xs text-[#f0f6fc] group-hover:text-[#58a6ff]">
                        {repo.owner}/{repo.name}
                      </span>
                      {repo.isPrivate ? (
                        <Lock className="w-3 h-3 text-[#8b949e] flex-shrink-0" />
                      ) : (
                        <Globe className="w-3 h-3 text-[#8b949e] flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8b949e]">
                      <span className="truncate">{repo.facetCount} facets</span>
                      <span>•</span>
                      {repo.guardianActive && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Shield className="w-3 h-3" />
                          <span>Guardian</span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center text-[#8b949e] bg-[#161b22]/50 border border-[#30363d] rounded-md">
              <p>No repositories found matching &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
