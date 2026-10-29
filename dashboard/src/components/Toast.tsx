"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
  X,
  GitBranch,
} from "lucide-react";
import type { ToastNotification } from "../lib/types";

export interface ToastProps {
  notification: ToastNotification | null;
  onClose: () => void;
}

/**
 * Parses and formats description text to highlight addresses, selectors, PR tags,
 * and backtick code spans with macOS monospace pills.
 */
function formatMonospaceHighlights(text: string): React.ReactNode[] {
  // If text contains backticks, split by backticks
  if (text.includes("`")) {
    const segments = text.split(/(`[^`]+`)/g);
    return segments.map((seg, idx) => {
      if (seg.startsWith("`") && seg.endsWith("`")) {
        return (
          <code
            key={idx}
            className="font-mono text-emerald-300 bg-white/[0.08] px-1 py-0.5 rounded text-[11px] border border-white/10"
          >
            {seg.slice(1, -1)}
          </code>
        );
      }
      return <span key={idx}>{seg}</span>;
    });
  }

  // Otherwise scan for hex addresses/hashes (0x...) or PR identifiers (#42)
  const regex = /(\b0x[a-fA-F0-9]{4,}\b|#\d+\b)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (/^0x[a-fA-F0-9]{4,}$/.test(part) || /^#\d+$/.test(part)) {
      return (
        <code
          key={idx}
          className="font-mono text-cyan-300 bg-white/[0.08] px-1 py-0.5 rounded text-[11px] border border-white/10"
        >
          {part}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export function Toast({ notification, onClose }: ToastProps) {
  const [isPaused, setIsPaused] = useState(false);
  const remainingTimeRef = useRef<number>(3500);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const duration = notification?.duration ?? 3500;

  // Set up auto-dismiss timer with pause on hover
  useEffect(() => {
    if (!notification) return;

    remainingTimeRef.current = notification.duration ?? 3500;
    startTimeRef.current = Date.now();

    const startTimer = () => {
      timerRef.current = setTimeout(() => {
        onClose();
      }, remainingTimeRef.current);
    };

    if (!isPaused) {
      startTimer();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notification, isPaused, onClose]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(200, remainingTimeRef.current - elapsed);
    }
  };

  const handleMouseLeave = () => {
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  if (!notification) return null;

  const type = notification.type || "info";

  // Visual styling variants per type
  const config = {
    success: {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-400 stroke-[2.2]" />,
      iconBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      accentBorder: "border-emerald-500/30 hover:border-emerald-500/50",
      progressBar: "bg-gradient-to-r from-emerald-500 to-cyan-400",
      glow: "shadow-emerald-500/10",
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5 text-amber-400 stroke-[2.2]" />,
      iconBg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      accentBorder: "border-amber-500/30 hover:border-amber-500/50",
      progressBar: "bg-gradient-to-r from-amber-500 to-orange-400",
      glow: "shadow-amber-500/10",
    },
    error: {
      icon: <ShieldAlert className="h-5 w-5 text-rose-400 stroke-[2.2]" />,
      iconBg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
      accentBorder: "border-rose-500/30 hover:border-rose-500/50",
      progressBar: "bg-gradient-to-r from-rose-500 to-red-400",
      glow: "shadow-rose-500/10",
    },
    info: {
      icon: <Info className="h-5 w-5 text-cyan-400 stroke-[2.2]" />,
      iconBg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
      accentBorder: "border-cyan-500/30 hover:border-cyan-500/50",
      progressBar: "bg-gradient-to-r from-cyan-500 to-blue-400",
      glow: "shadow-cyan-500/10",
    },
  }[type];

  return (
    <div
      className="fixed top-5 right-5 sm:top-6 sm:right-6 z-50 max-w-sm w-full pointer-events-none"
      role="region"
      aria-live="polite"
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`pointer-events-auto relative w-full macos-glass bg-[#161b22]/90 backdrop-blur-2xl border ${config.accentBorder} rounded-2xl p-4 shadow-2xl ${config.glow} transition-all duration-300 ease-out transform translate-y-0 opacity-100 select-none overflow-hidden group`}
      >
        {/* Top Header: macOS Notification App Header */}
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
          <div className="flex items-center gap-1.5 font-medium">
            <div className="h-4 w-4 rounded-md bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-[9px] font-bold text-black shadow-sm shadow-emerald-500/20">
              <GitBranch className="h-2.5 w-2.5 text-black stroke-[3]" />
            </div>
            <span className="text-zinc-200 font-semibold tracking-tight text-[11px]">
              SolGit
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[10px] text-zinc-400">now</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition p-1 rounded-md hover:bg-white/10"
            title="Dismiss notification"
            aria-label="Close notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content Body: Left Indicator Icon + Title & Description */}
        <div className="flex items-start gap-3">
          <div
            className={`h-8 w-8 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${config.iconBg}`}
          >
            {config.icon}
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs sm:text-sm font-semibold text-zinc-100 tracking-tight leading-snug">
              {notification.title}
            </h4>
            {notification.description && (
              <div className="text-[11px] text-zinc-400 mt-1 leading-relaxed break-words">
                {formatMonospaceHighlights(notification.description)}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="h-0.5 w-full bg-white/[0.06] mt-3 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.progressBar}`}
            style={{
              animation: `toast-shrink ${duration}ms linear forwards`,
              animationPlayState: isPaused ? "paused" : "running",
            }}
          />
        </div>
      </div>
    </div>
  );
}
