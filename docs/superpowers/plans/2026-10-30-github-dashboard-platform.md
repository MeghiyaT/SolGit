# SolGit GitHub Dashboard Platform & Strict Web3 Wallet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform SolGit from a single repository view into a full GitHub Web Platform tailored for smart contracts on MST Blockchain (Chain ID 91562037), featuring a 1:1 GitHub dashboard landing page, strict Web3 wallet authentication via viem, a "New Repository / Upload Smart Contract" flow with Diamond and Guardian initialization, and a clean GitHub repository view with all macOS traffic light buttons removed.

**Architecture:** Implement a modular Next.js App Router frontend with state machine navigation between the GitHub Dashboard view and the Clean Repository view. A dedicated `useWeb3Wallet` hook interfaces directly with browser EVM wallets via `viem` to manage MST Blockchain Testnet connections, checksummed addresses, balances in `tMSTC`, and network switching. The dashboard is structured into Left Sidebar (Top repos with search and green New button), Center Workspace (time-aware greeting, recent PRs, smart contract activity, zero Copilot box), and Right Sidebar (MST Blockchain status card and changelog).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Lucide React, `viem` (EVM interaction, chain ID 91562037), Node.js test runner for unit validation.

**Spec:** `docs/superpowers/specs/2026-10-30-github-dashboard-platform.md`

## Global Constraints

- Target directory: SolGit Dashboard (`dashboard/`).
- MST Blockchain Chain ID: `91562037`, RPC: `https://testnetrpc.mstblockchain.com`, Currency: `tMSTC`.
- Strict EVM wallet authentication using browser providers (`window.ethereum`) via `viem` without third-party centralized auth.
- Zero Copilot search box in the center dashboard workspace.
- All macOS red/yellow/green traffic light buttons removed across all headers and navigation bars.
- Clean, standard GitHub Dark theme using `#0d1117`, `#161b22`, `#21262d`, and `#30363d`.
- Breadcrumb with clickable SolGit logo / link to return to the Dashboard from any repository view.

## Review Focus

1. **Disconnected Wallet Handling**: If `window.ethereum` is absent or the user denies connection, the UI must gracefully display "Connect Wallet" with informative feedback rather than throwing uncaught errors.
2. **Network Switch Invalidation**: If the user is connected to an alternate chain (e.g. Ethereum Mainnet or Sepolia), the wallet widget must prominently prompt to switch to MST Blockchain Testnet (Chain ID 91562037) and trigger `wallet_switchEthereumChain` / `wallet_addEthereumChain`.
3. **Empty Repository Search**: In the Left Sidebar's "Top repositories" list, searching for a non-existent repo string should display a clean GitHub-style empty state rather than breaking the layout.
4. **Contract File Upload Edge Cases**: The "New Repository / Upload Smart Contract" modal must handle both `.sol` file drag-and-drop/selection and manual code pasting, validating non-empty input before initiating the Diamond proxy + Guardian deployment simulation.
5. **Dashboard to Repo Navigation State**: Switching between the Dashboard view and Repository view must preserve active contract state, merged status, and simulated rollback events without state resets.

---

### Task 1: Strict Web3 Wallet Logic & MST Chain Definition

**Files:**
- Create: `dashboard/src/lib/mstChain.ts`
- Create: `dashboard/src/hooks/useWeb3Wallet.ts`
- Create: `dashboard/src/test/wallet.test.ts`
- Modify: `dashboard/src/lib/types.ts`

**Interfaces:**
- Produces:
  - `mstTestnet: Chain` defined with id `91562037`, name `'MST Blockchain Testnet'`, nativeCurrency `{ name: 'MST Coin', symbol: 'tMSTC', decimals: 18 }`, rpcUrls `https://testnetrpc.mstblockchain.com`, blockExplorers `https://testnet.mstscan.com`.
  - `useWeb3Wallet(): { address: `0x${string}` | null; checksumAddress: string | null; balance: string | null; chainId: number | null; isConnecting: boolean; isConnected: boolean; isWrongNetwork: boolean; error: string | null; connectWallet: () => Promise<void>; disconnectWallet: () => void; switchNetwork: () => Promise<void>; }`
  - `generateIdenticonGradient(address: string): string` for SVG/CSS identicon avatar rendering.

- [ ] **Step 1: Write unit tests for MST Chain definition and wallet helpers**

