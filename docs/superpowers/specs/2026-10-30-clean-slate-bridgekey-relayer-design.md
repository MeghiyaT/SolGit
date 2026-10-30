# SolGit Architecture Spec: Clean-Slate, BridgeKey Gating, Relayer & Supabase Onboarding

**Date**: 2026-10-30  
**Status**: Approved (Brainstorming Phase)  
**Target Network**: MST Coral Testnet (Chain ID `54635`, Explorer: `https://coral.mstscan.com`, RPC: `https://coralrpc.mstblockchain.com`)

---

## 1. Executive Summary

SolGit is transitioning from a simulated demo environment with hardcoded mock repositories to a fully functional, production-ready decentralized smart contract platform. This spec details:
1. **Mock Data Removal**: Removing all static mock repositories, mock selectors, mock pull requests, and mock events from `lib/data.ts`.
2. **Supabase Cloud Persistence**: Introducing Supabase database persistence for user profiles (`users`) and smart contract repositories (`repositories`), ensuring user data and deployed contracts survive browser resets or `localStorage` clears.
3. **Verified MST Coral Testnet**: Updating network configuration to the authentic MST Coral Testnet (`Chain ID: 54635`, RPC: `https://coralrpc.mstblockchain.com`, Explorer: `https://coral.mstscan.com`).
4. **BridgeKey Wallet Integration & Strict Gating**: Uploading contracts and creating repositories strictly requires connecting a BridgeKey / EVM wallet. Unauthenticated attempts are intercepted with a sleek "Connect BridgeKey" prompt.
5. **New User Nickname Onboarding**: On first wallet connection, if no profile exists for the address in Supabase, a dedicated modal prompts the user to select their developer nickname, which is saved to Supabase and displayed across the platform.
6. **Gasless Relayer Engine**: A backend relayer API (`/api/relayer/deploy`) uses a funded operator account to broadcast deployment transactions to MST Coral Testnet, transferring contract ownership to the user's BridgeKey wallet while sponsoring gas fees for a seamless 1-click developer experience.

---

## 2. MST Coral Testnet Verification

Through verified network discovery, MST Blockchain maintains distinct networks:
* **MST Coral Testnet (Active & Target)**:
  * **Network Name**: `MST Coral Testnet`
  * **Chain ID**: `54635` (`0xd56b`)
  * **RPC URL**: `https://coralrpc.mstblockchain.com`
  * **WebSocket**: `wss://coralrpc.mstblockchain.com`
  * **Currency**: `tMSTC` (18 Decimals)
  * **Block Explorer**: `https://coral.mstscan.com`
* **Legacy MST Testnet (Deprecating)**:
  * Chain ID: `4545` (and deprecated devnet `91562037`)
  * RPC: `https://testnetrpc.mstblockchain.com`
  * Explorer: `https://testnet.mstscan.com`

All constants in `lib/mstChain.ts`, `lib/data.ts`, and network switch helpers will target `54635` and `coralrpc.mstblockchain.com`.

---

## 3. Database Architecture (Supabase)

