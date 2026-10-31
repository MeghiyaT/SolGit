"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  Shield,
  Layers,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import {
  MST_FAUCET_URL,
  MST_EXPLORER_URL,
  getMSTChainConfig,
} from "../../lib/mstChain";
import { CONTRACTS } from "../../lib/data";
import { useWeb3Wallet } from "../../hooks/useWeb3Wallet";

export interface RightSidebarProps {
  onCopyAddress?: (text: string, label?: string) => void;
}

export function RightSidebar({ onCopyAddress }: RightSidebarProps) {
  const { chainId } = useWeb3Wallet();
  const activeConfig = getMSTChainConfig(chainId);

  const [copiedRpc, setCopiedRpc] = useState(false);
  const [copiedRouter, setCopiedRouter] = useState(false);

  const handleCopyRpc = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(activeConfig.rpcUrl).catch(() => {});
    }
    setCopiedRpc(true);
    onCopyAddress?.(activeConfig.rpcUrl, "RPC URL");
    setTimeout(() => setCopiedRpc(false), 2000);
  };

  const handleCopyRouter = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(CONTRACTS.router).catch(() => {});
    }
    setCopiedRouter(true);
    onCopyAddress?.(CONTRACTS.router, "Diamond Router");
    setTimeout(() => setCopiedRouter(false), 2000);
  };

  return (
    <aside className="space-y-6 text-xs text-[#c9d1d9]" aria-label="Right Sidebar">
      {/* ─────────────────────────────────────────────────────────────
          MST Blockchain Status Card
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#161b22] border border-[#30363d] overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-[#30363d] bg-[#0d1117]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-xs text-[#f0f6fc]">MST Network Status</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
            SYNCED
          </span>
        </div>

        <div className="p-4 space-y-3">
          {/* Chain & Currency */}
          <div className="flex items-center justify-between">
            <span className="text-[#8b949e]">Chain ID</span>
            <span className="font-mono text-[#f0f6fc] font-semibold">{activeConfig.id}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#8b949e]">Network</span>
            <span className="font-mono text-emerald-400 font-semibold">{activeConfig.name}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#8b949e]">Currency</span>
            <span className="font-mono text-emerald-400 font-semibold">tMSTC (18 Decimals)</span>
          </div>

          {/* RPC URL */}
          <div className="pt-2 border-t border-[#30363d] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#8b949e]">RPC Endpoint</span>
              <button
                type="button"
                onClick={handleCopyRpc}
                className="text-[10px] text-[#8b949e] hover:text-[#f0f6fc] flex items-center gap-1 cursor-pointer"
              >
                {copiedRpc ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedRpc ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <code className="block p-1.5 rounded bg-[#0d1117] border border-[#30363d] text-[10px] text-[#c9d1d9] truncate font-mono select-all">
              {activeConfig.rpcUrl}
            </code>
          </div>

          {/* Diamond Router Address */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#8b949e]">Diamond Router</span>
              <button
                type="button"
                onClick={handleCopyRouter}
                className="text-[10px] text-[#8b949e] hover:text-[#f0f6fc] flex items-center gap-1 cursor-pointer"
              >
                {copiedRouter ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedRouter ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <code className="block p-1.5 rounded bg-[#0d1117] border border-[#30363d] text-[10px] text-[#c9d1d9] truncate font-mono select-all">
              {CONTRACTS.router}
            </code>
          </div>

          {/* Security Features */}
          <div className="pt-2 border-t border-[#30363d] space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-[11px] font-medium">SolGit Guardian Protection: Active</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-400">
              <Layers className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-[11px] font-medium">EIP-2535 Diamond Proxy: Operational</span>
            </div>
          </div>

          {/* External Links */}
          <div className="pt-2 border-t border-[#30363d] space-y-1.5">
            <a
              href={MST_FAUCET_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between text-[#8b949e] hover:text-emerald-400 transition"
            >
              <span>MST Testnet Faucet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={MST_EXPLORER_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between text-[#8b949e] hover:text-[#58a6ff] transition"
            >
              <span>MST Block Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          Latest From Changelog
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#161b22] border border-[#30363d] overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-[#30363d] bg-[#0d1117]/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-[#f0f6fc]">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Latest from changelog</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <article className="space-y-1">
            <span className="text-[10px] text-[#8b949e] font-mono">October 30, 2026</span>
            <h3 className="text-xs font-semibold text-[#f0f6fc] hover:text-[#58a6ff] transition cursor-pointer">
              SolGit GitHub Platform & Strict Web3 Wallet
            </h3>
            <p className="text-[11px] text-[#8b949e] leading-relaxed">
              Full GitHub dashboard interface, strict browser EVM wallet integration via viem, and instant Diamond smart contract uploader.
            </p>
          </article>

          <article className="space-y-1 pt-3 border-t border-[#30363d]">
            <span className="text-[10px] text-[#8b949e] font-mono">October 28, 2026</span>
            <h3 className="text-xs font-semibold text-[#f0f6fc] hover:text-[#58a6ff] transition cursor-pointer">
              EIP-2535 Diamond Loupe & Automated Inspection
            </h3>
            <p className="text-[11px] text-[#8b949e] leading-relaxed">
              Live selector introspection directly from on-chain DiamondLoupeFacet on MST Blockchain.
            </p>
          </article>

          <article className="space-y-1 pt-3 border-t border-[#30363d]">
            <span className="text-[10px] text-[#8b949e] font-mono">October 26, 2026</span>
            <h3 className="text-xs font-semibold text-[#f0f6fc] hover:text-[#58a6ff] transition cursor-pointer">
              SolGit Guardian Invariant Circuit Breaker
            </h3>
            <p className="text-[11px] text-[#8b949e] leading-relaxed">
              Sub-second vulnerability detection and automated rollback to stable bytecode commits.
            </p>
          </article>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          Footer Links
          ───────────────────────────────────────────────────────────── */}
      <footer className="pt-2 text-[11px] text-[#8b949e] space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <a href="https://eips.ethereum.org/EIPS/eip-2535" target="_blank" rel="noreferrer" className="hover:text-[#58a6ff] transition">
            EIP-2535
          </a>
          <span>•</span>
          <a href={MST_EXPLORER_URL} target="_blank" rel="noreferrer" className="hover:text-[#58a6ff] transition">
            Explorer
          </a>
          <span>•</span>
          <a href={MST_FAUCET_URL} target="_blank" rel="noreferrer" className="hover:text-[#58a6ff] transition">
            Faucet
          </a>
          <span>•</span>
          <span className="text-zinc-600">SolGit v1.2</span>
        </div>
        <p className="text-zinc-600 text-[10px]">
          &copy; 2026 SolGit Protocol. Powered by MST Blockchain.
        </p>
      </footer>
    </aside>
  );
}
