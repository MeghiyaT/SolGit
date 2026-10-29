"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Radio,
  RotateCcw,
  Cpu,
  Terminal,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Zap,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Bug,
  Layers,
  RefreshCw,
  Code2,
} from "lucide-react";
import {
  CONTRACTS,
  type RollbackEvent,
} from "../../lib/data";

// ─────────────────────────────────────────────────────────────
// Component Props Interface
// ─────────────────────────────────────────────────────────────
export interface SecurityTabProps {
  isHacked: boolean;
  events: RollbackEvent[];
  onTriggerHack: () => void;
  onReset: () => void;
  onActionToast?: (msg: string) => void;
}

// ─────────────────────────────────────────────────────────────
// Simulation Stage Definition
// ─────────────────────────────────────────────────────────────
interface PipelineStage {
  step: number;
  id: string;
  title: string;
  badge: string;
  shortDesc: string;
  detailedDesc: string;
  actor: string;
  selector: string;
  targetAddress: string;
  technicalDetail: string;
  codeSnippet: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    step: 1,
    id: "exploit_attempt",
    title: "Exploit Attempt",
    badge: "STAGE 1 • ATTACK VECTOR",
    shortDesc: "Attacker targets VaultV2 withdraw() on permanent Diamond",
    detailedDesc:
      "Attacker initiates an underflow exploit against the withdraw(uint256) function. In VaultV2, unchecked arithmetic allows an account with zero balance to trigger subtraction underflow, wrapping the internal balance to 2^256 - 1 and requesting a 200 tMSTC drainage transaction.",
    actor: CONTRACTS.attacker,
    selector: "0x2e1a7d4d (withdraw)",
    targetAddress: CONTRACTS.diamond,
    technicalDetail:
      "Calldata: 0x2e1a7d4d00000000000000000000000000000000000000000000000ad78ebc5ac6200000 (200 tMSTC)",
    codeSnippet: `// Vulnerable unchecked math in VaultV2.sol:
unchecked {
    vs.balances[msg.sender] -= amount; // ⚠️ Underflow occurs if balance == 0!
    if (amount <= vs.totalDeposits) {
        vs.totalDeposits -= amount;
    }
}`,
  },
  {
    step: 2,
    id: "watcher_detection",
    title: "Watcher Detection",
    badge: "STAGE 2 • INVARIANT ASSERTION",
    shortDesc: "Off-chain Watcher detects abnormal drain and underflow signature in real-time",
    detailedDesc:
      "SolGit Sentinel Watcher node intercepts the incoming transaction in the MST testnet mempool/block processing pipeline. The transaction breaches the protocol's OUTFLOW_CAP invariant (single-block outflow attempted: 200 tMSTC > max allowed 100 tMSTC).",
    actor: "SolGit Autonomous Sentinel Node (Worker #04)",
    selector: "0x2e1a7d4d (withdraw)",
    targetAddress: CONTRACTS.diamond,
    technicalDetail:
      "Assertion Failure: OUTFLOW_CAP_BREACHED [attempted: 200000000000000000000 > cap: 100000000000000000000]",
    codeSnippet: `// Watcher Invariant Rule:
function assertOutflow(uint256 blockNumber, uint256 delta) internal view {
    if (blockOutflow[blockNumber] + delta > OUTFLOW_CAP) {
        revert SolGitErrors.InvariantBreach("OUTFLOW_CAP");
    }
}`,
  },
  {
    step: 3,
    id: "guardian_rollback",
    title: "Guardian Rollback",
    badge: "STAGE 3 • SOFT-FAIL INTERVENTION",
    shortDesc: "Watcher invokes emergencyRollback() restoring selector 0x2e1a7d4d to VaultV1",
    detailedDesc:
      "The Watcher invokes emergencyRollback() via the authorized Guardian account. SolGit's Soft-Fail Guard atomically updates the Diamond Proxy selector routing table: selector 0x2e1a7d4d is redirected back to the stable VaultV1 facet (0xF717...53f8). The permanent Diamond address never changes.",
    actor: CONTRACTS.guardian,
    selector: "0x2e1a7d4d (withdraw)",
    targetAddress: CONTRACTS.diamond,
    technicalDetail:
      "LibDiamond.emergencyRollback(0x2e1a7d4d, 1) -> Facet restored to VaultV1 at 0xF717aaE8398DA7E340c781418992b80D692253f8",
    codeSnippet: `// EIP-2535 Diamond Proxy emergency rollback:
function emergencyRollback(bytes4 selector, uint32 targetVersion) external onlyGuardian {
    address previousFacet = LibDiamond.getHistoricalFacet(selector, targetVersion);
    LibDiamond.updateSelectorMapping(selector, previousFacet);
    emit SelectorRolledBack(selector, 2, targetVersion, msg.sender);
}`,
  },
  {
    step: 4,
    id: "selector_quarantine",
    title: "Selector Quarantine",
    badge: "STAGE 4 • ROUTING QUARANTINE",
    shortDesc: "Compromised version v2 quarantined; active routing restored with zero downtime",
    detailedDesc:
      "VaultV2 implementation bytecode is permanently marked as Quarantined in the on-chain version registry. Unrelated facets (deposit, transfer, balanceOf) continue operating without a microsecond of downtime. The attacker's transaction reverts with SolGitErrors.QuarantinedVersion().",
    actor: "SolGit Registry Contract (0x2c26...Df3d)",
    selector: "0x2e1a7d4d (withdraw)",
    targetAddress: CONTRACTS.vaultV1,
    technicalDetail:
      "Routing Status: ACTIVE -> VaultV1 (0xF717...53f8) | QUARANTINED -> VaultV2 (0x9169...BCB7)",
    codeSnippet: `// Zero-downtime routing state:
bytes4 selector = 0x2e1a7d4d;
assert(LibDiamond.facetAddress(selector) == 0xF717aaE8398DA7E340c781418992b80D692253f8);
assert(SolGitRegistry.isQuarantined(selector, 2) == true);`,
  },
  {
    step: 5,
    id: "ai_fixer_hotfix",
    title: "AI Fixer Hotfix",
    badge: "STAGE 5 • SELF-HEALING HOTFIX",
    shortDesc: "AI Fixer generates verified patch (VaultV2Fixed.sol) and stages PR #42",
    detailedDesc:
      "The SolGit AI Sentinel parses the invariant trace, identifies the unchecked subtraction bug, and generates a formal CEI (Checks-Effects-Interactions) patch: VaultV2Fixed.sol. The patch passes 10,000 automated Foundry invariant fuzzing iterations and automatically stages Pull Request #42.",
    actor: "SolGit AI Healer Agent (Claude 3.7 / Foundry LLVM)",
    selector: "0x2e1a7d4d (withdraw)",
    targetAddress: "PR #42 (github.com/solgit/core/pull/42)",
    technicalDetail:
      "Patch Verification: 10,000/10,000 Fuzz Runs Passed | Slither Static Analysis: 0 Alerts | PR #42 Staged",
    codeSnippet: `// AI Self-Healed Fix in VaultV2Fixed.sol:
function withdraw(uint256 amount) external {
    VaultStorage.Layout storage vs = VaultStorage.layout();
    if (vs.balances[msg.sender] < amount) revert SolGitErrors.Unauthorized(); // Checked
    vs.balances[msg.sender] -= amount; // Safe standard math
    (bool ok, ) = msg.sender.call{value: amount}("");
    require(ok, "Transfer failed");
}`,
  },
];

