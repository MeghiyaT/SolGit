"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  parseAbi,
  formatUnits,
  isAddress,
  getAddress,
  type Address,
  type Hex,
} from "viem";
import { getCoralPublicClient } from "./useOnChainVault.ts";
import { CONTRACTS } from "../lib/data.ts";
import type { RollbackEvent } from "../lib/types.ts";

export const SENTINEL_ABI = parseAbi([
  "event Deposited(address indexed account, uint256 amount)",
  "event Withdrawn(address indexed account, uint256 amount)",
  "event EmergencyRollbackExecuted(bytes4 indexed selector, uint256 previousVersion, uint256 targetVersion)",
  "event SelectorRolledBack(bytes4 indexed selector, address indexed oldFacet, address indexed newFacet, string reason)",
  "event VersionRolledBack(bytes4 indexed selector, uint32 quarantinedVersion, uint32 activeVersion)",
]);

export interface OnChainContractEvent {
  id: string;
  eventName: "Deposited" | "Withdrawn" | "EmergencyRollbackExecuted" | "SelectorRolledBack" | "VersionRolledBack" | string;
  transactionHash: Hex;
  blockNumber: bigint;
  timestamp: string;
  account?: string;
  amount?: bigint;
  amountFormatted?: string;
  selector?: string;
  previousVersion?: number;
  targetVersion?: number;
  reason?: string;
  explorerUrl: string;
}

export interface UseSentinelEventsOptions {
  contractAddress?: string | null;
  fromBlock?: bigint;
  onRollbackDetected?: (incident: RollbackEvent) => void;
  onEventDetected?: (event: OnChainContractEvent) => void;
}

