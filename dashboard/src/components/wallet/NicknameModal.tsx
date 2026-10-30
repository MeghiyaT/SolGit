"use client";

import React, { useState } from "react";
import { User, Sparkles, Check, AlertCircle, Loader2, X } from "lucide-react";
import { formatAddress } from "../../lib/mstChain";

export interface NicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  currentNickname?: string | null;
  onSave: (nickname: string) => void;
  isDismissable?: boolean;
}

export function NicknameModal({
  isOpen,
  onClose,
  address,
  currentNickname = "",
  onSave,
  isDismissable = true,
}: NicknameModalProps) {
  const [nickname, setNickname] = useState(currentNickname || "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prevOpen, setPrevOpen] = useState(isOpen);

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setNickname(currentNickname || "");
      setError(null);
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const validate = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return "Nickname cannot be empty.";
    if (trimmed.length < 2) return "Nickname must be at least 2 characters.";
    if (trimmed.length > 24) return "Nickname cannot exceed 24 characters.";
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return "Only letters, numbers, hyphens, and underscores are allowed.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valErr = validate(nickname);
    if (valErr) {
      setError(valErr);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          nickname: nickname.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save nickname");
      }

      onSave(nickname.trim());
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error saving nickname";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nickname-modal-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="nickname-modal-title" className="text-sm font-semibold text-[#f0f6fc]">
                {currentNickname ? "Update Developer Nickname" : "Welcome to SolGit!"}
              </h2>
              <p className="text-[11px] text-[#8b949e]">
                Connected as <span className="font-mono text-[#c9d1d9]">{formatAddress(address, 6, 4)}</span>
              </p>
            </div>
          </div>
          {isDismissable && (
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-[#8b949e] hover:text-[#f0f6fc] p-1 rounded-md transition hover:bg-[#21262d] cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-[#8b949e] leading-relaxed">
            Choose a developer nickname for your BridgeKey account. This identity will be displayed on your contracts, repositories, and activity on the MST Coral Testnet.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="nickname-input" className="block text-xs font-medium text-[#c9d1d9]">
              Developer Nickname
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8b949e]">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                id="nickname-input"
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. satoshi_mst"
                autoFocus
                disabled={isSubmitting}
                maxLength={24}
                className={`w-full pl-9 pr-3 py-2 rounded-md bg-[#0d1117] border text-xs text-[#f0f6fc] placeholder-[#8b949e] outline-none transition ${
                  error
                    ? "border-rose-500/60 focus:border-rose-400"
                    : "border-[#30363d] focus:border-[#58a6ff]"
                }`}
              />
            </div>
            {error && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            {isDismissable && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-md border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#c9d1d9] transition cursor-pointer"
              >
                Skip for now
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !nickname.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition shadow-sm border border-[#2ea043]/30 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Nickname</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
