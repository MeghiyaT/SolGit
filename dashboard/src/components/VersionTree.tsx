"use client";

import React from "react";
import { GitCommit, ShieldAlert, CheckCircle2, Zap, ArrowRight, GitFork } from "lucide-react";
import type { SelectorFeature } from "../lib/data";

interface VersionTreeProps {
  selectors: SelectorFeature[];
  selectedSelector: SelectorFeature;
  onSelectFeature: (feature: SelectorFeature) => void;
  onSelectDiff: (selector: SelectorFeature) => void;
}

export function VersionTree({
  selectors,
  selectedSelector,
  onSelectFeature,
  onSelectDiff,
}: VersionTreeProps) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Version Tree (Git History)</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Per-selector function versioning with granular rollback and quarantine lifecycle
          </p>
        </div>

        {/* Feature selector pills */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800">
          {selectors.map((feat) => {
            const isSelected = feat.selector === selectedSelector.selector;
            return (
              <button
                key={feat.selector}
                onClick={() => onSelectFeature(feat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                  isSelected
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                {feat.signature}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Selector Details */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-800/40">
              Selector: {selectedSelector.selector}
            </span>
            <span className="ml-3 text-sm text-zinc-300 font-medium">
              {selectedSelector.name} Facet
            </span>
          </div>
          <button
            onClick={() => onSelectDiff(selectedSelector)}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition"
          >
            <span>Inspect Diff</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Visual Git Commit Tree */}
        <div className="relative pl-6 space-y-6 before:absolute before:left-[17px] before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-cyan-500 before:to-zinc-700">
          {selectedSelector.history.map((commit) => {
            const isStable = commit.status === "Stable";
            const isQuarantined = commit.status === "Quarantined";

            return (
              <div key={commit.version} className="relative group">
                {/* Node icon */}
                <div
                  className={`absolute -left-[31px] top-1.5 h-6 w-6 rounded-full flex items-center justify-center border-2 ${
                    isStable
                      ? "bg-zinc-950 border-emerald-400 text-emerald-400 shadow-sm shadow-emerald-400/20"
                      : isQuarantined
                      ? "bg-zinc-950 border-rose-500 text-rose-500 shadow-sm shadow-rose-500/20 animate-pulse"
                      : "bg-zinc-950 border-cyan-400 text-cyan-400 shadow-sm shadow-cyan-400/20"
                  }`}
                >
                  <GitCommit className="h-3.5 w-3.5" />
                </div>

                {/* Commit Box */}
                <div
                  className={`rounded-xl border p-4 transition ${
                    isQuarantined
                      ? "bg-rose-950/10 border-rose-500/40"
                      : isStable
                      ? "bg-zinc-950/60 border-emerald-500/30 hover:border-emerald-500/50"
                      : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">
                        v{commit.version}
                      </span>
                      <span className="text-xs font-mono text-zinc-500">
                        {commit.codeHash.slice(0, 10)}...
                      </span>

                      {/* Status badge */}
                      {isStable && (
                        <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" /> Stable
                        </span>
                      )}
                      {commit.status === "Active" && (
                        <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          <Zap className="h-3 w-3" /> Active
                        </span>
                      )}
                      {isQuarantined && (
                        <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          <ShieldAlert className="h-3 w-3" /> Quarantined
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-zinc-500">
                      {new Date(commit.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 mt-2 font-mono">
                    {commit.message}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span>Impl: {commit.implementation}</span>
                    <span>Author: {commit.author}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