Supabase credentials configured in environment variables:
* `NEXT_PUBLIC_SUPABASE_URL=https://mfdyorztvcibwzhnqmsi.supabase.co`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>`
* `SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>`

### 3.1 Tables Schema

#### `users` Table
```sql
CREATE TABLE IF NOT EXISTS users (
  address TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `repositories` Table
```sql
CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_address TEXT NOT NULL,
  owner_nickname TEXT NOT NULL,
  description TEXT,
  contract_address TEXT NOT NULL,
  tx_hash TEXT,
  sol_code TEXT NOT NULL,
  facet_count INTEGER DEFAULT 1,
  guardian_active BOOLEAN DEFAULT TRUE,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Resilience Against LocalStorage Clearance
* The client queries Supabase on wallet connection:
  1. `GET /api/user?address={address}` $\rightarrow$ returns nickname and profile.
  2. `GET /api/repos?address={address}` $\rightarrow$ returns all repositories owned by this address.
* Even if browser cookies and `localStorage` are cleared, reconnecting BridgeKey immediately restores the user's nickname, repositories, and contract code.

---

## 4. Frontend UX & Component Flow

### 4.1 Mock Data Removal & Empty States
* `INITIAL_REPOSITORIES` is initialized as `[]`.
* `INITIAL_PULL_REQUESTS` is initialized as `[]`.
* `INITIAL_EVENTS` is initialized as `[]`.
* `INITIAL_SELECTORS` is initialized as `[]`.
* **LeftSidebar**: Shows an empty state with a Book icon and a "Create your first repository" call-to-action when 0 repositories exist.
* **CenterFeed**: Displays friendly zero-data states for PRs and Smart Contract Activity.
* **CodeTab**: Displays an empty state inviting the user to select or deploy a repository when none is selected.

### 4.2 BridgeKey Connection & First-Time Nickname Modal
* **TopNav**:
  * Button clearly branded as **"Connect BridgeKey"** with EVM wallet detection.
  * Once connected, shows identicon, user's nickname (e.g. `satoshi`), and formatted address (`0xEfbc...B041`).
* **Nickname Onboarding Modal (`NicknameModal.tsx`)**:
  * Triggers automatically when `isConnected === true` and no user record exists in Supabase.
  * Inputs: Developer nickname (3–24 alphanumeric characters).
  * Validates and saves to Supabase (`POST /api/user`).
  * Emits welcome toast notification.
* **Edit Nickname**:
  * Wallet dropdown includes an "Edit Nickname" button to update the username anytime.

### 4.3 Strict BridgeKey Gating for Contract Upload
* "New" repository button in LeftSidebar and "Upload smart contract" in TopNav:
  * If BridgeKey is **disconnected**:
    * Clicking triggers a modal or toast: *"BridgeKey Wallet Required: Please connect your BridgeKey wallet to create repositories and deploy contracts on MST Coral."*
    * Offers a direct 1-click "Connect BridgeKey" button.
  * If BridgeKey is **connected**:
    * Opens `NewRepoModal` pre-populated with the user's nickname and wallet address.

---

## 5. Relayer Architecture (`/api/relayer/deploy`)

### 5.1 Endpoint Specification
* **Path**: `POST /api/relayer/deploy`
* **Body**:
  ```json
  {
    "repoName": "my-vault",
    "description": "Safe EIP-2535 Diamond Proxy on MST Coral",
    "solCode": "// SPDX-License-Identifier: MIT...",
    "ownerAddress": "0xEfbc...B041",
    "ownerNickname": "satoshi",
    "isPrivate": false
  }
  ```
* **Process**:
  1. Validates inputs and checksums `ownerAddress`.
  2. Relayer creates a `viem` wallet client initialized with `PRIVATE_KEY` from `.env`.
  3. Prepares deployment of the contract or Diamond Proxy on MST Coral Testnet (`https://coralrpc.mstblockchain.com`).
  4. Designates `ownerAddress` as the on-chain contract owner.
  5. Relayer account pays gas in `tMSTC`.
  6. Captures live `txHash` and `contractAddress`.
  7. Inserts the repository record into Supabase `repositories`.
  8. Returns live links to `https://coral.mstscan.com/tx/{txHash}` and `https://coral.mstscan.com/address/{contractAddress}`.

---

## 6. Verification & Testing Plan

1. **Supabase Connectivity**: Verify reading and writing to `users` and `repositories` tables via `@supabase/supabase-js`.
2. **Network Parameters**: Test `mstChain.ts` against `Chain ID 54635` and `https://coralrpc.mstblockchain.com`.
3. **Empty States**: Verify clean-slate rendering without mock data.
4. **Nickname Modal**: Connect a fresh address, confirm the modal prompts for a nickname, saves to Supabase, and updates UI.
5. **Wallet Gating**: Attempt to upload without wallet connected $\rightarrow$ verify blocked with prompt. Connect wallet $\rightarrow$ verify allowed.
6. **Relayer & Explorer Links**: Upload a contract $\rightarrow$ verify relayer deployment, check `coral.mstscan.com` links, and verify the repo appears in LeftSidebar and CodeTab.
7. **Cache Clearance Test**: Clear `localStorage` in browser devtools $\rightarrow$ reconnect wallet $\rightarrow$ verify all repos and nickname restore automatically from Supabase.
