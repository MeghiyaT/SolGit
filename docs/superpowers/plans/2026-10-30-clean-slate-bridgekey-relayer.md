# Clean-Slate, BridgeKey Gating, Relayer & Supabase Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all mock data from the SolGit platform, enforce BridgeKey wallet connection for contract uploads, implement a gasless relayer engine on MST Coral Testnet, add new user nickname onboarding, and persist data in Supabase.

**Architecture:** A clean-slate Next.js frontend with Supabase cloud persistence for user nicknames and repositories. An API relayer route (`/api/relayer/deploy`) sponsored by the funded operator key (50 tMSTC balance on MST Coral Testnet) handles gasless contract deployments assigning on-chain ownership to the user's BridgeKey address. BridgeKey gating prevents unauthorized contract uploads.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS v4, viem, `@supabase/supabase-js`, MST Coral Testnet (Chain ID 54635).

**Spec:** `docs/superpowers/specs/2026-10-30-clean-slate-bridgekey-relayer-design.md`

## Global Constraints

- Network: MST Coral Testnet, Chain ID `54635`, RPC `https://coralrpc.mstblockchain.com`, Explorer `https://coral.mstscan.com`.
- Supabase Project URL: `https://mfdyorztvcibwzhnqmsi.supabase.co`.
- Currency: `tMSTC` (18 Decimals).
- Zero mock repositories, selectors, pull requests, or events upon initialization.
- Relayer must designate the user's connected BridgeKey wallet as the contract owner on-chain.

## Review Focus

- Disconnected wallet attempts to click "New" or "Upload Contract": must show an informative prompt to connect BridgeKey, not crash or open modal.
- First-time BridgeKey wallet connection: must prompt for nickname only if address does not exist in Supabase `users`.
- LocalStorage cleared: upon reconnecting BridgeKey, user nickname and repositories must restore from Supabase.
- Relayer error resilience: if Coral RPC experiences congestion, return clean error feedback and toast notification.
- Empty states: all views (LeftSidebar, CenterFeed, CodeTab) must render cleanly with 0 repositories without throwing undefined property errors.

---

### Task 1: Coral Network Configuration & Empty Mock Data

**Files:**
- Modify: `dashboard/src/lib/mstChain.ts`
- Modify: `dashboard/src/lib/data.ts`
- Modify: `.env`
- Create: `dashboard/.env.local`

**Interfaces:**
- Consumes: Verified Coral parameters (`54635`, `coralrpc.mstblockchain.com`, `coral.mstscan.com`)
- Produces: Updated `mstTestnet` chain object, empty initial state arrays (`INITIAL_REPOSITORIES = []`, `INITIAL_SELECTORS = []`, `INITIAL_EVENTS = []`, `INITIAL_PULL_REQUESTS = []`)

- [ ] **Step 1: Update `.env` and create `dashboard/.env.local` with Coral RPC & Supabase keys**
  Set `MST_TESTNET_RPC_URL=https://coralrpc.mstblockchain.com`, `NEXT_PUBLIC_SUPABASE_URL=https://mfdyorztvcibwzhnqmsi.supabase.co`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>`, `SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>`.

- [ ] **Step 2: Update `dashboard/src/lib/mstChain.ts`**
  Change `MST_CHAIN_ID` to `54635`, `MST_RPC_URL` to `"https://coralrpc.mstblockchain.com"`, `MST_EXPLORER_URL` to `"https://coral.mstscan.com"`, and update `mstTestnet` chain definition with `id: 54635` and name `"MST Coral Testnet"`.

- [ ] **Step 3: Empty mock data in `dashboard/src/lib/data.ts`**
  Set `INITIAL_REPOSITORIES: Repository[] = []`, `INITIAL_SELECTORS: SelectorFeature[] = []`, `INITIAL_EVENTS: RollbackEvent[] = []`, `INITIAL_PULL_REQUESTS: PullRequestItem[] = []`. Update `CONTRACTS.chainId = 54635`, `CONTRACTS.rpcUrl = "https://coralrpc.mstblockchain.com"`, `CONTRACTS.explorer = "https://coral.mstscan.com"`.

- [ ] **Step 4: Verify TypeScript compilation**
  Run `./dashboard/node_modules/.bin/tsc --project dashboard/tsconfig.json --noEmit`
  Expected: PASS with 0 errors.

- [ ] **Step 5: Commit changes**
  ```bash
  git add dashboard/src/lib/mstChain.ts dashboard/src/lib/data.ts .env dashboard/.env.local
  git commit -m "feat(network): configure MST Coral Testnet (54635) and clear mock data"
  ```

---

### Task 2: Supabase Client & Backend API Routes (`/api/user`, `/api/repos`)

**Files:**
- Modify: `dashboard/package.json`
- Create: `dashboard/src/lib/supabase.ts`
- Create: `dashboard/src/app/api/user/route.ts`
- Create: `dashboard/src/app/api/repos/route.ts`

**Interfaces:**
- Consumes: Supabase credentials from environment
- Produces: `supabase` client, `GET /api/user?address={address}`, `POST /api/user`, `GET /api/repos?address={address}`, `POST /api/repos`

- [ ] **Step 1: Install `@supabase/supabase-js`**
  Run: `npm --prefix dashboard install @supabase/supabase-js`

- [ ] **Step 2: Create `dashboard/src/lib/supabase.ts`**
  Export `supabase` client initialized with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY` as fallback).

