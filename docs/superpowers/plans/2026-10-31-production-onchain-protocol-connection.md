# Production On-Chain Protocol Connection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a 100% production-ready architecture where SolGit Dashboard and external client dApps interact strictly via the **MST Coral Blockchain** (Chain ID: `54635`, RPC: `https://coralrpc.mstblockchain.com`), removing all temporary local mock bridges (`/api/vault/state`).

**Architecture:** 
1. The smart contract (SolGit EIP-2535 Diamond Proxy on MST Coral) is the single source of truth.
2. External dApps interact only with the contract address using standard Web3 wallet calls (`deposit`, `withdraw`).
3. SolGit Dashboard directly queries on-chain state (`publicClient.getBalance`, `totalDeposits`, `watchContractEvent`) via the MST Coral RPC.
4. When an invariant is breached on-chain, the contract's Guardian facet executes `emergencyRollback`, emitting an on-chain event picked up by SolGit Sentinel to trigger automated AI hotfix PR creation.

**Tech Stack:** Solidity 0.8.24, Foundry, Viem 2.x, Next.js 16 (App Router), React 18/19, TailwindCSS.

**Spec Reference:** `docs/superpowers/plans/2026-10-31-production-onchain-protocol-connection.md`

---

## Global Constraints

- **No Artificial Bridges:** SolGit must never connect to an external dApp's frontend codebase or rely on mock HTTP sync routes (`/api/vault/state`).
- **Chain of Truth:** All balances, transactions, and events must be readable from the MST Coral Testnet RPC (`https://coralrpc.mstblockchain.com`, Chain ID `54635`).
- **Contract Name Accuracy:** The active implementation card in SolGit Security must dynamically render the user's uploaded repository contract name (e.g. `core-vault (v1 Stable)`), never hardcoded mocks.
- **Zero UI Warnings:** Every task must maintain zero ESLint errors/warnings (`npm run lint`), passing unit tests (`npm test`), and clean production builds (`npm run build`).

---

## Review Focus & Edge Cases

1. **RPC Rate Limiting & Fallback:** Public testnet RPCs may drop requests or take >2s. Implement graceful fallback/retry and local caching in Viem publicClient.
2. **Zero-Balance Contracts:** Freshly deployed contracts have 0 tMSTC balance. The UI must display `0.0000 tMSTC` cleanly without NaN or rendering crashes.
3. **Wallet Network Mismatches:** When a user connects MetaMask or an external wallet on the wrong chain, the dApp must prompt to switch to MST Coral (Chain ID `54635`).
4. **Autonomous Event Reconciliation:** In the event of an on-chain soft-fail rollback, the event log must display the authentic MST Coral transaction hash with a valid link to `https://coralscan.mstblockchain.com/tx/0x...`.
5. **No Broken Tab Switching:** Leaving and returning to the Security tab must read the current on-chain state without resetting UI states.

---

## Tasks

### Task 1: Live On-Chain Balance & Telemetry Hook in SolGit Dashboard

**Files:**
- Create: `dashboard/src/hooks/useOnChainVault.ts`
- Modify: `dashboard/src/app/page.tsx`
- Modify: `dashboard/src/components/tabs/SecurityTab.tsx`
- Delete: `dashboard/src/app/api/vault/state/route.ts`
- Test: `dashboard/src/test/onchain.test.ts`

- [x] **Step 1: Write unit test for on-chain telemetry reader**
  Create `dashboard/src/test/onchain.test.ts` verifying that `getBalance` correctly formats wei to ether string and handles fallback cleanly.
- [x] **Step 2: Run test to confirm expectations**
  Run `npm --prefix dashboard test` and confirm test structure.
- [x] **Step 3: Implement `useOnChainVault.ts`**
  Build a dedicated Viem hook that creates a `publicClient` on MST Coral Testnet (`https://coralrpc.mstblockchain.com`), polls the contract's balance every 3 seconds, and tracks block numbers.
