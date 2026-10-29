"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Cpu,
  Layers,
  Copy,
  Check,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronUp,
  Terminal,
  Database,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Hash,
  Clock,
  Zap,
  Play,
  RotateCcw,
  FileCode,
  Boxes,
} from "lucide-react";
import {
  CONTRACTS,
  type SelectorFeature,
} from "../../lib/data";

// ─────────────────────────────────────────────────────────────
// Component Props Interface
// ─────────────────────────────────────────────────────────────
export interface LoupeTabProps {
  selectors: SelectorFeature[];
  onCopy?: (val: string, label?: string) => void;
  onActionToast?: (msg: string) => void;
}

// ─────────────────────────────────────────────────────────────
// Core Contract Definition
// ─────────────────────────────────────────────────────────────
interface CoreContract {
  id: string;
  name: string;
  role: string;
  badge: string;
  badgeColor: "emerald" | "cyan" | "purple" | "rose";
  address: string;
  type: string;
  description: string;
  storagePattern: string;
  storageSlot?: string;
  gasProfile: string;
  isImmutable: boolean;
  statusText?: string;
  statusType?: "active" | "quarantined" | "stable";
}

// ─────────────────────────────────────────────────────────────
// EIP-2535 Loupe Method Definition
// ─────────────────────────────────────────────────────────────
type LoupeMethodId = "facets" | "facetFunctionSelectors" | "facetAddresses" | "facetAddress";

interface LoupeMethodSpec {
  id: LoupeMethodId;
  name: string;
  signature: string;
  selector: string;
  summary: string;
  description: string;
  returnType: string;
}

const LOUPE_METHODS: LoupeMethodSpec[] = [
  {
    id: "facets",
    name: "facets()",
    signature: "function facets() external view returns (Facet[] memory facets_)",
    selector: "0x7a0ed627",
    summary: "Inspects all facet addresses and their respective four-byte function selectors.",
    description: "Returns an array of structs containing each facet address and all function selectors that delegatecall to that facet.",
    returnType: "tuple(address facetAddress, bytes4[] functionSelectors)[]",
  },
  {
    id: "facetFunctionSelectors",
    name: "facetFunctionSelectors(facet)",
    signature: "function facetFunctionSelectors(address _facet) external view returns (bytes4[] memory facetFunctionSelectors_)",
    selector: "0xadfaf29f",
    summary: "Queries all selectors routed to a specific facet implementation.",
    description: "Returns an array of 4-byte selectors associated with the specified facet contract address.",
    returnType: "bytes4[]",
  },
  {
    id: "facetAddresses",
    name: "facetAddresses()",
    signature: "function facetAddresses() external view returns (address[] memory facetAddresses_)",
    selector: "0x52ef6b2c",
    summary: "Lists all unique facet addresses registered in the Diamond.",
    description: "Returns an array of all facet addresses currently wired into the Diamond's selector routing map.",
    returnType: "address[]",
  },
  {
    id: "facetAddress",
    name: "facetAddress(selector)",
    signature: "function facetAddress(bytes4 _functionSelector) external view returns (address facetAddress_)",
    selector: "0xcdffacc6",
    summary: "Resolves the destination facet address for a single 4-byte selector.",
    description: "Looks up the Diamond storage routing slot to return the exact facet executed when this selector is invoked.",
    returnType: "address",
  },
];

// Helper: Format relative timestamp safely
function formatTimeAgo(timestamp: number | string): string {
  if (typeof timestamp === "string") return timestamp;
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);
  if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  return `${diffDays}d ago`;
}

