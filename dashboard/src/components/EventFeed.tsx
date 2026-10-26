"use client";

import React from "react";
import { Radio, ShieldAlert, ArrowRight, ExternalLink } from "lucide-react";
import type { RollbackEvent } from "../lib/data";

interface EventFeedProps {
  events: RollbackEvent[];
}

export function EventFeed({ events }: EventFeedProps) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-emerald-400 animate-pulse" />
          <h2 className="text-lg font-bold text-white">Live Rollback & Incident Feed</h2>
        </div>
        <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800">
          Listening on MST Testnet
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/10 hover:border-rose-500/50 transition"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                <span className="text-xs font-bold font-mono text-rose-400">
                  {evt.status}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  Block #{evt.blockNumber}
                </span>
              </div>
              <span className="text-xs text-zinc-400">{evt.timestamp}</span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs font-mono">
              <span className="text-zinc-400">Selector:</span>
              <span className="text-cyan-300 font-semibold">{evt.selector}</span>
              <span className="text-zinc-600">|</span>
              <span className="text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/50">
                v{evt.badVersion} (Quarantined)
              </span>
              <ArrowRight className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
                v{evt.goodVersion} (Stable Restored)
              </span>
            </div>

            <div className="mt-3 text-xs text-zinc-300">
              <span className="text-zinc-500 font-medium">Invariant Guard:</span>{" "}
              <span className="text-amber-300 font-mono">{evt.invariant}</span>
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>Triggered by: {evt.triggeredBy}</span>
              <a
                href={`https://testnet.mstscan.com/tx/${evt.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition"
              >
                MSTScan <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
