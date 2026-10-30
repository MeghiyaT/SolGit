export type TabType = 'code' | 'commits' | 'pulls' | 'security' | 'loupe';

export type ViewType = 'dashboard' | 'repository';

export interface Web3WalletState {
  address: `0x${string}` | null;
  checksumAddress: string | null;
  balance: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  isWrongNetwork: boolean;
  error: string | null;
}

export interface Repository {
  id: string;
  name: string;
  owner: string;
  description: string;
  isPrivate: boolean;
  updatedAt: string;
  contractAddress: string;
  facetCount: number;
  guardianActive: boolean;
}

export interface VersionCommit {
  version: number;
  implementation: string;
  codeHash: string;
  status: 'Stable' | 'Active' | 'Quarantined';
  timestamp: number;
  author: string;
  message: string;
}

export interface SelectorFeature {
  selector: string;
  signature: string;
  name: string;
  description: string;
  currentVersion: number;
  stableVersion: number;
  history: VersionCommit[];
}

export interface RollbackEvent {
  id: string;
  selector: string;
  badVersion: number;
  goodVersion: number;
  triggeredBy: string;
  contextHash: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  status: 'BLOCKED & ROLLED BACK';
  invariant: string;
}

export interface RepoFile {
  name: string;
  path: string;
  size: string;
  lines: number;
  description: string;
  lastCommit: {
    message: string;
    author: string;
    time: string;
    sha: string;
  };
  content: string;
  language: 'solidity' | 'markdown' | string;
}

export interface PullRequestCheck {
  name: string;
  status: 'passed' | 'failed' | 'running';
  duration?: string;
}

export interface PullRequestItem {
  id: number;
  title: string;
  status: 'open' | 'merged' | 'closed';
  author: string;
  branchFrom: string;
  branchTo: string;
  createdAt: string;
  commentsCount: number;
  description: string;
  checks: PullRequestCheck[];
  filesChanged: number;
  additions: number;
  deletions: number;
}

export interface ToastNotification {
  id: string;
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}