- [x] **Step 4: Update `dashboard/src/app/page.tsx` and `SecurityTab.tsx`**
  - Integrate `useOnChainVault` using `activeRepo?.contractAddress`.
  - Pass the live on-chain balance to `SecurityTab`.
  - Remove all remaining polling to `/api/vault/state`.
- [x] **Step 5: Delete `/api/vault/state/route.ts`**
  Completely remove the temporary local mock bridge.
- [x] **Step 6: Verify linting and build**
  Run `npm --prefix dashboard run lint && npm --prefix dashboard run build`.

---

### Task 2: Real On-Chain Staking & Withdraw Transactions in `demo-dapp`

**Files:**
- Modify: `demo-dapp/src/App.tsx`
- Modify: `demo-dapp/src/lib/contracts.ts`

- [x] **Step 1: Configure real testnet contract addresses and ABI**
  Ensure `DEFAULT_DIAMOND_ADDRESS` matches the deployed SolGit Diamond contract on MST Coral (`0x3348f760E980326079011707B9E40a6b29910D69` or the user's active repository address).
- [x] **Step 2: Implement real wallet transaction execution in `handleDeposit`**
  - When Alice or an Injected Web3 wallet deposits, execute `walletClient.sendTransaction` or `walletClient.writeContract` with native tMSTC on MST Coral Testnet.
  - Wait for receipt using `publicClient.waitForTransactionReceipt`.
- [x] **Step 3: Implement real exploit execution in `handleWithdraw`**
  - When withdrawing from an account with 0 balance, send the actual transaction call to `withdraw(200 ether)` on MST Coral.
  - Intercept the on-chain revert / `InvariantBreached` reason and display the real transaction receipt on MSTScan.
- [x] **Step 4: Remove mock fetch calls to `localhost:3000`**
  Purge all `fetch("http://localhost:3000/api/vault/state")` calls from `demo-dapp/src/App.tsx`.
- [x] **Step 5: Verify build**
  Run `npm --prefix demo-dapp run build`.

---

### Task 3: Autonomous Event Listener & Sentinel Integration

**Files:**
- Modify: `dashboard/src/components/AIFixerConsole.tsx`
- Modify: `dashboard/src/components/tabs/SecurityTab.tsx`
- Modify: `watcher/src/fixer.ts`

- [x] **Step 1: Subscribe SolGit Sentinel to real MST Coral contract events**
  Use `publicClient.watchContractEvent` in `dashboard` to listen for:
  - `Deposited(address,uint256)`
  - `Withdrawn(address,uint256)`
  - `EmergencyRollbackExecuted(bytes4,uint256,uint256)`
- [x] **Step 2: Update Security tab Incident Log with real transaction hashes**
  Populate `events` in `SecurityTab.tsx` with authentic transaction hashes from MST Coral Testnet, linking out to `https://coral.mstscan.com/tx/0x...`.
- [x] **Step 3: Trigger AIFixerConsole on authentic on-chain rollback events**
  When an `EmergencyRollbackExecuted` log is detected on-chain, automatically activate the 5-stage AI Fixer telemetry console and stage PR #42.
- [x] **Step 4: Run Foundry test suite**
  Run `forge test` to ensure all 37 contract invariant tests pass.

---

### Task 4: Production Verification & Vercel Deployment Guide

**Files:**
- Modify: `dashboard/vercel.json`
- Modify: `README.md`

- [x] **Step 1: Verify all tests across all workspaces**
  - `forge test` (37/37 passing)
  - `npm --prefix dashboard test` (all tests passing)
  - `npm --prefix dashboard run lint` (0 errors, 0 warnings)
  - `npm --prefix dashboard run build` (Next.js production build succeeds)
  - `npm --prefix demo-dapp run build` (Vite production build succeeds)
- [x] **Step 2: Document Vercel deployment instructions**
  Provide clear instructions and CLI commands for deploying SolGit Dashboard to Vercel with necessary environment variables.

