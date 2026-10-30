"use client";

import React from "react";
import { LeftSidebar } from "./LeftSidebar";
import { CenterFeed } from "./CenterFeed";
import { RightSidebar } from "./RightSidebar";
import type { Repository, PullRequestItem, RollbackEvent } from "../../lib/types";

export interface DashboardViewProps {
  repos: Repository[];
  selectedRepoId: string;
  onSelectRepo: (repoId: string) => void;
  onOpenNewRepoModal: () => void;
  address: string | null;
  pullRequests: PullRequestItem[];
  recentEvents: RollbackEvent[];
  onNavigatePR: (prId: number) => void;
  onSimulateHack?: () => void;
  onRollback?: () => void;
  onCopyAddress?: (text: string, label?: string) => void;
}

export function DashboardView({
  repos,
  selectedRepoId,
  onSelectRepo,
  onOpenNewRepoModal,
  address,
  pullRequests,
  recentEvents,
  onNavigatePR,
  onSimulateHack,
  onRollback,
  onCopyAddress,
}: DashboardViewProps) {
  return (
    <main className="max-w-[1440px] mx-auto px-4 py-6 w-full animate-in fade-in duration-150">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Span 3): Home/Feed Navigation + Top Repositories */}
        <div className="lg:col-span-3">
          <LeftSidebar
            repos={repos}
            selectedRepoId={selectedRepoId}
            onSelectRepo={onSelectRepo}
            onOpenNewRepoModal={onOpenNewRepoModal}
          />
        </div>

        {/* Center Column (Span 6): Greeting + Recent PRs + Contract Activity (Zero Copilot) */}
        <div className="lg:col-span-6">
          <CenterFeed
            address={address}
            pullRequests={pullRequests}
            recentEvents={recentEvents}
            onSelectRepo={onSelectRepo}
            onNavigatePR={onNavigatePR}
            onSimulateHack={onSimulateHack}
            onRollback={onRollback}
          />
        </div>

        {/* Right Column (Span 3): MST Blockchain Status + Changelog */}
        <div className="lg:col-span-3">
          <RightSidebar onCopyAddress={onCopyAddress} />
        </div>
      </div>
    </main>
  );
}