// ─────────────────────────────────────────────────────────────
// Diamond Loupe Tab Component
// ─────────────────────────────────────────────────────────────
export function LoupeTab({ selectors, onCopy, onActionToast }: LoupeTabProps) {
  // Local state for copy indicator: key => timeout
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Search & Filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Stable" | "Active" | "Quarantined">("all");

  // Expanded selector rows for commit history drilldown
  const [expandedSelectors, setExpandedSelectors] = useState<Record<string, boolean>>({
    "0x2e1a7d4d": true, // Default open withdraw to highlight rollback/quarantine
  });

  // Active Loupe Method Simulation Tab
  const [activeMethod, setActiveMethod] = useState<LoupeMethodId>("facets");
  const [selectedFacetForQuery, setSelectedFacetForQuery] = useState<string>(CONTRACTS.vaultV1);
  const [selectedSelectorForQuery, setSelectedSelectorForQuery] = useState<string>("0x2e1a7d4d");
  const [isSimulatingRpc, setIsSimulatingRpc] = useState(false);
  const [simulatedExecutionTime, setSimulatedExecutionTime] = useState<number | null>(null);

  // Storage Layout Active View Tab
  const [storageView, setStorageView] = useState<"diamond" | "vault" | "guardian">("diamond");

  // Quick copy handler with checkmark feedback
  const handleCopy = useCallback(
    (text: string, key: string, label?: string) => {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(text);
      }
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((curr) => (curr === key ? null : curr));
      }, 1800);

      if (onCopy) {
        onCopy(text, label);
      } else if (onActionToast) {
        onActionToast(`Copied ${label || text.slice(0, 10)} to clipboard`);
      }
    },
    [onCopy, onActionToast]
  );

  // Toggle selector history expansion
  const toggleSelectorExpand = (selectorHex: string) => {
    setExpandedSelectors((prev) => ({
      ...prev,
      [selectorHex]: !prev[selectorHex],
    }));
  };

  // Determine current active commit & facet implementation for each selector
  const enrichedSelectors = useMemo(() => {
    return selectors.map((s) => {
      const activeCommit =
        s.history.find((h) => h.version === s.currentVersion) ||
        s.history[s.history.length - 1];

      const stableCommit =
        s.history.find((h) => h.version === s.stableVersion) || s.history[0];

      const status = activeCommit ? activeCommit.status : "Stable";
      const targetFacet = activeCommit
        ? activeCommit.implementation
        : CONTRACTS.vaultV1;

      return {
        ...s,
        activeCommit,
        stableCommit,
        status,
        targetFacet,
      };
    });
  }, [selectors]);

  // Check if VaultV2 is currently quarantined in any selector
  const isVaultV2Quarantined = useMemo(() => {
    return enrichedSelectors.some((s) =>
      s.history.some(
        (h) =>
          h.implementation.toLowerCase() === CONTRACTS.vaultV2.toLowerCase() &&
          h.status === "Quarantined"
      )
    );
  }, [enrichedSelectors]);

  // Core Contract Directory List
  const coreContracts = useMemo<CoreContract[]>(() => {
    return [
      {
        id: "diamond",
        name: "SolGitDiamond (Master Proxy)",
        role: "Permanent User Entry Point / Routing Engine",
        badge: "EIP-2535 Router",
        badgeColor: "emerald",
        address: CONTRACTS.diamond,
        type: "Master Proxy",
        description:
          "Permanent on-chain address for all client interactions. Dispatches function calls to registered facets using delegatecall while maintaining persistent state.",
        storagePattern: "Diamond Storage (bytes32 slot isolated)",
        storageSlot: "0xc8fcad8db84d3cc18b4c41d551ea0ee66dd599c9a67d153f4b0f8f17a238b819",
        gasProfile: "~1,800 gas routing overhead for slot lookup + delegatecall",
        isImmutable: true,
        statusText: "Operational",
        statusType: "stable",
      },
      {
        id: "registry",
        name: "VersionRegistry (Lifecycle Ledger)",
        role: "Per-Selector Version History & Commit Ledger",
        badge: "Lifecycle Ledger",
        badgeColor: "cyan",
        address: CONTRACTS.registry,
        type: "State Registry",
        description:
          "Tracks commit history, code hashes, authors, and active/stable indices for every 4-byte selector. Governs rollback authorization.",
        storagePattern: "Direct contract storage mappings (_history, _activeIndex)",
        gasProfile: "~5,000 gas per metadata lookup",
        isImmutable: true,
        statusText: "Synchronized",
        statusType: "stable",
      },
      {
        id: "guardian",
        name: "SolGitGuardianFacet (Emergency Guard)",
        role: "Autonomous Defense & Emergency Rollback",
        badge: "Defense Facet",
        badgeColor: "purple",
        address: CONTRACTS.guardian,
        type: "Security Facet",
        description:
          "Restricted circuit breaker permitting authorized Watcher/Sentinel AI agents to execute atomic zero-downtime rollbacks when invariant violations occur.",
        storagePattern: "Diamond Storage shared security slots",
        storageSlot: "0x6a7cc7e4... (emergency circuit slot)",
        gasProfile: "Gas-optimized atomic rollback (under 45,000 gas)",
        isImmutable: false,
        statusText: "Armed & Watching",
        statusType: "stable",
      },
      {
        id: "vaultV1",
        name: "VaultV1 (Initial Stable Vault)",
        role: "Safe Baseline Implementation",
        badge: "Stable Baseline",
        badgeColor: "emerald",
        address: CONTRACTS.vaultV1,
        type: "Facet Implementation",
        description:
          "Initial safe implementation of deposit, withdraw, transfer, and balanceOf with Check-Effects-Interactions and standard balance assertions.",
        storagePattern: "VaultStorage AppStorage layout slot",
        storageSlot: "0x89d24a7320b5711b730f51952f447714041e2a049d5c41743f5adccbdfca3468",
        gasProfile: "Standard EVM execution (CEI checks enabled)",
        isImmutable: false,
        statusText: "Stable Reference",
        statusType: "stable",
      },
      {
        id: "vaultV2",
        name: "VaultV2 (Active / Quarantined)",
        role: "Gas-Optimized Implementation",
        badge: isVaultV2Quarantined ? "Quarantined Version" : "Active Facet",
        badgeColor: isVaultV2Quarantined ? "rose" : "cyan",
        address: CONTRACTS.vaultV2,
        type: "Facet Implementation",
        description:
          "High-throughput facet featuring unchecked arithmetic optimizations in withdraw(). Quarantined automatically by Guardian upon underflow attack.",
        storagePattern: "VaultStorage AppStorage layout slot",
        storageSlot: "0x89d24a7320b5711b730f51952f447714041e2a049d5c41743f5adccbdfca3468",
        gasProfile: "Reduced gas usage via unchecked loops (underflow risk)",
        isImmutable: false,
        statusText: isVaultV2Quarantined ? "Quarantined by Sentinel" : "Active Routing",
        statusType: isVaultV2Quarantined ? "quarantined" : "active",
      },
    ];
  }, [isVaultV2Quarantined]);

  // Filtered Selectors based on search and status
  const filteredSelectors = useMemo(() => {
    return enrichedSelectors.filter((s) => {
      // Status filter
      if (statusFilter !== "all" && s.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesSig = s.signature.toLowerCase().includes(query);
        const matchesSelector = s.selector.toLowerCase().includes(query);
        const matchesFacet = s.targetFacet.toLowerCase().includes(query);
        const matchesDesc = s.description.toLowerCase().includes(query);
        return matchesName || matchesSig || matchesSelector || matchesFacet || matchesDesc;
      }
      return true;
    });
  }, [enrichedSelectors, statusFilter, searchQuery]);

  // Status counts for filter pills
  const statusCounts = useMemo(() => {
    let stable = 0;
    let active = 0;
    let quarantined = 0;
    for (const s of enrichedSelectors) {
      if (s.status === "Stable") stable++;
      else if (s.status === "Active") active++;
      else if (s.status === "Quarantined") quarantined++;
    }
    return {
      all: enrichedSelectors.length,
      Stable: stable,
      Active: active,
      Quarantined: quarantined,
    };
  }, [enrichedSelectors]);

  // Generate dynamic Cast CLI command for the selected Loupe method
  const currentCastCommand = useMemo(() => {
    const diamond = CONTRACTS.diamond;
    const rpc = CONTRACTS.rpcUrl;

    switch (activeMethod) {
      case "facets":
        return `cast call ${diamond} "facets()((address,bytes4[])[])" --rpc-url ${rpc}`;
      case "facetFunctionSelectors":
        return `cast call ${diamond} "facetFunctionSelectors(address)(bytes4[])" ${selectedFacetForQuery} --rpc-url ${rpc}`;
      case "facetAddresses":
        return `cast call ${diamond} "facetAddresses()(address[])" --rpc-url ${rpc}`;
      case "facetAddress":
        return `cast call ${diamond} "facetAddress(bytes4)(address)" ${selectedSelectorForQuery} --rpc-url ${rpc}`;
    }
  }, [activeMethod, selectedFacetForQuery, selectedSelectorForQuery]);

  // Generate dynamic Decoded Output for the selected Loupe method based on live selectors
  const simulatedDecodedOutput = useMemo(() => {
    switch (activeMethod) {
      case "facets": {
        // Group selectors by current active target facet
        const facetGroups: Record<string, string[]> = {};
        for (const s of enrichedSelectors) {
          const facet = s.targetFacet;
          if (!facetGroups[facet]) {
            facetGroups[facet] = [];
          }
          facetGroups[facet].push(s.selector);
        }
        // Always include Guardian facet
        if (!facetGroups[CONTRACTS.guardian]) {
          facetGroups[CONTRACTS.guardian] = ["0x4e6b5270"];
        }

        const facetsArray = Object.entries(facetGroups).map(([address, sels]) => {
          let label = "Unknown Facet";
          if (address.toLowerCase() === CONTRACTS.vaultV1.toLowerCase()) label = "VaultV1 (Initial Stable Vault)";
          else if (address.toLowerCase() === CONTRACTS.vaultV2.toLowerCase()) label = "VaultV2 (Active / Quarantined)";
          else if (address.toLowerCase() === CONTRACTS.guardian.toLowerCase()) label = "SolGitGuardianFacet (Defense)";
          else if (address.startsWith("0xb1C88970")) label = "VaultV2Fixed (AI Patch)";

          return {
            facetAddress: address,
            label,
            functionSelectors: sels,
          };
        });

        return JSON.stringify(facetsArray, null, 2);
      }

      case "facetFunctionSelectors": {
        const matching = enrichedSelectors.filter(
          (s) => s.targetFacet.toLowerCase() === selectedFacetForQuery.toLowerCase()
        );
        let list: string[] = matching.map((s) => s.selector);
        if (selectedFacetForQuery.toLowerCase() === CONTRACTS.guardian.toLowerCase()) {
          list = ["0x4e6b5270"];
        }
        return JSON.stringify(list, null, 2);
      }

      case "facetAddresses": {
        const uniqueAddresses = Array.from(
          new Set([
            ...enrichedSelectors.map((s) => s.targetFacet),
            CONTRACTS.guardian,
          ])
        );
        return JSON.stringify(uniqueAddresses, null, 2);
      }

      case "facetAddress": {
        const matched = enrichedSelectors.find(
          (s) => s.selector.toLowerCase() === selectedSelectorForQuery.toLowerCase()
        );
        const resolvedAddress = matched ? matched.targetFacet : CONTRACTS.vaultV1;
        return JSON.stringify(
          {
            selector: selectedSelectorForQuery,
            facetAddress: resolvedAddress,
            matchedFunction: matched ? matched.signature : "unknown",
            activeVersion: matched ? matched.currentVersion : 1,
            lifecycleStatus: matched ? matched.status : "Stable",
          },
          null,
          2
        );
      }
    }
  }, [activeMethod, enrichedSelectors, selectedFacetForQuery, selectedSelectorForQuery]);

  // Handle Simulated RPC Execution click
  const handleSimulateRpc = () => {
    setIsSimulatingRpc(true);
    setSimulatedExecutionTime(null);
    setTimeout(() => {
      setIsSimulatingRpc(false);
      setSimulatedExecutionTime(Math.floor(180 + Math.random() * 80));
      if (onActionToast) {
        onActionToast(`EIP-2535 ${activeMethod}() query executed on MST Blockchain`);
      }
    }, 450);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-zinc-100">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & STATUS OVERVIEW
          ───────────────────────────────────────────────────────────── */}
      <section className="relative rounded-2xl p-6 sm:p-8 overflow-hidden border border-white/[0.08] bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117] shadow-2xl">
        {/* Ambient atmospheric glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* EIP-2535 Standard Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>EIP-2535 Diamond Standard</span>
              </div>

              {/* Network Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>MST Blockchain Testnet (Chain ID {CONTRACTS.chainId})</span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">~3s Block Time</span>
              </div>

              {/* Compliance Pill */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Loupe Verified 100%</span>
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <span className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-400 shadow-inner">
                  <Layers className="w-6 h-6 sm:w-7 sm:h-7" />
                </span>
                EIP-2535 Diamond Loupe &amp; Routing Matrix
              </h1>
              <p className="mt-2 text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
                Real-time on-chain introspection of function selectors, facet delegatecall targets, and storage layout. SolGit implements the complete EIP-2535 Diamond Loupe interface on the MST Blockchain testnet with zero-downtime version switching.
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] backdrop-blur-sm">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Selectors</div>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-0.5">{selectors.length}</div>
              <div className="text-[11px] text-zinc-500">4-byte mappings</div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] backdrop-blur-sm">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Facets</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">3</div>
              <div className="text-[11px] text-zinc-500">Target implementations</div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] backdrop-blur-sm">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Storage Slots</div>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-0.5">Isolated</div>
              <div className="text-[11px] text-zinc-500">0 Collisions</div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] backdrop-blur-sm">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Defense</div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">Armed</div>
              <div className="text-[11px] text-zinc-500">Guardian circuit</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. CORE CONTRACT DIRECTORY CARDS
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-emerald-400" />
              Core Contract Directory
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Verified on-chain contract deployments on MST Blockchain Testnet with one-click copy and explorer tracking.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06] self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>RPC: testnetrpc.mstblockchain.com</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreContracts.map((contract) => {
            const isCopied = copiedKey === `contract-${contract.id}`;
            const isQuarantined = contract.statusType === "quarantined";

            return (
              <div
                key={contract.id}
                className={`relative group rounded-xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                  isQuarantined
                    ? "bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50 shadow-lg shadow-rose-950/20"
                    : "bg-[#161b22]/80 hover:bg-[#161b22] border-white/[0.08] hover:border-white/20 shadow-lg"
                }`}
              >
                {/* Header of Card */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider ${
                            contract.badgeColor === "emerald"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : contract.badgeColor === "cyan"
                              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                              : contract.badgeColor === "purple"
                              ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                              : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {contract.badge}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {contract.type}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {contract.name}
                      </h3>
                    </div>

                    {/* Status Pill */}
                    <div
                      className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isQuarantined
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {isQuarantined ? (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>QUARANTINED</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ACTIVE</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    {contract.description}
                  </p>

                  {/* Storage and Gas metadata */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-black/40 border border-white/[0.06] mb-4 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Database className="w-3 h-3" /> Storage:
                      </span>
                      <span className="text-zinc-300 truncate max-w-[190px]" title={contract.storagePattern}>
                        {contract.storagePattern.split("(")[0]}
                      </span>
                    </div>
                    {contract.storageSlot && (
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-zinc-500 flex items-center gap-1">
                          <Hash className="w-3 h-3" /> Slot:
                        </span>
                        <span className="text-purple-300 font-mono">
                          {contract.storageSlot.slice(0, 10)}...{contract.storageSlot.slice(-6)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Gas Profile:
                      </span>
                      <span className="text-zinc-300 truncate max-w-[180px]">
                        {contract.gasProfile.split("(")[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Address with Copy and MSTScan Explorer button */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-300 bg-white/[0.04] px-2.5 py-1.5 rounded-lg border border-white/[0.06] truncate flex-1">
                    <span className="text-zinc-500">addr:</span>
                    <span className="truncate" title={contract.address}>
                      {contract.address.slice(0, 8)}...{contract.address.slice(-6)}
                    </span>
                  </div>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(contract.address, `contract-${contract.id}`, contract.name)}
                    title="Copy full contract address"
                    className={`p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      isCopied
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-zinc-300 hover:text-white"
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline text-[11px] font-mono">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px] font-mono">Copy</span>
                      </>
                    )}
                  </button>

                  {/* Explorer Link Button */}
                  <a
                    href={`${CONTRACTS.explorer}/address/${contract.address}`}
                    target="_blank"
                    rel="noreferrer"
                    title="View on MSTScan Explorer"
                    className="p-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px] font-mono">Explorer</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. SELECTOR-TO-FACET ROUTING MATRIX TABLE
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              Selector-to-Facet Routing Matrix
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Live mapping of 4-byte EVM function selectors to delegatecall target facet contracts, active version commits, and lifecycle status.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Pills */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#161b22] border border-white/[0.08] text-xs">
              {(["all", "Stable", "Active", "Quarantined"] as const).map((filterVal) => {
                const count = statusCounts[filterVal];
                const isActive = statusFilter === filterVal;
                return (
                  <button
                    key={filterVal}
                    type="button"
                    onClick={() => setStatusFilter(filterVal)}
                    className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? "bg-white/[0.1] text-white shadow-sm font-semibold"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <span className="capitalize">{filterVal}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        filterVal === "Quarantined" && count > 0
                          ? "bg-rose-500/20 text-rose-300 font-bold"
                          : isActive
                          ? "bg-white/10 text-white"
                          : "bg-white/[0.04] text-zinc-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input Box */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search selector or function..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161b22] border border-white/[0.08] focus:border-cyan-400/50 rounded-lg pl-9 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Matrix Table Container */}
        <div className="rounded-xl border border-white/[0.08] bg-[#161b22]/90 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-black/40 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Function &amp; Signature</th>
                  <th className="py-3 px-4">4-Byte Selector</th>
                  <th className="py-3 px-4">Target Facet Address</th>
                  <th className="py-3 px-3 text-center">Active Ver</th>
                  <th className="py-3 px-3 text-center">Stable Ver</th>
                  <th className="py-3 px-4 text-center">Lifecycle Status</th>
                  <th className="py-3 px-4 text-center">History</th>
                  <th className="py-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredSelectors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500 font-mono">
                      No function selectors matched the current filter criteria (&quot;{searchQuery}&quot;).
                    </td>
                  </tr>
                ) : (
                  filteredSelectors.map((item) => {
                    const isExpanded = !!expandedSelectors[item.selector];
                    const isSelectorCopied = copiedKey === `sel-${item.selector}`;
                    const isFacetCopied = copiedKey === `facet-${item.selector}`;
                    const isQuarantined = item.status === "Quarantined";

                    // Determine human-friendly facet name
                    let facetLabel = "VaultV1";
                    if (item.targetFacet.toLowerCase() === CONTRACTS.vaultV2.toLowerCase()) {
                      facetLabel = "VaultV2";
                    } else if (item.targetFacet.toLowerCase() === CONTRACTS.guardian.toLowerCase()) {
                      facetLabel = "Guardian";
                    } else if (item.targetFacet.startsWith("0xb1C88970")) {
                      facetLabel = "VaultV2Fixed (v3)";
                    }

                    return (
                      <React.Fragment key={item.selector}>
                        <tr
                          onClick={() => toggleSelectorExpand(item.selector)}
                          className={`group hover:bg-white/[0.03] transition-colors cursor-pointer ${
                            isExpanded ? "bg-white/[0.02]" : ""
                          }`}
                        >
                          {/* Function Name & Signature */}
                          <td className="py-3.5 px-4 font-sans">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`p-1.5 rounded-md border ${
                                  isQuarantined
                                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                    : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                                }`}
                              >
                                <FileCode className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                                  <span>{item.name}</span>
                                </div>
                                <div className="text-[11px] font-mono text-zinc-400 truncate max-w-[200px] sm:max-w-xs">
                                  {item.signature}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 4-Byte Selector */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="inline-flex items-center gap-1.5 bg-black/40 border border-white/10 px-2.5 py-1 rounded-md">
                              <span className="text-cyan-300 font-semibold">{item.selector}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(item.selector, `sel-${item.selector}`, `Selector ${item.selector}`);
                                }}
                                title="Copy 4-byte selector"
                                className="text-zinc-400 hover:text-white transition p-0.5 rounded cursor-pointer"
                              >
                                {isSelectorCopied ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Target Facet Address */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2 py-1 rounded-md text-zinc-300">
                                <span className="text-[10px] uppercase font-bold text-zinc-400">
                                  {facetLabel}:
                                </span>
                                <span title={item.targetFacet}>
                                  {item.targetFacet.slice(0, 6)}...{item.targetFacet.slice(-4)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(item.targetFacet, `facet-${item.selector}`, `${facetLabel} Address`);
                                }}
                                title="Copy target facet address"
                                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.05] transition cursor-pointer"
                              >
                                {isFacetCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <a
                                href={`${CONTRACTS.explorer}/address/${item.targetFacet}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="View on MSTScan Explorer"
                                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.05] transition cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>

                          {/* Active Version */}
                          <td className="py-3.5 px-3 text-center font-mono">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                item.currentVersion === 3
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : item.currentVersion === 2
                                  ? isQuarantined
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              }`}
                            >
                              v{item.currentVersion}
                            </span>
                          </td>

                          {/* Stable Version */}
                          <td className="py-3.5 px-3 text-center font-mono">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              v{item.stableVersion}
                            </span>
                          </td>

                          {/* Lifecycle Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold ${
                                item.status === "Stable"
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : item.status === "Active"
                                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                                  : "bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse"
                              }`}
                            >
                              {item.status === "Stable" ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              ) : item.status === "Active" ? (
                                <Zap className="w-3 h-3 text-cyan-400" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                              )}
                              <span>{item.status}</span>
                            </span>
                          </td>

                          {/* Registered History Count */}
                          <td className="py-3.5 px-4 text-center font-mono text-zinc-400">
                            <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[11px] border border-white/[0.06]">
                              {item.history.length} {item.history.length === 1 ? "commit" : "commits"}
                            </span>
                          </td>

                          {/* Expand Row Indicator */}
                          <td className="py-3.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectorExpand(item.selector);
                              }}
                              className="p-1 rounded text-zinc-400 group-hover:text-white transition"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-cyan-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Drilldown: Commit History & Technical Spec */}
                        {isExpanded && (
                          <tr className="bg-black/30 border-b border-white/[0.08]">
                            <td colSpan={8} className="p-4 sm:p-5">
                              <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-cyan-400" />
                                    <span className="font-semibold text-white text-xs uppercase tracking-wider font-mono">
                                      Version History Ledger for {item.signature}
                                    </span>
                                  </div>
                                  <div className="text-xs text-zinc-400 font-mono">
                                    Diamond Storage Slot:{" "}
                                    <span className="text-purple-300">
                                      LibDiamond.DIAMOND_STORAGE_POSITION
                                    </span>
                                  </div>
                                </div>

                                {/* Chronological Commit Timeline */}
                                <div className="space-y-2.5">
                                  {item.history.map((commit) => {
                                    const isCurrent = commit.version === item.currentVersion;
                                    const isStable = commit.version === item.stableVersion;
                                    const isCommitQuarantined = commit.status === "Quarantined";
                                    const commitKey = `comm-${item.selector}-${commit.version}`;

                                    return (
                                      <div
                                        key={commit.version}
                                        className={`p-3.5 rounded-lg border text-xs font-mono transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                                          isCommitQuarantined
                                            ? "bg-rose-950/20 border-rose-500/30"
                                            : isCurrent
                                            ? "bg-cyan-950/20 border-cyan-500/30"
                                            : "bg-white/[0.02] border-white/[0.06]"
                                        }`}
                                      >
                                        <div className="space-y-1.5 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span
                                              className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                                commit.version === 3
                                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                                  : commit.version === 2
                                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                              }`}
                                            >
                                              v{commit.version}
                                            </span>

                                            <span
                                              className={`px-2 py-0.2 rounded text-[10px] uppercase font-bold ${
                                                isCommitQuarantined
                                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                                  : commit.status === "Stable"
                                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                  : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                              }`}
                                            >
                                              {commit.status}
                                            </span>

                                            {isCurrent && (
                                              <span className="px-2 py-0.2 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                                                ACTIVE ROUTING
                                              </span>
                                            )}

                                            {isStable && (
                                              <span className="px-2 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                                                LAST STABLE (FALLBACK TARGET)
                                              </span>
                                            )}

                                            <span className="text-zinc-500 text-[11px]">
                                              {formatTimeAgo(commit.timestamp)}
                                            </span>
                                          </div>

                                          <div className="text-zinc-200 font-sans text-xs">
                                            {commit.message}
                                          </div>

                                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400">
                                            <div className="flex items-center gap-1">
                                              <span className="text-zinc-500">Author:</span>
                                              <span className="text-zinc-300">{commit.author}</span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                              <span className="text-zinc-500">Facet:</span>
                                              <span className="text-cyan-300" title={commit.implementation}>
                                                {commit.implementation.slice(0, 10)}...{commit.implementation.slice(-6)}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                              <span className="text-zinc-500">Bytecode Hash:</span>
                                              <span className="text-purple-300" title={commit.codeHash}>
                                                {commit.codeHash.slice(0, 10)}...{commit.codeHash.slice(-6)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Actions for this commit */}
                                        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleCopy(
                                                commit.implementation,
                                                `${commitKey}-addr`,
                                                `Facet Address v${commit.version}`
                                              )
                                            }
                                            className="px-2.5 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                                          >
                                            {copiedKey === `${commitKey}-addr` ? (
                                              <Check className="w-3 h-3 text-emerald-400" />
                                            ) : (
                                              <Copy className="w-3 h-3" />
                                            )}
                                            <span className="text-[10px]">Facet Addr</span>
                                          </button>

                                          <a
                                            href={`${CONTRACTS.explorer}/address/${commit.implementation}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-2.5 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                            <span className="text-[10px]">Explorer</span>
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. EIP-2535 STANDARD INTROSPECTION METHODS CARD
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            EIP-2535 Standard Introspection Methods
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Standardized Loupe functions specified in EIP-2535 for querying facet mapping, selectors, and runtime routing from CLI or client dApps.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#161b22] overflow-hidden shadow-2xl">
          {/* Method Selection Tabs */}
          <div className="flex border-b border-white/[0.08] bg-black/40 overflow-x-auto scrollbar-none">
            {LOUPE_METHODS.map((method) => {
              const isActive = activeMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => {
                    setActiveMethod(method.id);
                    setSimulatedExecutionTime(null);
                  }}
                  className={`px-4 sm:px-5 py-3.5 text-xs sm:text-sm font-mono font-medium transition cursor-pointer whitespace-nowrap border-b-2 flex items-center gap-2 ${
                    isActive
                      ? "border-emerald-400 text-white bg-white/[0.05]"
                      : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="text-zinc-500">#</span>
                  <span>{method.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Method Explanation & Parameters */}
          <div className="p-6 space-y-6">
            {(() => {
              const currentSpec = LOUPE_METHODS.find((m) => m.id === activeMethod)!;
              return (
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/[0.06]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {currentSpec.signature}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                          sel: {currentSpec.selector}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {currentSpec.description}
                      </p>
                    </div>

                    {/* Parameter pickers if needed */}
                    {activeMethod === "facetFunctionSelectors" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="text-xs text-zinc-400 font-mono">Facet:</label>
                        <select
                          value={selectedFacetForQuery}
                          onChange={(e) => setSelectedFacetForQuery(e.target.value)}
                          className="bg-[#0d1117] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-mono outline-none cursor-pointer"
                        >
                          <option value={CONTRACTS.vaultV1}>VaultV1 ({CONTRACTS.vaultV1.slice(0, 8)}...)</option>
                          <option value={CONTRACTS.vaultV2}>VaultV2 ({CONTRACTS.vaultV2.slice(0, 8)}...)</option>
                          <option value={CONTRACTS.guardian}>SolGitGuardian ({CONTRACTS.guardian.slice(0, 8)}...)</option>
                        </select>
                      </div>
                    )}

                    {activeMethod === "facetAddress" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="text-xs text-zinc-400 font-mono">Selector:</label>
                        <select
                          value={selectedSelectorForQuery}
                          onChange={(e) => setSelectedSelectorForQuery(e.target.value)}
                          className="bg-[#0d1117] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-mono outline-none cursor-pointer"
                        >
                          {selectors.map((s) => (
                            <option key={s.selector} value={s.selector}>
                              {s.name} ({s.selector})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* macOS Terminal Box */}
                  <div className="rounded-xl border border-white/[0.1] bg-[#0d1117] shadow-2xl overflow-hidden font-mono text-xs">
                    {/* Terminal Window Header */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.08] bg-black/40">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block border border-black/20" />
                        <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block border border-black/20" />
                        <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block border border-black/20" />
                        <span className="ml-2 text-zinc-400 text-[11px]">mst-foundry — cast call</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {simulatedExecutionTime !== null && (
                          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            {simulatedExecutionTime}ms (Block 120,486)
                          </span>
                        )}

                        {/* Copy Command Button */}
                        <button
                          type="button"
                          onClick={() => handleCopy(currentCastCommand, "cast-cmd", "Cast CLI Command")}
                          className="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-300 hover:text-white transition flex items-center gap-1 cursor-pointer text-[11px]"
                        >
                          {copiedKey === "cast-cmd" ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy Cast Command</span>
                        </button>

                        {/* Execute Simulation Button */}
                        <button
                          type="button"
                          onClick={handleSimulateRpc}
                          disabled={isSimulatingRpc}
                          className="px-3 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-[11px]"
                        >
                          {isSimulatingRpc ? (
                            <>
                              <RotateCcw className="w-3 h-3 animate-spin" />
                              <span>Simulating...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>Simulate RPC Call</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Terminal Body */}
                    <div className="p-4 space-y-4">
                      {/* Command Line Input */}
                      <div className="flex items-start gap-2 text-zinc-300">
                        <span className="text-emerald-400 select-none">$</span>
                        <div className="flex-1 text-cyan-300 break-all select-all font-mono leading-relaxed">
                          {currentCastCommand}
                        </div>
                      </div>

                      {/* Decoded Simulation Output */}
                      <div className="pt-3 border-t border-white/[0.06] space-y-2">
                        <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                          <span>Return Payload ({currentSpec.returnType}):</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(simulatedDecodedOutput, "json-out", "Loupe JSON Output")
                            }
                            className="hover:text-zinc-300 transition flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === "json-out" ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>Copy Output</span>
                          </button>
                        </div>

                        <pre className="p-3.5 rounded-lg bg-black/60 border border-white/[0.04] text-emerald-300/90 text-xs overflow-x-auto leading-relaxed scrollbar-thin">
                          <code>{simulatedDecodedOutput}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. STORAGE LAYOUT & ARCHITECTURE INSPECTOR
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" />
              Storage Layout &amp; Architecture Inspector
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Isolated Diamond Storage pattern prevents storage collision during hot upgrades and rollback events.
            </p>
          </div>

          {/* Storage Slot View Tabs */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#161b22] border border-white/[0.08] text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStorageView("diamond")}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                storageView === "diamond"
                  ? "bg-white/[0.1] text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Diamond Router
            </button>
            <button
              type="button"
              onClick={() => setStorageView("vault")}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                storageView === "vault"
                  ? "bg-white/[0.1] text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Vault AppStorage
            </button>
            <button
              type="button"
              onClick={() => setStorageView("guardian")}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                storageView === "guardian"
                  ? "bg-white/[0.1] text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Guardian Circuit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Storage Slot 1: Diamond */}
          <div
            onClick={() => setStorageView("diamond")}
            className={`p-5 rounded-xl border transition-all cursor-pointer space-y-3 ${
              storageView === "diamond"
                ? "bg-[#161b22] border-cyan-500/40 shadow-lg shadow-cyan-950/20 ring-1 ring-cyan-500/20"
                : "bg-[#161b22]/70 border-white/[0.08] hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase">
                Diamond Routing Slot
              </span>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-sm font-bold text-white">LibDiamond Storage Slot</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Stores mapping of 4-byte selector to facet address and array position for EIP-2535 Loupe introspection.
            </p>
            <div className="p-2.5 rounded bg-black/40 border border-white/[0.06] font-mono text-[11px] text-purple-300 break-all select-all">
              keccak256(&quot;diamond.standard.diamond.storage&quot;)
              <div className="text-zinc-500 text-[10px] mt-1">
                0xc8fcad8db84d3cc18b4c41d551ea0ee66dd599c9a67d153f4b0f8f17a238b819
              </div>
            </div>
          </div>

          {/* Storage Slot 2: Vault */}
          <div
            onClick={() => setStorageView("vault")}
            className={`p-5 rounded-xl border transition-all cursor-pointer space-y-3 ${
              storageView === "vault"
                ? "bg-[#161b22] border-emerald-500/40 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/20"
                : "bg-[#161b22]/70 border-white/[0.08] hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase">
                Vault State Slot
              </span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Vault AppStorage Slot</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Holds user balances and totals. Unaltered when facets switch between VaultV1, VaultV2, or AI hotfixes.
            </p>
            <div className="p-2.5 rounded bg-black/40 border border-white/[0.06] font-mono text-[11px] text-emerald-300 break-all select-all">
              keccak256(&quot;solgit.vault.storage&quot;)
              <div className="text-zinc-500 text-[10px] mt-1">
                0x89d24a7320b5711b730f51952f447714041e2a049d5c41743f5adccbdfca3468
              </div>
            </div>
          </div>

          {/* Storage Slot 3: Guardian */}
          <div
            onClick={() => setStorageView("guardian")}
            className={`p-5 rounded-xl border transition-all cursor-pointer space-y-3 ${
              storageView === "guardian"
                ? "bg-[#161b22] border-purple-500/40 shadow-lg shadow-purple-950/20 ring-1 ring-purple-500/20"
                : "bg-[#161b22]/70 border-white/[0.08] hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase">
                Defense Circuit Slot
              </span>
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-bold text-white">SolGit Guardian Circuit</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Authorized Guardian signer address and emergency circuit breaker flags. Reverts malicious state changes.
            </p>
            <div className="p-2.5 rounded bg-black/40 border border-white/[0.06] font-mono text-[11px] text-cyan-300 break-all select-all">
              keccak256(&quot;solgit.guardian.storage&quot;)
              <div className="text-zinc-500 text-[10px] mt-1">
                Authorized: {CONTRACTS.guardian.slice(0, 10)}...{CONTRACTS.guardian.slice(-6)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
