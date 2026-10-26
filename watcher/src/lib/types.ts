import type { Address, Hex } from "viem";

export interface RollbackIncident {
  selector: Hex;
  badVersion: number;
  goodVersion: number;
  triggeredBy: Address;
  contextHash: Hex;
  blockNumber: bigint;
  transactionHash: Hex;
  timestamp: number;
}

export interface FixResult {
  selector: Hex;
  badVersion: number;
  fixedCode: string;
  diff: string;
  explanation: string;
  testsPassed: boolean;
  branchName?: string;
  prUrl?: string;
}