- [ ] **Step 3: Implement `dashboard/src/app/api/user/route.ts`**
  - `GET`: Query `users` table for `address`. Return `{ user: data[0] || null }`.
  - `POST`: Upsert `{ address, nickname, updated_at: new Date().toISOString() }` into `users`. Return `{ success: true, user }`. Include graceful fallback to in-memory/file storage if Supabase tables are not yet migrated.

- [ ] **Step 4: Implement `dashboard/src/app/api/repos/route.ts`**
  - `GET`: Query `repositories` table for all or by `owner_address`. Return `{ repositories: data || [] }`.
  - `POST`: Insert `{ id, name, owner_address, owner_nickname, description, contract_address, tx_hash, sol_code, is_private }` into `repositories`. Return `{ success: true, repository }`.

- [ ] **Step 5: Typecheck & verify API routes**
  Run `./dashboard/node_modules/.bin/tsc --project dashboard/tsconfig.json --noEmit`
  Expected: PASS with 0 errors.

- [ ] **Step 6: Commit changes**
  ```bash
  git add dashboard/package.json dashboard/package-lock.json dashboard/src/lib/supabase.ts dashboard/src/app/api/user/route.ts dashboard/src/app/api/repos/route.ts
  git commit -m "feat(api): implement Supabase user and repository API routes"
  ```

---

### Task 3: Nickname Onboarding Modal & BridgeKey TopNav Display

**Files:**
- Create: `dashboard/src/components/wallet/NicknameModal.tsx`
- Modify: `dashboard/src/components/wallet/WalletButton.tsx`
- Modify: `dashboard/src/components/TopNav.tsx`
- Modify: `dashboard/src/hooks/useWeb3Wallet.tsx`
- Modify: `dashboard/src/app/page.tsx`

**Interfaces:**
- Consumes: `useWeb3Wallet`, `POST /api/user`
- Produces: Nickname prompt modal for first-time wallet connect, user nickname state, "Edit Nickname" dropdown action

- [ ] **Step 1: Create `dashboard/src/components/wallet/NicknameModal.tsx`**
  Create accessible modal with input for developer nickname (3-24 alphanumeric characters + dashes/underscores), input validation, submit handler that calls `POST /api/user` and triggers `onNicknameSaved(nickname)`.

- [ ] **Step 2: Update `WalletButton.tsx` and `useWeb3Wallet.tsx`**
  - Update connection button text to "Connect BridgeKey".
  - In `useWeb3Wallet.tsx`, track `nickname: string | null` and expose `setNickname: (name: string) => void`.
  - In `WalletButton.tsx`, render nickname beside the identicon avatar (e.g. `satoshi (0x0318...1493)`). Add "Edit Nickname" button to the dropdown menu that re-opens the NicknameModal.

- [ ] **Step 3: Integrate Nickname flow into `dashboard/src/app/page.tsx`**
  When wallet connects: query `GET /api/user?address={address}`. If user exists, populate nickname. If not, open `isNicknameModalOpen`. Update greeting banner to reflect nickname: *"Good afternoon, {nickname}!"*.

- [ ] **Step 4: Typecheck & verify component integration**
  Run `./dashboard/node_modules/.bin/tsc --project dashboard/tsconfig.json --noEmit`
  Expected: PASS with 0 errors.

- [ ] **Step 5: Commit changes**
  ```bash
  git add dashboard/src/components/wallet/NicknameModal.tsx dashboard/src/components/wallet/WalletButton.tsx dashboard/src/components/TopNav.tsx dashboard/src/hooks/useWeb3Wallet.tsx dashboard/src/app/page.tsx
  git commit -m "feat(wallet): add first-time user nickname onboarding and BridgeKey branding"
  ```

---

### Task 4: Wallet Gating & Clean Empty States

**Files:**
- Modify: `dashboard/src/components/dashboard/LeftSidebar.tsx`
- Modify: `dashboard/src/components/dashboard/CenterFeed.tsx`
- Modify: `dashboard/src/components/tabs/CodeTab.tsx`
- Modify: `dashboard/src/components/TopNav.tsx`
- Modify: `dashboard/src/app/page.tsx`

**Interfaces:**
- Consumes: `wallet.isConnected`, `repos`
- Produces: Intercepted "Connect BridgeKey" alert dialog on unauthenticated upload clicks, empty state cards across LeftSidebar, CenterFeed, and CodeTab