// ─────────────────────────────────────────────────────────────
// Live Telemetry Log Item Interface
// ─────────────────────────────────────────────────────────────
interface TelemetryLog {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  source: string;
  message: string;
}

// ─────────────────────────────────────────────────────────────
// Invariant Monitor Specification Interface
// ─────────────────────────────────────────────────────────────
interface InvariantDefinition {
  id: string;
  name: string;
  category: "Economic" | "Concurrency" | "Storage" | "Access Control";
  nominalStatus: string;
  trippedStatus: string;
  normalDescription: string;
  trippedDescription: string;
  threshold: string;
  technicalRule: string;
  storageSlot?: string;
  codeSnippet: string;
}

const INVARIANT_RULES: InvariantDefinition[] = [
  {
    id: "outflow_cap",
    name: "OUTFLOW_CAP",
    category: "Economic",
    nominalStatus: "0.00 / 100.00 tMSTC (Nominal)",
    trippedStatus: "200.00 tMSTC (100 tMSTC Max Cap Breached)",
    normalDescription:
      "Continuous per-block outflow ceiling. Restricts cumulative native withdrawals to a maximum of 100 tMSTC per block window to prevent flash drains.",
    trippedDescription:
      "THRESHOLD BREACHED: Attacker attempted unauthorized withdrawal of 200 tMSTC in block #120486. Soft-fail circuit breaker triggered immediate rollback.",
    threshold: "Max 100 tMSTC / block",
    technicalRule: "sum(Withdrawn[block.number]) <= 100 ether",
    storageSlot: "keccak256('solgit.invariants.outflow.cap')",
    codeSnippet: `// Invariant enforcement rule:
function verifyOutflowInvariant(uint256 delta) internal {
    uint256 currentBlockOutflow = s.blockOutflow[block.number];
    if (currentBlockOutflow + delta > 100 ether) {
        emit InvariantBreached("OUTFLOW_CAP", currentBlockOutflow + delta);
        revert SolGitErrors.InvariantBreach("OUTFLOW_CAP");
    }
    s.blockOutflow[block.number] += delta;
}`,
  },
  {
    id: "reentrancy_guard",
    name: "REENTRANCY_GUARD",
    category: "Concurrency",
    nominalStatus: "Active (Depth: 1, 0 Reentrant Calls)",
    trippedStatus: "Active (Depth: 1, 0 Reentrant Calls)",
    normalDescription:
      "Diamond storage level reentrancy mutex. Ensures no facet external call can re-enter the diamond proxy during execution frame.",
    trippedDescription:
      "Active and healthy. Reentrancy mutex held during withdraw call; 0 recursive calls detected.",
    threshold: "Max call depth: 1",
    technicalRule: "reentrancyStatus == _NOT_ENTERED (1)",
    storageSlot: "keccak256('solgit.diamond.reentrancy.status')",
    codeSnippet: `// Diamond Storage Reentrancy Guard:
modifier nonReentrant() {
    DiamondStorage storage ds = diamondStorage();
    if (ds._status == _ENTERED) revert SolGitErrors.ReentrancyGuardReentrantCall();
    ds._status = _ENTERED;
    _;
    ds._status = _NOT_ENTERED;
}`,
  },
  {
    id: "state_integrity",
    name: "STATE_INTEGRITY",
    category: "Storage",
    nominalStatus: "Healthy (Keccak Storage Layout Verified)",
    trippedStatus: "Healthy (Keccak Storage Layout Verified)",
    normalDescription:
      "Cryptographic facet storage verification. Validates that no upgraded facet introduces storage collisions or clobbers Diamond proxy core storage slots.",
    trippedDescription:
      "Healthy. Storage layout keccak hash matches EIP-2535 Diamond storage namespace; 0 slot collisions across 4 registered facets.",
    threshold: "Zero storage slot collision",
    technicalRule: "keccak256(facetStorageLayout) == canonicalHash",
    storageSlot: "keccak256('solgit.vault.storage')",
    codeSnippet: `// Namespace storage isolation:
library VaultStorage {
    bytes32 constant STORAGE_POSITION = keccak256("solgit.vault.storage");
    function layout() internal pure returns (Layout storage l) {
        bytes32 position = STORAGE_POSITION;
        assembly { l.slot := position }
    }
}`,
  },
  {
    id: "guardian_role",
    name: "GUARDIAN_ROLE",
    category: "Access Control",
    nominalStatus: "0x6A7C...5e27 (Constrained Rollback-Only)",
    trippedStatus: "0x6A7C...5e27 (Rollback Executed)",
    normalDescription:
      "Cryptographically constrained emergency key. Guardian address has zero privilege to alter ownership or drain capital; strictly authorized for emergencyRollback() to stable versions.",
    trippedDescription:
      "Executed emergencyRollback() for selector 0x2e1a7d4d. Access control boundary maintained; no state modification beyond version pointer restore.",
    threshold: "Rollback permissions only",
    technicalRule: "msg.sender == guardian && msg.sig == emergencyRollback.selector",
    codeSnippet: `// Guardian access boundary:
modifier onlyGuardian() {
    if (msg.sender != LibDiamond.guardian()) {
        revert SolGitErrors.UnauthorizedGuardian();
    }
    _;
}`,
  },
];

