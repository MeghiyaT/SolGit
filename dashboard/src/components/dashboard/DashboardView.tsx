"use client";

import React from "react";
import { LeftSidebar } from "./LeftSidebar";
import { CenterFeed } from "./CenterFeed";
import type { Repository, PullRequestItem, RollbackEvent } from "../../lib/types";

export interface DashboardViewProps {
  repos: Repository[];
  selectedRepoId: string;
  onSelectRepo: (repoId: string) => void;
  onOpenNewRepoModal: () => void;
  address: string | null;
  nickname?: string | null;
  isConnected?: boolean;
  onRequireWallet?: (message: string) => void;
  pullRequests: PullRequestItem[];
  recentEvents: RollbackEvent[];
  onNavigatePR: (prId: number) => void;
}

export function DashboardView({
  repos,
  selectedRepoId,
  onSelectRepo,
  onOpenNewRepoModal,
  address,
  nickname,
  isConnected = false,
  onRequireWallet,
  pullRequests,
  recentEvents,
  onNavigatePR,
}: DashboardViewProps) {
  return (
    <main className="max-w-[1440px] mx-auto px-4 py-6 w-full animate-in fade-in duration-150">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Span 3): Top Repositories */}
        <div className="lg:col-span-3">
          <LeftSidebar
            repos={repos}
            selectedRepoId={selectedRepoId}
            onSelectRepo={onSelectRepo}
            onOpenNewRepoModal={onOpenNewRepoModal}
            isConnected={isConnected}
            onRequireWallet={onRequireWallet}
          />
        </div>

        {/* Center Column (Span 9): Greeting + Recent PRs + Contract Activity */}
        <div className="lg:col-span-9">
          <CenterFeed
            address={address}
            nickname={nickname}
            pullRequests={pullRequests}
            recentEvents={recentEvents}
            onSelectRepo={onSelectRepo}
            onNavigatePR={onNavigatePR}
          />
        </div>
      </div>
    </main>
  );
}