- [ ] **Step 1: Implement Wallet Gating in `LeftSidebar.tsx` and `TopNav.tsx`**
  When clicking "+ New" or "Upload smart contract":
  - If `!wallet.isConnected`: display an alert or toast: *"BridgeKey Wallet Required: Please connect your BridgeKey wallet to create repositories and deploy contracts on MST Coral."*
  - If `wallet.isConnected`: proceed with opening `NewRepoModal`.

- [ ] **Step 2: Add GitHub-Style Empty State to `LeftSidebar.tsx`**
  When `repos.length === 0`, render:
  - Book icon in rounded container
  - Title: "No repositories found"
  - Subtitle: "Upload a smart contract or create a new repository to get started."
  - Action button: "Create repository" (triggers gated modal).

- [ ] **Step 3: Add Empty States to `CenterFeed.tsx` & `CodeTab.tsx`**
  - In `CenterFeed.tsx`: render empty state when `pullRequests.length === 0` ("No active pull requests") and when `recentEvents.length === 0` ("No contract events recorded yet").
  - In `CodeTab.tsx`: if no repo is selected or repos list is empty, display an empty state inviting the user to select or deploy their first contract.

- [ ] **Step 4: Typecheck & verify empty state rendering**
  Run `./dashboard/node_modules/.bin/tsc --project dashboard/tsconfig.json --noEmit`
  Expected: PASS with 0 errors.

- [ ] **Step 5: Commit changes**
  ```bash
  git add dashboard/src/components/dashboard/LeftSidebar.tsx dashboard/src/components/dashboard/CenterFeed.tsx dashboard/src/components/tabs/CodeTab.tsx dashboard/src/components/TopNav.tsx dashboard/src/app/page.tsx
  git commit -m "feat(ui): add BridgeKey wallet gating and GitHub-style empty states"
  ```

---

### Task 5: Relayer Deployment Engine & Live Coral MSTScan Uploader

**Files:**
- Create: `dashboard/src/app/api/relayer/deploy/route.ts`
- Modify: `dashboard/src/components/dashboard/NewRepoModal.tsx`
- Modify: `dashboard/src/app/page.tsx`

**Interfaces:**
- Consumes: `PRIVATE_KEY` (50 tMSTC on Coral Testnet), `ownerAddress`, `ownerNickname`, `solCode`
- Produces: `/api/relayer/deploy` endpoint, live `coral.mstscan.com/tx/...` links, real contract deployment

- [ ] **Step 1: Create `dashboard/src/app/api/relayer/deploy/route.ts`**
  - Read `PRIVATE_KEY` from process.env / `.env`.
  - Connect `viem` `WalletClient` with `mstTestnet` (Chain ID 54635, `https://coralrpc.mstblockchain.com`).
  - Deploy facet or Diamond proxy on MST Coral, setting `ownerAddress` as contract owner.
  - Return `{ success: true, contractAddress, txHash, txUrl: "https://coral.mstscan.com/tx/" + txHash, explorerUrl: "https://coral.mstscan.com/address/" + contractAddress, repository }`.
  - Persist newly created repository to Supabase `repositories` table.

- [ ] **Step 2: Update `NewRepoModal.tsx` to use the Relayer API**
  - Replace the fake `setTimeout` and random hex generator with an actual `fetch('/api/relayer/deploy', ...)` call.
  - Display badge: "Sponsored by SolGit Relayer (Zero Gas Cost on MST Coral)".
  - On success: pass the returned real `Repository` object to `onCreateRepo`, display live `coral.mstscan.com` transaction link in a toast.

- [ ] **Step 3: Update `page.tsx` repository selection & persistence**
  - Load repositories from `GET /api/repos?address={address}` when wallet connects.
  - Add newly created repository to state and select it as active.

- [ ] **Step 4: Typecheck & verify build**
  Run `./dashboard/node_modules/.bin/tsc --project dashboard/tsconfig.json --noEmit`
  Expected: PASS with 0 errors.

- [ ] **Step 5: Commit changes**
  ```bash
  git add dashboard/src/app/api/relayer/deploy/route.ts dashboard/src/components/dashboard/NewRepoModal.tsx dashboard/src/app/page.tsx
  git commit -m "feat(relayer): integrate gasless contract deployment engine on MST Coral Testnet"
  ```

---

### Task 6: End-to-End Verification

**Files:**
- Test / Verify all touched components

- [ ] **Step 1: Typecheck and lint dashboard**
  Run: `./dashboard/node_modules/.bin/tsc --project dashboard/tsconfig.json --noEmit && npm --prefix dashboard run lint`
  Expected: 0 errors.

- [ ] **Step 2: Verify empty states without wallet connected**
  Check that 0 repositories, 0 PRs, and 0 events render with empty states and no runtime errors.

- [ ] **Step 3: Verify wallet gating**
  Clicking "New" repository when disconnected must trigger BridgeKey connection prompt.

- [ ] **Step 4: Verify Relayer and Coral MSTScan links**
  Test `/api/relayer/deploy` to ensure transaction hashes link to `https://coral.mstscan.com`.

- [ ] **Step 5: Final commit and clean status**
  ```bash
  git status
  ```