Write tests in `dashboard/src/test/wallet.test.ts` checking chain id (91562037), currency symbol (tMSTC), RPC URL, checksum formatting via `viem.getAddress`, and identicon generation determinism.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test dashboard/src/test/wallet.test.ts`
Expected: FAIL due to missing `mstChain.ts` or helpers.

- [ ] **Step 3: Implement MST Chain definition in `dashboard/src/lib/mstChain.ts` and `dashboard/src/lib/types.ts`**

Define `mstTestnet` viem chain object and export wallet state interfaces in `types.ts`.

- [ ] **Step 4: Implement `dashboard/src/hooks/useWeb3Wallet.ts`**

Implement connection flow checking `window.ethereum`, calling `eth_requestAccounts`, creating public and wallet clients with `mstTestnet`, fetching balance formatted with `formatEther`, handling network switches with `wallet_switchEthereumChain` / `wallet_addEthereumChain`, and listening to `accountsChanged` / `chainChanged`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test dashboard/src/test/wallet.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add dashboard/src/lib/mstChain.ts dashboard/src/hooks/useWeb3Wallet.ts dashboard/src/lib/types.ts dashboard/src/test/wallet.test.ts
git commit -m "feat(wallet): implement strict web3 wallet hook and mst testnet chain configuration"
```

---

### Task 2: Web3 Wallet UI Components

**Files:**
- Create: `dashboard/src/components/wallet/WalletButton.tsx`
- Create: `dashboard/src/components/wallet/IdenticonAvatar.tsx`
- Test: `dashboard/src/test/identicon.test.ts`

**Interfaces:**
- Consumes: `useWeb3Wallet` from `dashboard/src/hooks/useWeb3Wallet.ts`.
- Produces:
  - `<WalletButton />`: Renders either green "Connect Wallet" button or connected pill with Identicon avatar, truncated address (`0x1a2b...3c4d`), `tMSTC` balance, wrong-network warning badge, and dropdown with copy full address, network switcher, MST Explorer link, and disconnect button.
  - `<IdenticonAvatar address={string} size?: number />`: Generates a deterministic GitHub-style SVG/block avatar based on EVM address.

- [ ] **Step 1: Write test for IdenticonAvatar deterministic SVG generation**

Write tests in `dashboard/src/test/identicon.test.ts` verifying identical SVGs for identical addresses and valid SVG markup.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test dashboard/src/test/identicon.test.ts`
Expected: FAIL due to missing file.

- [ ] **Step 3: Implement `IdenticonAvatar.tsx` and `WalletButton.tsx`**

Build the deterministic identicon component and GitHub-styled wallet dropdown matching GitHub's avatar menu (`#161b22` dropdown, `#30363d` border, text `#c9d1d9`).

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test dashboard/src/test/identicon.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/components/wallet/IdenticonAvatar.tsx dashboard/src/components/wallet/WalletButton.tsx dashboard/src/test/identicon.test.ts
git commit -m "feat(wallet): create IdenticonAvatar and GitHub-style WalletButton components"
```

---

### Task 3: Remove All macOS Traffic Lights & Standardize GitHub Dark Theme

**Files:**
- Modify: `dashboard/src/app/globals.css`
- Modify: `dashboard/src/components/TopNav.tsx`
- Modify: `dashboard/src/components/RepoHeader.tsx`

**Interfaces:**
- Produces: Clean GitHub Dark styled layout without macOS red/yellow/green traffic light buttons, utilizing GitHub standard color tokens: `#0d1117`, `#161b22`, `#21262d`, `#30363d`.

- [ ] **Step 1: Inspect and remove macOS traffic light classes from `dashboard/src/app/globals.css`**

Delete `.macos-traffic-dot`, `.macos-traffic-close`, `.macos-traffic-minimize`, `.macos-traffic-expand` and ensure GitHub Dark theme variables are strictly defined.

- [ ] **Step 2: Remove traffic light markup from `dashboard/src/components/TopNav.tsx`**

Remove the macOS window control div and replace with GitHub Octocat glyph and clean navigation.

- [ ] **Step 3: Clean up `RepoHeader.tsx`**

Ensure concise, clean GitHub dark styling without artificial macOS titlebars.

- [ ] **Step 4: Verify build and TypeScript compilation**

Run: `./dashboard/node_modules/.bin/tsc --noEmit -p dashboard/tsconfig.json`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/app/globals.css dashboard/src/components/TopNav.tsx dashboard/src/components/RepoHeader.tsx
git commit -m "style: remove macos traffic light buttons and apply strict github dark palette"
```

---

### Task 4: GitHub TopNav Redesign

**Files:**
- Modify: `dashboard/src/components/TopNav.tsx`
- Modify: `dashboard/src/lib/types.ts`

**Interfaces:**
- Consumes: `WalletButton`, `useWeb3Wallet`.
- Produces:
  - `<TopNav currentView={ViewType} onNavigateHome={() => void} onOpenNewRepoModal={() => void} onOpenCommandPalette={() => void} repoName?: string />`
  - Features:
    1. GitHub Octocat glyph button (returns to Dashboard).
    2. "Dashboard" breadcrumb / title when on landing page, or `SolGit / owner / repo` breadcrumb with clickable SolGit link when in repo view.
    3. Search input with "Type / to search" placeholder and `/` kbd shortcut badge.
    4. `+` Create dropdown with options: "New repository", "Upload smart contract".
    5. Notifications bell icon with indicator.
    6. Strict `<WalletButton />` component.

- [ ] **Step 1: Write failing test for TopNav render contracts**

Write test verifying exported TopNav interface props and behavior.

- [ ] **Step 2: Run test to verify it fails**

Run: `./dashboard/node_modules/.bin/tsc --noEmit -p dashboard/tsconfig.json`
Expected: FAIL or type mismatch with new props.

- [ ] **Step 3: Implement new TopNav layout and components**

Embed the official GitHub Octocat SVG, the `+` dropdown menu, search bar trigger, and the Web3 Wallet integration.

- [ ] **Step 4: Verify with tsc**

Run: `./dashboard/node_modules/.bin/tsc --noEmit -p dashboard/tsconfig.json`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/components/TopNav.tsx dashboard/src/lib/types.ts
git commit -m "feat(ui): redesign TopNav with Octocat glyph, create dropdown, and web3 wallet button"
```