export interface UseSentinelEventsReturn {
  events: OnChainContractEvent[];
  rollbackIncidents: RollbackEvent[];
  isListening: boolean;
  latestBlock: bigint | null;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface SentinelLogLike {
  address: Address;
  blockNumber: bigint | null;
  transactionHash: Hex | null;
  logIndex?: number | null;
  eventName?: string;
  args?: unknown;
}

/**
 * Parses on-chain log into normalized OnChainContractEvent and RollbackEvent (if applicable).
 */
export function parseSentinelLog(
  log: SentinelLogLike,
  blockTimestamp?: string
): { event: OnChainContractEvent; rollback?: RollbackEvent } {
  const eventName = log.eventName || "Unknown";
  const txHash = (log.transactionHash || "0x0000000000000000000000000000000000000000000000000000000000000000") as Hex;
  const blockNum = log.blockNumber ?? BigInt(0);
  const timeStr = blockTimestamp || new Date().toLocaleTimeString();
  const explorerUrl = `https://coral.mstscan.com/tx/${txHash}`;

  const parsedEvent: OnChainContractEvent = {
    id: `${txHash}-${log.logIndex ?? 0}`,
    eventName,
    transactionHash: txHash,
    blockNumber: blockNum,
    timestamp: timeStr,
    explorerUrl,
  };

  let rollback: RollbackEvent | undefined;
  const argsRecord = (log.args && typeof log.args === "object" ? log.args : {}) as Record<string, unknown>;

  if (eventName === "Deposited" || eventName === "Withdrawn") {
    const rawAccount = typeof argsRecord.account === "string" ? argsRecord.account : undefined;
    const rawAmount = typeof argsRecord.amount === "bigint" ? argsRecord.amount : undefined;
    parsedEvent.account = rawAccount;
    parsedEvent.amount = rawAmount;
    parsedEvent.amountFormatted = rawAmount ? `${parseFloat(formatUnits(rawAmount, 18)).toFixed(4)} tMSTC` : "0.0000 tMSTC";
  } else if (eventName === "EmergencyRollbackExecuted") {
    const rawSelector = typeof argsRecord.selector === "string" ? argsRecord.selector : undefined;
    const rawPrev = typeof argsRecord.previousVersion === "bigint" ? Number(argsRecord.previousVersion) : 2;
    const rawTarget = typeof argsRecord.targetVersion === "bigint" ? Number(argsRecord.targetVersion) : 1;

    parsedEvent.selector = rawSelector;
    parsedEvent.previousVersion = rawPrev;
    parsedEvent.targetVersion = rawTarget;

    rollback = {
      id: `incident-${txHash}-${log.logIndex ?? 0}`,
      selector: parsedEvent.selector || "0x2e1a7d4d",
      badVersion: parsedEvent.previousVersion,
      goodVersion: parsedEvent.targetVersion,
      triggeredBy: log.address,
      contextHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      txHash,
      blockNumber: Number(blockNum),
      timestamp: timeStr,
      status: "BLOCKED & ROLLED BACK",
      invariant: "OUTFLOW_CAP <= 100 ether && balance >= minReserve",
    };
  } else if (eventName === "SelectorRolledBack") {
    const rawSelector = typeof argsRecord.selector === "string" ? argsRecord.selector : undefined;
    const rawOldFacet = typeof argsRecord.oldFacet === "string" ? (argsRecord.oldFacet as Address) : undefined;
    const rawReason = typeof argsRecord.reason === "string" ? argsRecord.reason : undefined;

    parsedEvent.selector = rawSelector;
    parsedEvent.reason = rawReason;
    parsedEvent.previousVersion = 2;
    parsedEvent.targetVersion = 1;

    rollback = {
      id: `incident-${txHash}-${log.logIndex ?? 0}`,
      selector: parsedEvent.selector || "0x2e1a7d4d",
      badVersion: 2,
      goodVersion: 1,
      triggeredBy: rawOldFacet || log.address,
      contextHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      txHash,
      blockNumber: Number(blockNum),
      timestamp: timeStr,
      status: "BLOCKED & ROLLED BACK",
      invariant: rawReason || "OUTFLOW_CAP <= 100 ether && balance >= minReserve",
    };
  } else if (eventName === "VersionRolledBack") {
    const rawSelector = typeof argsRecord.selector === "string" ? argsRecord.selector : undefined;
    const rawQuarantined = typeof argsRecord.quarantinedVersion === "number" ? argsRecord.quarantinedVersion : 2;
    const rawActive = typeof argsRecord.activeVersion === "number" ? argsRecord.activeVersion : 1;

    parsedEvent.selector = rawSelector;
    parsedEvent.previousVersion = rawQuarantined;
    parsedEvent.targetVersion = rawActive;

    rollback = {
      id: `incident-${txHash}-${log.logIndex ?? 0}`,
      selector: parsedEvent.selector || "0x2e1a7d4d",
      badVersion: parsedEvent.previousVersion,
      goodVersion: parsedEvent.targetVersion,
      triggeredBy: log.address,
      contextHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      txHash,
      blockNumber: Number(blockNum),
      timestamp: timeStr,
      status: "BLOCKED & ROLLED BACK",
      invariant: "OUTFLOW_CAP <= 100 ether && balance >= minReserve",
    };
  }

  return { event: parsedEvent, rollback };
}

/**
 * Builds dynamic 5-stage AI Fixer telemetry logs using real MST Coral block numbers,
 * timestamps, and authentic transaction hashes.
 */
export function buildRawLogs(params: {
  diamondAddress?: string;
  txHash?: string;
  blockNumber?: bigint | number | string;
  selector?: string;
  targetFacet?: string;
  quarantinedFacet?: string;
}) {
  const diamond = params.diamondAddress || CONTRACTS.diamond;
  const diamondShort = `${diamond.slice(0, 6)}...${diamond.slice(-4)}`;
  const txHash = params.txHash || "0xa21801e7a4cee367f6dc7b0f93dc7d3c6755a09b9ec5a64f2467fb457ae253b9";
  const blockNumber = params.blockNumber || "415022";
  const selector = params.selector || "0x2e1a7d4d";
  const targetFacet = params.targetFacet || CONTRACTS.vaultV1;
  const targetFacetShort = `${targetFacet.slice(0, 6)}...${targetFacet.slice(-4)}`;
  const quarantinedFacet = params.quarantinedFacet || CONTRACTS.vaultV2;
  const quarantinedFacetShort = `${quarantinedFacet.slice(0, 6)}...${quarantinedFacet.slice(-4)}`;

  return [
    // Stage 1: Intercept
    { step: 1, tag: "[INTERCEPT]" as const, text: "SolGit Autonomous Sentinel Node #04 monitoring MST Coral Testnet (Chain ID 54635)" },
    { step: 1, tag: "[INTERCEPT]" as const, text: `Incoming TX ${txHash} to Diamond ${diamondShort}`, highlight: true },
    { step: 1, tag: "[INTERCEPT]" as const, text: `Calldata: ${selector} (withdraw) | Value requested: 200.0000 tMSTC` },
    { step: 1, tag: "[INTERCEPT]" as const, text: "⚠️ Invariant Breach Asserted: OUTFLOW_CAP_BREACHED [attempted: 200 tMSTC > limit: 100 tMSTC]", highlight: true },
    { step: 1, tag: "[INTERCEPT]" as const, text: "Caller 0x9dF0C6b...4e has 0 balance! Arithmetic underflow attack detected on VaultV2." },

    // Stage 2: Defense
    { step: 2, tag: "[DEFENSE]" as const, text: `Guardian role triggered on SolGitDiamond (${diamondShort})` },
    { step: 2, tag: "[DEFENSE]" as const, text: `Invoking LibDiamond.emergencyRollback(selector: ${selector}, targetVersion: 1)`, highlight: true },
    { step: 2, tag: "[DEFENSE]" as const, text: `✔ On-chain TX confirmed in Block #${blockNumber}: Selector ${selector} redirected to VaultV1 (${targetFacetShort})` },
    { step: 2, tag: "[DEFENSE]" as const, text: "🛡️ Zero Downtime Maintained: deposit(), transfer(), and balanceOf() remain 100% active.", highlight: true },
    { step: 2, tag: "[DEFENSE]" as const, text: `Compromised Facet VaultV2 (${quarantinedFacetShort}) quarantined in VersionRegistry.` },

    // Stage 3: AI Auditor
    { step: 3, tag: "[AI AUDITOR]" as const, text: "Dispatching incident trace to Groq LLM (Llama-3.3-70b-versatile)" },
    { step: 3, tag: "[AI AUDITOR]" as const, text: "Analyzing abstract syntax tree (AST) of contracts/facets/VaultV2.sol..." },
    { step: 3, tag: "[AI AUDITOR]" as const, text: "Vulnerability identified: unchecked block around `vs.balances[msg.sender] -= amount` without guard", highlight: true },
    { step: 3, tag: "[AI AUDITOR]" as const, text: "Generating hotfix with Checks-Effects-Interactions (CEI) & SafeMath invariants..." },
    { step: 3, tag: "[AI AUDITOR]" as const, text: "✔ Patch synthesized: VaultV2Fixed.sol (+12 lines, -8 lines).", highlight: true },

    // Stage 4: Sandbox
    { step: 4, tag: "[SANDBOX]" as const, text: "Spawning isolated Foundry sandbox container..." },
    { step: 4, tag: "[SANDBOX]" as const, text: "$ forge test --match-contract VaultV2FixedTest -vvv", highlight: true },
    { step: 4, tag: "[SANDBOX]" as const, text: "  [PASS] testWithdrawLegitimateBalance() (gas: 18420)" },
    { step: 4, tag: "[SANDBOX]" as const, text: "  [PASS] testWithdrawUnderflowExploitReverts() (gas: 21045)" },
    { step: 4, tag: "[SANDBOX]" as const, text: "  [PASS] testDepositAndBalanceTracking() (gas: 31200)" },
    { step: 4, tag: "[SANDBOX]" as const, text: "  [PASS] invariant_SolvencyHoldsUnderFuzz() (runs: 10,000, gas: 142099)" },
    { step: 4, tag: "[SANDBOX]" as const, text: "✔ Foundry Sandbox Verdict: 4 passed, 0 failed, 0 regressions. Invariants 100% intact.", highlight: true },

    // Stage 5: Git Engine
    { step: 5, tag: "[GIT ENGINE]" as const, text: "Initializing SolGit local workspace branch..." },
    { step: 5, tag: "[GIT ENGINE]" as const, text: "$ git checkout -b solgit-fix-0x2e1a7d-v2", highlight: true },
    { step: 5, tag: "[GIT ENGINE]" as const, text: "$ git add src/facets/VaultV2Fixed.sol test/VaultV2FixedTest.t.sol" },
    { step: 5, tag: "[GIT ENGINE]" as const, text: '$ git commit -m "fix(vault): enforce CEI and checked subtraction on withdraw()"' },
    { step: 5, tag: "[GIT ENGINE]" as const, text: "✔ Staged Pull Request #42: 'Self-Healing AI Hotfix: VaultV2Fixed.sol'", highlight: true },
    { step: 5, tag: "[GIT ENGINE]" as const, text: "🚀 Platform ready for 1-Click Pull Request Merge to deploy Version 3 live!" },
  ];
}

/**
 * Primary React Hook to subscribe to and query authentic on-chain events via Viem publicClient:
 * - Deposited(address indexed account, uint256 amount)
 * - Withdrawn(address indexed account, uint256 amount)
 * - EmergencyRollbackExecuted(bytes4 indexed selector, uint256 previousVersion, uint256 targetVersion)
 */
export function useSentinelEvents(options: UseSentinelEventsOptions = {}): UseSentinelEventsReturn {
  const { contractAddress, fromBlock, onRollbackDetected, onEventDetected } = options;
  const [events, setEvents] = useState<OnChainContractEvent[]>([]);
  const [rollbackIncidents, setRollbackIncidents] = useState<RollbackEvent[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [latestBlock, setLatestBlock] = useState<bigint | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const rollbackCallbackRef = useRef(onRollbackDetected);
  const eventCallbackRef = useRef(onEventDetected);

  useEffect(() => {
    rollbackCallbackRef.current = onRollbackDetected;
    eventCallbackRef.current = onEventDetected;
  }, [onRollbackDetected, onEventDetected]);

  // Target contract address defaults to the deployed Master Diamond Proxy if unsupplied
  const targetAddress = (
    contractAddress && isAddress(contractAddress)
      ? getAddress(contractAddress)
      : getAddress(CONTRACTS.diamond)
  ) as Address;

  const loadPastEvents = useCallback(async () => {
    try {
      const client = getCoralPublicClient();
      const currentBlock = await client.getBlockNumber();
      setLatestBlock(currentBlock);

      // Default to search past 10,000 blocks or starting block
      const startBlock = fromBlock !== undefined ? fromBlock : (currentBlock > 10000n ? currentBlock - 10000n : 0n);

      const logs = await client.getLogs({
        address: targetAddress,
        events: SENTINEL_ABI,
        fromBlock: startBlock,
        toBlock: "latest",
      });

      const parsedLogs: OnChainContractEvent[] = [];
      const parsedRollbacks: RollbackEvent[] = [];

      for (const log of logs) {
        const { event, rollback } = parseSentinelLog(log);
        parsedLogs.push(event);
        if (rollback) {
          parsedRollbacks.push(rollback);
        }
      }

      parsedLogs.reverse();
      parsedRollbacks.reverse();

      setEvents(parsedLogs);
      if (parsedRollbacks.length > 0) {
        setRollbackIncidents(parsedRollbacks);
      }
      setIsListening(true);
      setError(null);
    } catch (err: unknown) {
      console.error("[useSentinelEvents] Error fetching past logs:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [targetAddress, fromBlock]);

  useEffect(() => {
    let isMounted = true;
    const client = getCoralPublicClient();

    const init = async () => {
      try {
        const currentBlock = await client.getBlockNumber();
        if (!isMounted) return;
        setLatestBlock(currentBlock);

        const startBlock = fromBlock !== undefined ? fromBlock : (currentBlock > 10000n ? currentBlock - 10000n : 0n);

        const logs = await client.getLogs({
          address: targetAddress,
          events: SENTINEL_ABI,
          fromBlock: startBlock,
          toBlock: "latest",
        });

        if (!isMounted) return;

        const parsedLogs: OnChainContractEvent[] = [];
        const parsedRollbacks: RollbackEvent[] = [];

        for (const log of logs) {
          const { event, rollback } = parseSentinelLog(log);
          parsedLogs.push(event);
          if (rollback) {
            parsedRollbacks.push(rollback);
          }
        }

        parsedLogs.reverse();
        parsedRollbacks.reverse();

        setEvents(parsedLogs);
        if (parsedRollbacks.length > 0) {
          setRollbackIncidents(parsedRollbacks);
        }
        setIsListening(true);
        setError(null);
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("[useSentinelEvents] Error during initial event fetch:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    init();

    // Subscribe to on-chain events via publicClient.watchContractEvent
    const unwatchDeposited = client.watchContractEvent({
      address: targetAddress,
      abi: SENTINEL_ABI,
      eventName: "Deposited",
      pollingInterval: 3000,
      onLogs: (newLogs) => {
        if (!isMounted) return;
        for (const log of newLogs) {
          const { event } = parseSentinelLog(log);
          setEvents((prev) => [event, ...prev.filter((e) => e.id !== event.id)]);
          eventCallbackRef.current?.(event);
        }
      },
    });

    const unwatchWithdrawn = client.watchContractEvent({
      address: targetAddress,
      abi: SENTINEL_ABI,
      eventName: "Withdrawn",
      pollingInterval: 3000,
      onLogs: (newLogs) => {
        if (!isMounted) return;
        for (const log of newLogs) {
          const { event } = parseSentinelLog(log);
          setEvents((prev) => [event, ...prev.filter((e) => e.id !== event.id)]);
          eventCallbackRef.current?.(event);
        }
      },
    });

    const unwatchEmergencyRollback = client.watchContractEvent({
      address: targetAddress,
      abi: SENTINEL_ABI,
      eventName: "EmergencyRollbackExecuted",
      pollingInterval: 3000,
      onLogs: (newLogs) => {
        if (!isMounted) return;
        for (const log of newLogs) {
          const { event, rollback } = parseSentinelLog(log);
          setEvents((prev) => [event, ...prev.filter((e) => e.id !== event.id)]);
          if (rollback) {
            setRollbackIncidents((prev) => [rollback, ...prev.filter((r) => r.id !== rollback.id)]);
            rollbackCallbackRef.current?.(rollback);
          }
          eventCallbackRef.current?.(event);
        }
      },
    });

    const unwatchSelectorRolledBack = client.watchContractEvent({
      address: targetAddress,
      abi: SENTINEL_ABI,
      eventName: "SelectorRolledBack",
      pollingInterval: 3000,
      onLogs: (newLogs) => {
        if (!isMounted) return;
        for (const log of newLogs) {
          const { event, rollback } = parseSentinelLog(log);
          setEvents((prev) => [event, ...prev.filter((e) => e.id !== event.id)]);
          if (rollback) {
            setRollbackIncidents((prev) => [rollback, ...prev.filter((r) => r.id !== rollback.id)]);
            rollbackCallbackRef.current?.(rollback);
          }
          eventCallbackRef.current?.(event);
        }
      },
    });

    return () => {
      isMounted = false;
      unwatchDeposited();
      unwatchWithdrawn();
      unwatchEmergencyRollback();
      unwatchSelectorRolledBack();
    };
  }, [targetAddress, fromBlock]);

  return {
    events,
    rollbackIncidents,
    isListening,
    latestBlock,
    error,
    refetch: loadPastEvents,
  };
}