export function SecurityTab({
  isHacked,
  events,
  onTriggerHack,
  onReset,
  onActionToast,
}: SecurityTabProps) {
  // ─────────────────────────────────────────────────────────
  // State: Simulation Execution
  // ─────────────────────────────────────────────────────────
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(isHacked ? 5 : 0);
  const [prevIsHacked, setPrevIsHacked] = useState<boolean>(isHacked);
  const [selectedStageDetail, setSelectedStageDetail] = useState<PipelineStage | null>(null);
  const [expandedInvariantId, setExpandedInvariantId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState<"fast" | "normal">("normal");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up simulation interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Keep currentStep in sync when isHacked prop changes externally
  if (isHacked !== prevIsHacked) {
    setPrevIsHacked(isHacked);
    if (isHacked && currentStep === 0) {
      setCurrentStep(5);
    } else if (!isHacked && currentStep === 5 && !running) {
      setCurrentStep(0);
    }
  }

  // ─────────────────────────────────────────────────────────
  // Telemetry Console Log Stream
  // ─────────────────────────────────────────────────────────
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([
    {
      id: "log-init-1",
      timestamp: "16:42:01.104",
      level: "info",
      source: "SENTINEL",
      message: `Continuous watcher active on MST Blockchain (Chain ID ${CONTRACTS.chainId})`,
    },
    {
      id: "log-init-2",
      timestamp: "16:42:01.118",
      level: "info",
      source: "DIAMOND",
      message: `EIP-2535 Diamond Proxy verified at ${CONTRACTS.diamond} (4 facets registered)`,
    },
    {
      id: "log-init-3",
      timestamp: "16:42:01.205",
      level: "info",
      source: "GUARDIAN",
      message: `Guardian signer active: ${CONTRACTS.guardian} (Role: EMERGENCY_ROLLBACK_ONLY)`,
    },
  ]);

  const telemetryEndRef = useRef<HTMLDivElement>(null);

  const addTelemetryLog = useCallback(
    (level: "info" | "warn" | "error" | "success", source: string, message: string) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(
        now.getMilliseconds()
      ).padStart(3, "0")}`;

      setTelemetryLogs((prev) => [
        ...prev.slice(-30),
        {
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: timeStr,
          level,
          source,
          message,
        },
      ]);
    },
    []
  );

  // Auto-scroll telemetry log
  useEffect(() => {
    if (running && telemetryEndRef.current) {
      telemetryEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [telemetryLogs, running]);

  // ─────────────────────────────────────────────────────────
  // Copy to clipboard helper
  // ─────────────────────────────────────────────────────────
  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    if (onActionToast) {
      onActionToast(`Copied ${label} to clipboard`);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Trigger Interactive Attack Simulation
  // ─────────────────────────────────────────────────────────
  const handleSimulateAttack = () => {
    if (running || isHacked) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setRunning(true);
    setCurrentStep(1);

    addTelemetryLog(
      "warn",
      "MEMPOOL",
      `Incoming tx detected from ${CONTRACTS.attacker.slice(0, 8)}... Target: withdraw(200 tMSTC)`
    );

    const stepDelay = simulationSpeed === "fast" ? 450 : 850;

    let step = 1;
    intervalRef.current = setInterval(() => {
      step += 1;
      if (step === 2) {
        setCurrentStep(2);
        addTelemetryLog(
          "error",
          "WATCHER",
          `CRITICAL: Invariant OUTFLOW_CAP tripped! Attempted: 200 tMSTC (Threshold: 100 tMSTC)`
        );
      } else if (step === 3) {
        setCurrentStep(3);
        addTelemetryLog(
          "warn",
          "GUARDIAN",
          `emergencyRollback(0x2e1a7d4d, 1) broadcasted by Guardian ${CONTRACTS.guardian.slice(
            0,
            8
          )}...`
        );
      } else if (step === 4) {
        setCurrentStep(4);
        addTelemetryLog(
          "success",
          "DIAMOND",
          `Selector 0x2e1a7d4d pointed back to VaultV1 (0xF717...53f8). Version 2 quarantined.`
        );
      } else if (step >= 5) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setCurrentStep(5);
        setRunning(false);
        addTelemetryLog(
          "success",
          "AI_FIXER",
          `AI patch generated: VaultV2Fixed.sol. 10k Foundry invariant tests passed. PR #42 staged.`
        );
        onTriggerHack();
        if (onActionToast) {
          onActionToast("Exploit Blocked: 200 tMSTC drain thwarted, selector rolled back to V1!");
        }
      }
    }, stepDelay);
  };

  // ─────────────────────────────────────────────────────────
  // Reset Simulation
  // ─────────────────────────────────────────────────────────
  const handleResetSandbox = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
    setCurrentStep(0);
    setSelectedStageDetail(null);
    onReset();
    addTelemetryLog(
      "info",
      "SANDBOX",
      "Sandbox environment reset. Vault active withdraw facet restored to VaultV2 for demonstration."
    );
    if (onActionToast) {
      onActionToast("Sandbox reset: Environment returned to initial state");
    }
  };

  // ─────────────────────────────────────────────────────────
  // Filtered Events Feed
  // ─────────────────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        evt.selector.toLowerCase().includes(q) ||
        evt.txHash.toLowerCase().includes(q) ||
        evt.invariant.toLowerCase().includes(q) ||
        evt.triggeredBy.toLowerCase().includes(q) ||
        evt.blockNumber.toString().includes(q);

      return matchesQuery;
    });
  }, [events, searchQuery]);

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* ───────────────────────────────────────────────────── */}
      {/* 1. Header & Defense Center Overview                   */}
      {/* ───────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden border border-zinc-800/80 bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-zinc-950 shadow-2xl backdrop-blur-xl">
        {/* Glow ambient background orbs */}
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* Live Status Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>GUARDIAN ACTIVE</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
                <Cpu className="w-3.5 h-3.5" />
                <span>EIP-2535 DIAMOND PROXY</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs font-mono">
                <span>CHAIN ID {CONTRACTS.chainId}</span>
              </div>
            </div>

            {/* Title & Glowing Aura */}
            <div className="flex items-center gap-3">
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-zinc-900 to-zinc-900 border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                <Shield className="w-7 h-7 text-emerald-400" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
                </span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Security & Guardian Defense Center
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                  Autonomous invariant monitoring, live attack mitigation, and zero-downtime selector rollbacks
                </p>
              </div>
            </div>

            {/* Security Policy Banner */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-start gap-3 text-xs text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Security Policy: </span>
                SolGit EIP-2535 Diamond Proxy continuous invariant monitoring on MST Blockchain (Chain ID {CONTRACTS.chainId}).
                If an exploit or invariant violation is detected, the Soft-Fail Guard atomically quarantines the compromised facet version and rolls back the selector with zero protocol downtime.
              </div>
            </div>
          </div>

          {/* Quick Technical Reference Badges */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-1">
              <div className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider flex items-center justify-between">
                <span>Permanent Diamond</span>
                <button
                  onClick={() => handleCopy(CONTRACTS.diamond, "header-diamond", "Diamond Address")}
                  className="text-zinc-500 hover:text-zinc-300 transition"
                  title="Copy Diamond Address"
                >
                  {copiedKey === "header-diamond" ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <div className="font-mono text-cyan-300 font-semibold truncate max-w-[200px]">
                {CONTRACTS.diamond.slice(0, 10)}...{CONTRACTS.diamond.slice(-6)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-1">
              <div className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider flex items-center justify-between">
                <span>Authorized Guardian</span>
                <button
                  onClick={() => handleCopy(CONTRACTS.guardian, "header-guardian", "Guardian Address")}
                  className="text-zinc-500 hover:text-zinc-300 transition"
                  title="Copy Guardian Address"
                >
                  {copiedKey === "header-guardian" ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <div className="font-mono text-emerald-300 font-semibold truncate max-w-[200px]">
                {CONTRACTS.guardian.slice(0, 10)}...{CONTRACTS.guardian.slice(-6)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────── */}
      {/* 2. Live Exploit & Auto-Rollback Simulation Sandbox   */}
      {/* ───────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden border border-zinc-800/90 bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-zinc-950 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800/80 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  Live Exploit & Auto-Rollback Simulation Sandbox
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Simulate an adversarial attack against VaultV2 and observe real-time autonomous invariant defense
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons & Speed control */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl bg-zinc-950 border border-zinc-800 p-1 text-xs">
              <button
                onClick={() => setSimulationSpeed("normal")}
                className={`px-2.5 py-1 rounded-lg font-mono transition ${
                  simulationSpeed === "normal"
                    ? "bg-zinc-800 text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                1x
              </button>
              <button
                onClick={() => setSimulationSpeed("fast")}
                className={`px-2.5 py-1 rounded-lg font-mono transition ${
                  simulationSpeed === "fast"
                    ? "bg-zinc-800 text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                2x Fast
              </button>
            </div>

            {isHacked ? (
              <button
                onClick={handleResetSandbox}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold shadow-md transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sandbox Environment</span>
              </button>
            ) : (
              <button
                onClick={handleSimulateAttack}
                disabled={running}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-rose-600/30 disabled:opacity-50 transition cursor-pointer"
              >
                {running ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Executing Attack Simulation...</span>
                  </>
                ) : (
                  <>
                    <Bug className="w-4 h-4 text-white" />
                    <span>Simulate Exploit Attack</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Vault State & Invariant Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
              Vault Total Deposits
            </span>
            <div className="text-xl font-black font-mono text-emerald-400 mt-1 flex items-baseline gap-2">
              <span>15.0000</span>
              <span className="text-xs text-emerald-500/80 font-normal">tMSTC</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 mt-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>100% Capital Preserved</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
              Attacker Stolen Capital
            </span>
            <div className="text-xl font-black font-mono text-rose-400 mt-1 flex items-baseline gap-2">
              <span>0.0000</span>
              <span className="text-xs text-rose-500/80 font-normal">tMSTC</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-rose-400/90 mt-1">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>0 Siphoned (Reverted)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
              Active Withdraw Facet
            </span>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-1 truncate">
              {isHacked ? "VaultV1 (Stable Restored)" : "VaultV2 (Active Buggy)"}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 truncate">
              {isHacked ? "0xF717...53f8 (V2 Quarantined)" : "0x9169...BCB7 (Unchecked Math)"}
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
              Defense Reaction Latency
            </span>
            <div className="text-xl font-black font-mono text-amber-300 mt-1 flex items-baseline gap-2">
              <span>~420</span>
              <span className="text-xs text-amber-400/80 font-normal">ms</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Sub-Block Atomic Rollback</span>
            </div>
          </div>
        </div>

        {/* 5-Stage Interactive Progress Pipeline */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                5-Stage Exploit & Auto-Rollback Execution Pipeline
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 hidden sm:inline">
              Click any stage card to view technical calldata & trace details
            </span>
          </div>

          {/* Progress bar connecting the stages */}
          <div className="relative mb-6 hidden md:block">
            <div className="h-1 bg-zinc-800 rounded-full w-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, (currentStep / 5) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* 5 Stage Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {PIPELINE_STAGES.map((stage) => {
              const isCompleted = currentStep > stage.step || (isHacked && currentStep === 5);
              const isCurrent = currentStep === stage.step && running;

              return (
                <div
                  key={stage.id}
                  onClick={() => setSelectedStageDetail(stage)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? "bg-rose-950/40 border-rose-500 text-rose-100 shadow-xl shadow-rose-500/20 scale-[1.02] ring-1 ring-rose-500"
                      : isCompleted
                      ? "bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70 text-emerald-200"
                      : "bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700/80 text-zinc-400 opacity-80"
                  }`}
                >
                  {/* Top indicator row */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-400">
                        Stage {stage.step}
                      </span>
                      {isCompleted ? (
                        <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : isCurrent ? (
                        <div className="p-1 rounded-full bg-rose-500/20 text-rose-400 animate-pulse">
                          <AlertOctagon className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-zinc-800 inline-block" />
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-white tracking-tight leading-snug">
                      {stage.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                      {stage.shortDesc}
                    </p>
                  </div>

                  {/* Bottom interactive footer */}
                  <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-500">Inspect</span>
                    <ArrowRight className="w-3 h-3 text-zinc-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Stage Detail Drawer / Modal */}
        {selectedStageDetail && (
          <div className="mt-6 p-5 rounded-2xl bg-zinc-950 border border-zinc-800 animate-fadeIn">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  {selectedStageDetail.badge}
                </div>
                <h4 className="text-base font-bold text-white">
                  Stage {selectedStageDetail.step}: {selectedStageDetail.title}
                </h4>
              </div>
              <button
                onClick={() => setSelectedStageDetail(null)}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
              {selectedStageDetail.detailedDesc}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                <span className="text-zinc-400 text-[10px] uppercase">Actor / Initiator</span>
                <div className="text-cyan-300 truncate">{selectedStageDetail.actor}</div>

                <span className="text-zinc-400 text-[10px] uppercase block pt-1">
                  Target Contract
                </span>
                <div className="text-emerald-300 truncate">{selectedStageDetail.targetAddress}</div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                <span className="text-zinc-400 text-[10px] uppercase">Function Selector</span>
                <div className="text-amber-300">{selectedStageDetail.selector}</div>

                <span className="text-zinc-400 text-[10px] uppercase block pt-1">
                  Calldata / Assertion Signature
                </span>
                <div className="text-zinc-300 text-[11px] truncate">
                  {selectedStageDetail.technicalDetail}
                </div>
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="mt-4">
              <div className="text-[11px] font-mono text-zinc-400 mb-1 flex items-center justify-between">
                <span>Solidity Verification Snippet:</span>
                <button
                  onClick={() =>
                    handleCopy(
                      selectedStageDetail.codeSnippet,
                      `snippet-${selectedStageDetail.step}`,
                      "Code Snippet"
                    )
                  }
                  className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition"
                >
                  {copiedKey === `snippet-${selectedStageDetail.step}` ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-black border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
                <code>{selectedStageDetail.codeSnippet}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Live Sentinel Telemetry Console (macOS Acrylic Terminal) */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                SolGit Sentinel & Watcher Live Telemetry Stream
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-zinc-400">P2P Stream Active</span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/90 bg-black/90 p-4 font-mono text-xs shadow-inner max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
            {/* macOS traffic light window dots */}
            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-zinc-900">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-[10px] text-zinc-600 ml-2">mst-watcher-daemon --chain 91562037</span>
            </div>

            {telemetryLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-zinc-600 text-[10px] shrink-0">{log.timestamp}</span>
                <span
                  className={`text-[10px] px-1.5 py-[1px] rounded font-bold shrink-0 ${
                    log.level === "error"
                      ? "bg-rose-950 text-rose-400 border border-rose-900/60"
                      : log.level === "warn"
                      ? "bg-amber-950 text-amber-400 border border-amber-900/60"
                      : log.level === "success"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-900/60"
                      : "bg-zinc-900 text-cyan-400 border border-zinc-800"
                  }`}
                >
                  [{log.source}]
                </span>
                <span
                  className={`${
                    log.level === "error"
                      ? "text-rose-300 font-semibold"
                      : log.level === "warn"
                      ? "text-amber-200"
                      : log.level === "success"
                      ? "text-emerald-300 font-semibold"
                      : "text-zinc-300"
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={telemetryEndRef} />
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────── */}
      {/* 3. Invariant Monitor Cards (macOS Acrylic)           */}
      {/* ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Invariant Monitor & Proof Verifiers</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Cryptographic checks evaluated on every block transition and external delegatecall
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
              4 Continuous Invariants Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INVARIANT_RULES.map((rule) => {
            const isTripped = rule.id === "outflow_cap" && isHacked;
            const isExpanded = expandedInvariantId === rule.id;

            return (
              <div
                key={rule.id}
                className={`relative rounded-2xl p-5 border transition-all backdrop-blur-md ${
                  isTripped
                    ? "bg-gradient-to-br from-rose-950/40 via-zinc-900/90 to-zinc-950 border-rose-500/80 shadow-lg shadow-rose-950/30"
                    : "bg-gradient-to-br from-zinc-900/60 via-zinc-900/40 to-zinc-950 border-zinc-800/80 hover:border-zinc-700/80 shadow-md"
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                          isTripped
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {rule.category}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">{rule.threshold}</span>
                    </div>

                    <h3 className="text-base font-bold text-white font-mono mt-1.5 flex items-center gap-2">
                      {rule.name}
                    </h3>
                  </div>

                  {/* Status Pill */}
                  <div className="flex items-center gap-2">
                    {isTripped ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>TRIPPED (BLOCKED)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>NOMINAL</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* State description */}
                <div className="mt-3.5 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-xs space-y-1">
                  <div className="text-[11px] text-zinc-400 font-mono">Current Evaluation State:</div>
                  <div
                    className={`font-mono font-semibold ${
                      isTripped ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {isTripped ? rule.trippedStatus : rule.nominalStatus}
                  </div>
                </div>

                <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                  {isTripped ? rule.trippedDescription : rule.normalDescription}
                </p>

                {/* Technical Rule Bar */}
                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500 text-[11px]">Rule: {rule.technicalRule}</span>
                  <button
                    onClick={() =>
                      setExpandedInvariantId(isExpanded ? null : rule.id)
                    }
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition text-[11px]"
                  >
                    <span>{isExpanded ? "Hide Spec" : "View Solidity Spec"}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Expanded Solidity Spec */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/60 animate-fadeIn">
                    {rule.storageSlot && (
                      <div className="mb-2 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                        <span>Storage Key:</span>
                        <code className="text-cyan-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          {rule.storageSlot}
                        </code>
                      </div>
                    )}
                    <pre className="p-3 rounded-xl bg-black border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
                      <code>{rule.codeSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────── */}
      {/* 4. Live Incident & Rollback Feed                     */}
      {/* ───────────────────────────────────────────────────── */}
      <div className="rounded-3xl p-6 sm:p-8 border border-zinc-800/90 bg-gradient-to-br from-zinc-950 via-zinc-900/70 to-zinc-950 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Live Incident & Rollback Feed
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time cryptographic audit log of intercepted attacks, soft-fail rollbacks, and facet quarantines
              </p>
            </div>
          </div>

          {/* Incident Count Badge */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
              {events.length} {events.length === 1 ? "Incident" : "Incidents"} Logged
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              MSTScan Connected
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by selector (0x2e1a7d4d), transaction hash, or invariant..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 transition font-mono"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Chronological Incident Cards */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-zinc-800/80 bg-zinc-950/40 text-zinc-500 text-xs font-mono space-y-2">
              <ShieldCheck className="w-8 h-8 text-zinc-600 mx-auto" />
              <div>No incidents matching the current filter.</div>
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isExpanded = expandedEventId === evt.id;

              return (
                <div
                  key={evt.id}
                  className="p-5 rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/20 via-zinc-900/60 to-zinc-950 hover:border-rose-500/50 transition-all shadow-lg"
                >
                  {/* Top Bar: Status, Block, Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black font-mono tracking-wider text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded border border-rose-900/80">
                        {evt.status}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Block #{evt.blockNumber}</span>
                      </span>
                    </div>

                    <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      <span>{evt.timestamp}</span>
                    </div>
                  </div>

                  {/* Selector & Routing Transition Pills */}
                  <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs font-mono">
                    <span className="text-zinc-400">Function Selector:</span>
                    <span className="text-cyan-300 font-bold bg-cyan-950/50 px-2.5 py-1 rounded-lg border border-cyan-800/50 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{evt.selector}</span>
                      <span className="text-zinc-500 font-normal">(withdraw)</span>
                    </span>

                    <span className="text-zinc-600">|</span>

                    <span className="text-zinc-400">Routing:</span>
                    <span className="text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-900/60 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-rose-400" />
                      <span>v{evt.badVersion} (Quarantined)</span>
                    </span>

                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />

                    <span className="text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-900/60 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>v{evt.goodVersion} (Restored Stable)</span>
                    </span>
                  </div>

                  {/* Invariant Alert Box */}
                  <div className="mt-3.5 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-zinc-400">Invariant Tripped:</span>
                      <span className="text-amber-300 font-mono font-bold">
                        {evt.invariant}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500">
                      Context: {evt.contextHash.slice(0, 16)}...
                    </span>
                  </div>

                  {/* Metadata: Triggered by & MSTScan Explorer */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-zinc-400">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-zinc-500">Guardian Trigger:</span>
                      <span className="text-zinc-300 truncate">{evt.triggeredBy}</span>
                      <button
                        onClick={() => handleCopy(evt.triggeredBy, `trigger-${evt.id}`, "Guardian Address")}
                        className="text-zinc-500 hover:text-zinc-300 transition"
                        title="Copy Trigger Address"
                      >
                        {copiedKey === `trigger-${evt.id}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                        className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1 transition"
                      >
                        <span>{isExpanded ? "Hide Forensics" : "View Forensics"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <a
                        href={`${CONTRACTS.explorer}/tx/${evt.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-800/40 text-[11px]"
                      >
                        <span>MSTScan Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Expanded Forensics Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-zinc-800/80 animate-fadeIn space-y-3 text-xs font-mono">
                      <div className="p-3.5 rounded-xl bg-black border border-zinc-800 space-y-2">
                        <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Forensic Execution Audit</span>
                          <span className="text-rose-400">STATE ROLLBACK CONFIRMED</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
                          <div>
                            <span className="text-zinc-500">Transaction Hash:</span>
                            <div className="text-zinc-300 truncate mt-0.5">{evt.txHash}</div>
                          </div>
                          <div>
                            <span className="text-zinc-500">Diamond Proxy Target:</span>
                            <div className="text-cyan-300 truncate mt-0.5">{CONTRACTS.diamond}</div>
                          </div>
                          <div>
                            <span className="text-zinc-500">Siphoned Value:</span>
                            <div className="text-rose-400 font-bold mt-0.5">0.0000 tMSTC (100% Protected)</div>
                          </div>
                          <div>
                            <span className="text-zinc-500">Remediation Action:</span>
                            <div className="text-emerald-400 font-bold mt-0.5">
                              emergencyRollback(0x2e1a7d4d, 1) Executed
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-900 text-[10px] text-zinc-500">
                          Proof signature: keccak256(RollbackContext(selector: 0x2e1a7d4d, bad: 2, good: 1, block: {evt.blockNumber}))
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────── */}
      {/* 5. EIP-2535 Diamond Architecture & Deep-Dive Info     */}
      {/* ───────────────────────────────────────────────────── */}
      <div className="rounded-3xl p-6 sm:p-8 border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Why SolGit Soft-Fail Defense Beats Standard Proxies
            </h3>
            <p className="text-xs text-zinc-400">
              Architectural comparison between legacy OpenZeppelin proxies and SolGit EIP-2535 soft-fail guard
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-[11px] uppercase">
              <XCircle className="w-4 h-4" />
              <span>Legacy Transparent / UUPS Proxies</span>
            </div>
            <ul className="text-zinc-400 space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
              <li>Monolithic implementation contract: one bug pauses the entire protocol.</li>
              <li>Emergency upgrades require deploying whole new contracts and multi-sig ceremonies.</li>
              <li>Reentrancy or math bug can drain the entire TVL before off-chain multisig acts.</li>
              <li>Users experience complete downtime and broken frontends during incidents.</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-[11px] uppercase">
              <CheckCircle2 className="w-4 h-4" />
              <span>SolGit EIP-2535 Soft-Fail Guard</span>
            </div>
            <ul className="text-emerald-200/90 space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
              <li>Granular 4-byte selector routing: only vulnerable functions are rolled back.</li>
              <li>Sub-block autonomous Guardian intervention reverts attack state instantly.</li>
              <li>Zero downtime for deposits, transfers, and balances while withdraw is healed.</li>
              <li>Permanent contract address: dApps, integrations, and indexers never disconnect.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