---

### Task 5: "New Repository / Upload Smart Contract" Modal & Flow

**Files:**
- Create: `dashboard/src/components/dashboard/NewRepoModal.tsx`
- Modify: `dashboard/src/lib/data.ts`
- Modify: `dashboard/src/lib/types.ts`

**Interfaces:**
- Produces:
  - `<NewRepoModal isOpen={boolean} onClose={() => void} onCreateRepo={(repo: Repository) => void} />`
  - Fields:
    - Repository Name (`string`, required)
    - Description (`string`, optional)
    - Contract Visibility (`public` | `private`)
    - Contract Uploader: File drop/picker for `.sol` files or paste Solidity code textarea with standard Diamond Facet template pre-populated.
  - Action: "Create repository & Deploy Diamond".
  - Initialization simulation: Progress bar/stepper:
    1. "Compiling Solidity facets..."
    2. "Deploying Diamond Proxy (EIP-2535)..."
    3. "Attaching SolGit Guardian Protection..."
    4. "Registering in VersionRegistry..."
  - Automatically appends the new repository to the user's repository list and selects it.

- [ ] **Step 1: Define `Repository` interface and initial repositories list in `dashboard/src/lib/types.ts` and `dashboard/src/lib/data.ts`**

Add fields for `id`, `name`, `owner`, `description`, `isPrivate`, `updatedAt`, `contractAddress`, `facetCount`, `guardianActive`.

- [ ] **Step 2: Implement `NewRepoModal.tsx`**

Build the modal with tabs for "Upload .sol file" vs "Paste Solidity code", form validation, deployment progress steps, and submission handler.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `./dashboard/node_modules/.bin/tsc --noEmit -p dashboard/tsconfig.json`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/components/dashboard/NewRepoModal.tsx dashboard/src/lib/data.ts dashboard/src/lib/types.ts
git commit -m "feat(repo): implement new repository and smart contract uploader modal with diamond proxy init"
```

---

### Task 6: GitHub Dashboard 3-Column Landing Page Components

**Files:**
- Create: `dashboard/src/components/dashboard/LeftSidebar.tsx`
- Create: `dashboard/src/components/dashboard/CenterFeed.tsx`
- Create: `dashboard/src/components/dashboard/RightSidebar.tsx`
- Create: `dashboard/src/components/dashboard/DashboardView.tsx`

**Interfaces:**
- Produces:
  - `<LeftSidebar repos={Repository[]} onSelectRepo={(repoId: string) => void} onOpenNewRepoModal={() => void} />`:
    - `Home` & `Feed` navigation links with GitHub icons.
    - `Top repositories` header with search filter input and green `New` button (`bg-[#238636]`).
    - Filterable list of repositories showing owner/repo avatar, name, and visibility badge.
  - `<CenterFeed address={string | null} onSelectRepo={(repoId: string) => void} onNavigatePR={(prId: string) => void} />`:
    - Greeting: Time-aware ("Good morning", "Good afternoon", "Good evening") + connected wallet address or "Explorer".
    - Recent Pull Requests widget: PR cards with status badge (Open / Merged), source/target branches, commit hash, author.
    - Recent Smart Contract Activity widget: Live events, facet upgrades, guardian checks, simulated rollbacks.
    - **Strictly ZERO Copilot search box**.
  - `<RightSidebar />`:
    - MST Blockchain status card: Chain ID `91562037`, RPC `https://testnetrpc.mstblockchain.com`, Faucet `https://faucet.mstblockchain.com`, Explorer `https://testnet.mstscan.com`, Guardian status.
    - "Latest from changelog" widget with GitHub release bullet points.
    - Footer links: Terms, Privacy, Docs, GitHub, Contact.
  - `<DashboardView />`: Orchestrates 3-column layout matching standard GitHub web platform layout.

- [ ] **Step 1: Implement `LeftSidebar.tsx` with repository search and green New button**

Build LeftSidebar with live search filter over repo names, active indicators, and green `New` button calling `onOpenNewRepoModal`.

- [ ] **Step 2: Implement `CenterFeed.tsx` with greeting, PRs widget, contract activity (zero Copilot)**

Build CenterFeed with dynamic greeting based on system hours and wallet address, PR summaries with click handlers, and smart contract activity feed.

- [ ] **Step 3: Implement `RightSidebar.tsx` with MST Blockchain status and changelog**

Build RightSidebar featuring the MST network status card, live beacon, external links to RPC/Faucet/Explorer, and changelog updates.

- [ ] **Step 4: Implement `DashboardView.tsx` assembling the 3 columns**

Combine `LeftSidebar`, `CenterFeed`, and `RightSidebar` in a responsive 3-column GitHub grid (`grid grid-cols-1 lg:grid-cols-12 gap-6`).

- [ ] **Step 5: Verify TypeScript compilation**

Run: `./dashboard/node_modules/.bin/tsc --noEmit -p dashboard/tsconfig.json`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add dashboard/src/components/dashboard/LeftSidebar.tsx dashboard/src/components/dashboard/CenterFeed.tsx dashboard/src/components/dashboard/RightSidebar.tsx dashboard/src/components/dashboard/DashboardView.tsx
git commit -m "feat(dashboard): build GitHub dashboard 3-column landing page components"
```

---

### Task 7: Platform Integration & Seamless View Switching

**Files:**
- Modify: `dashboard/src/app/page.tsx`
- Modify: `dashboard/src/components/RepoHeader.tsx`
- Modify: `dashboard/src/components/TabNav.tsx`

**Interfaces:**
- Produces:
  - Unified platform state managing `currentView: 'dashboard' | 'repository'`.
  - Seamless navigation: Clicking any repo from Dashboard navigates to Repository view.
  - Clickable breadcrumb / SolGit logo returns to Dashboard landing page.
  - Pull request links navigate directly to Repository view with `pulls` tab active.
  - State persistence for repositories list, smart contract events, and wallet connection.

- [ ] **Step 1: Wire navigation handlers and view state in `dashboard/src/app/page.tsx`**

Integrate `useWeb3Wallet`, `DashboardView`, and existing `RepoHeader`/`TabNav`/`CodeTab`/`CommitsTab`/`PullRequestsTab`/`SecurityTab`/`LoupeTab`.

- [ ] **Step 2: Add clickable return-to-dashboard breadcrumb in `RepoHeader.tsx` and `TopNav.tsx`**

Ensure users can click "SolGit" or "Dashboard" to instantly return to the main dashboard.

- [ ] **Step 3: Connect "New Repository" flow to state in `page.tsx`**

Opening modal via top `+` dropdown or left sidebar `New` button creates a new repo, appends it, and can immediately navigate to it.

- [ ] **Step 4: Verify TypeScript compilation**

Run: `./dashboard/node_modules/.bin/tsc --noEmit -p dashboard/tsconfig.json`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/app/page.tsx dashboard/src/components/RepoHeader.tsx dashboard/src/components/TabNav.tsx
git commit -m "feat(platform): integrate dashboard view with repository view and web3 wallet"
```

---

### Task 8: Verification, Lint, and Production Build

**Files:**
- Test: `dashboard/src/test/wallet.test.ts`
- Test: `dashboard/src/test/identicon.test.ts`

**Interfaces:**
- Complete end-to-end verification of all spec deliverables:
  1. 1:1 GitHub Dashboard landing page with Left Sidebar, Center Workspace, Right Sidebar.
  2. Strict Web3 wallet authentication with `viem`, MST testnet support, identicon, balance in `tMSTC`.
  3. "New Repository / Upload Smart Contract" flow with `.sol` upload and Diamond + Guardian proxy init.
  4. Clean GitHub Repository view with all macOS traffic light buttons removed.
  5. Zero Copilot search box.
  6. Production build passes cleanly with Turbopack.

- [ ] **Step 1: Run unit tests**

Run: `node --test dashboard/src/test/*.test.ts`
Expected: ALL PASS.

- [ ] **Step 2: Run TypeScript check**

Run: `./dashboard/node_modules/.bin/tsc --noEmit -p dashboard/tsconfig.json`
Expected: 0 errors.

- [ ] **Step 3: Run ESLint**

Run: `./dashboard/node_modules/.bin/eslint --config dashboard/eslint.config.mjs dashboard/src`
Expected: 0 warnings, 0 errors.

- [ ] **Step 4: Run production build**

Run: `cd dashboard && ./node_modules/.bin/next build`
Expected: Successful Turbopack build with static generation complete.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: complete verification for github dashboard platform and strict web3 wallet"
```

