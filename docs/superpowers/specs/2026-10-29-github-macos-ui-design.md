# SolGit Design Spec: GitHub Platform with macOS UI/UX

**Date**: 2026-10-29  
**Status**: Validated Design Draft  
**Target Application**: SolGit Dashboard (`dashboard/`)  

---

## 1. Executive Summary

SolGit is a Git-style smart contract management platform powered by EIP-2535 Diamond Proxies on the MST Blockchain (Chain ID `91562037`). It provides permanent contract addresses, per-selector version lifecycles (`Active`, `Stable`, `Quarantined`), automated Guardian emergency rollbacks upon exploit detection, and an AI Fixer that auto-generates verified Solidity patches.

This specification redesigns the SolGit dashboard into a **professional GitHub repository web platform infused with macOS Sonoma/Ventura UI/UX design language**. The interface blends GitHub's developer-familiar layout (repository header, subnav tabs, file explorer, commit history, pull request reviews, and security incident alerts) with native macOS desktop materials (acrylic glassmorphism, San Francisco typography, refined segmented controls, traffic light accents, and a `⌘K` command palette).

---

## 2. Visual Design System & macOS Materials

### 2.1 Color Palette & Depth System
* **Deep Canvas**: Dark theme base `#0d1117` matching GitHub Dark, overlaid with `#161b22` for content cards and `#0b0e14` for recessed/code view containers.
* **macOS Translucent Materials (Vibrancy)**:
  * Glass blur effect using `backdrop-blur-xl bg-zinc-950/75 border border-white/10`.
  * Subtle top-edge inner specular highlight: `inset 0 1px 0 rgba(255,255,255,0.08)`.
  * Soft drop shadows mimicking macOS window layering: `shadow-2xl shadow-black/60`.
* **Semantic Status Colors**:
  * **GitHub Green / Emerald (`#238636` / `#3fb950`)**: Passing CI checks, active versions, stable tag pills, and the "Merge pull request" button.
  * **macOS System Blue / Cyan (`#58a6ff` / `#38bdf8`)**: Active tab highlights, selector tags, and Diamond Loupe routing links.
  * **macOS System Amber (`#d29922`)**: Invariant warnings and underflow advisory notices.
  * **macOS System Red / Rose (`#f85149`)**: Quarantined versions, exploit alerts, and rollback triggers.
  * **GitHub Merged Purple (`#8957e5` / `#a371f7`)**: Merged pull request badges and states.

### 2.2 Typography & System Controls
* **Type Hierarchy**:
  * Primary: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif`.
  * Monospace / Code: `ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace` for bytecode selectors, contract addresses, and Solidity source code.
* **macOS Segmented Controls & Buttons**:
  * Smooth pill buttons with `rounded-lg` borders and recessed active states.
  * Traffic light window dots (`bg-rose-500`, `bg-amber-500`, `bg-emerald-500`) incorporated as an authentic macOS window header element for code blocks and inspectors.
  * Keyboard shortcut indicator pills (`kbd` styling: `bg-zinc-800/80 border border-zinc-700/80 text-zinc-300 font-mono text-[10px] px-1.5 py-0.5 rounded`).

---

## 3. Application Layout & Navigation Structure

```
+-----------------------------------------------------------------------------------------+
| [O O O] SolGit v1.0.0 | mst-protocol / solgit-vault-diamond    [Search / ⌘K]  [MST: 91562037] |
+-----------------------------------------------------------------------------------------+
| Repository Header: Public | Watch [12] | Fork [3] | Star [48] | Guardian Status: ACTIVE |
+-----------------------------------------------------------------------------------------+
| [Code]  [Commits]  [Pull Requests (1)]  [Security (Alert)]  [Diamond Loupe]             |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|                                 ACTIVE TAB VIEW CONTENT                                 |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
| Footer: SolGit · MST Blockchain Testnet (EVM ID 91562037) · Explorer · Faucet · RPC    |
+-----------------------------------------------------------------------------------------+
```

### 3.1 Global Top Bar
* **macOS Window Controls & Branding**: Subtle traffic light dots (`red / yellow / green`), SolGit brand glyph with emerald gradient, and breadcrumb path: `mst-protocol / solgit-vault-diamond`.
* **Global Search / Command Palette Bar**: Interactive search box displaying `Search or jump to...` with a `⌘K` badge.
* **Live Network Status Beacon**:
  * Real-time MST Testnet beacon: pulsating emerald dot, Chain ID `91562037`, block time `~3s`.
  * Permanent Diamond Router Address: `0xCEe1...19EB` with one-click copy and tooltip feedback.
  * Fast links: MSTScan Explorer, Faucet, and RPC status.

### 3.2 GitHub Repository Meta Header
* **Visibility & Stats**: `Public` badge, `diamond-proxy` topic tag, and macOS segmented action button groups:
  * `Watch` [12]
  * `Fork` [3]
  * `Star` [48]
* **Guardian Status Banner**: Pill indicator verifying that the SolGit Guardian facet is active and protecting all registered facets.

### 3.3 GitHub Subnav Tabs
Horizontal tab navigation with GitHub SVG icons, active indicator bars, and dynamic counter badges:
1. `<Code />` **Code**: Repository file hierarchy, facet specifications, and raw contract viewer.
2. `<GitCommit />` **Commits**: Per-selector commit history and version lifecycles.
3. `<GitPullRequest />` **Pull Requests**: List and detail views with counter `[1]`.
4. `<ShieldAlert />` **Security**: Attack simulation sandbox, live incident feed, and invariant monitors.
5. `<Cpu />` **Diamond Loupe**: EIP-2535 Loupe inspector and selector-to-facet routing matrix.

---

## 4. Detailed Component Specifications

### 4.1 Tab 1: `<Code />` (Repository & File Viewer)
* **Branch / Version Switcher**: Dropdown supporting `main ▾` and quick selector filters.
* **Commit Summary Banner**: Displays the latest commit message, author avatar, commit SHA (`4e7f8a9`), and timestamp.
* **Clone / Contract Code Button**: Green macOS-style `Code ▾` dropdown offering:
  * Permanent Diamond Router Address with copy button.
  * Foundry installation command: `forge install SolGit/solgit-diamond`.
* **File Explorer Table**:
  * `contracts/core/SolGitDiamond.sol` (Diamond Proxy core)
  * `contracts/core/VersionRegistry.sol` (Version state registry)
  * `contracts/facets/VaultV1.sol` (Stable baseline vault)
  * `contracts/facets/VaultV2.sol` (Vulnerable vault facet)
  * `contracts/facets/VaultV2Fixed.sol` (AI-patched vault facet)
  * `contracts/facets/SolGitGuardianFacet.sol` (Guardian emergency rollback facet)
  * `README.md` (Platform overview and quickstart)
* **macOS Code Window Viewer**:
  * Triggered by clicking any file in the explorer.
  * Features macOS traffic light dots, file path, line count, byte size, and copy button.
  * Formatted with line numbers, syntax highlighting accents, and clean padding.
* **Repository Meta Sidebar**:
  * About section: "EIP-2535 Diamond Proxy on MST Blockchain with Guardian rollbacks".
  * Diamond Router address, Version Registry address, Guardian facet address.
  * Active selectors count and release tags (`v1.0.0-stable`).

### 4.2 Tab 2: `<Commits />` (Git Version History)
* **Selector Filter Bar**: Buttons allowing filtering by selector (`withdraw(uint256)`, `deposit()`, `balanceOf(address)`).
* **Commit Timeline**: Grouped cards along a Git vertical branch line:
  * Commit node circle with status color.
  * Commit message (e.g. `fix(withdraw): AI-healed CEI balance verification patch`, `feat(withdraw): gas optimized underflow hazard`, `feat(vault): initial stable release`).
  * Author (`0xAI...Watcher`, `0xDeveloper`), commit hash, and timestamp.
  * Status badges:
    * `Stable`: Green badge with checkmark.
    * `Active`: Cyan badge.
    * `Quarantined`: Red badge with alert triangle.
* **Quick Diff Button**: Opens the Code Diff comparison directly from any commit.

### 4.3 Tab 3: `<Pull Requests />` (AI Self-Healing Review & Merge)
* **PR List**: Displays open/closed PRs with status labels, author, and timestamp.
* **PR #42 Detail View**:
  * **Header**: Green `Open` badge, title `[SolGit AI Fix] Secure withdraw underflow patch`, branch `solgit-fix-0x2e1a7d-v2` into `main`.
  * **CI / Test Status Card (macOS Acrylic)**:
    * `Automated Foundry Tests`: 7 passed, 0 failed.
    * `Invariant Verification`: `OUTFLOW_CAP` invariant verified safe.
    * `Slither Static Analysis`: 0 reentrancy or underflow vulnerabilities detected.
  * **AI Fixer Narrative Comment**: Explains exploit incident trigger on selector `0x2e1a7d4d`, root cause (unchecked subtraction without CEI), and implemented resolution.
  * **Diff Inspector**: Side-by-side or unified diff comparing `VaultV2.sol` (red lines removed) with `VaultV2Fixed.sol` (green lines added).
  * **Merge Action Box**: Authentic GitHub green **Merge pull request** button. Clicking it executes the merge, sets status to `Merged` (purple), promotes V3 to Stable on the Diamond, and updates the version tree.

### 4.4 Tab 4: `<Security />` (Guardian & Attack Sandbox)
* **Interactive Attack & Auto-Rollback Sandbox**:
  * Visual 5-stage progress pipeline:
    1. Attacker exploit execution against `VaultV2.withdraw()`.
    2. Watcher detects abnormal drain and invariant breach.
    3. Watcher triggers on-chain `emergencyRollback` with Guardian role.
    4. Diamond proxy routes selector `0x2e1a7d4d` back to `VaultV1` (quarantines V2).
    5. AI Fixer generates verified `VaultV2Fixed.sol` and stages PR #42.
  * "Simulate Exploit Attack" button and "Reset Sandbox" button.
* **Invariant Monitor Cards**:
  * `OUTFLOW_CAP`: 100 tMSTC max per transaction.
  * `REENTRANCY_GUARD`: Active call depth monitor.
  * `VERSION_INTEGRITY`: Stable facet cryptographic hash check.
* **Live Incident Feed**: Chronological incident feed recording block number, selector, quarantined version, triggering guardian address, and MSTScan transaction link.

### 4.5 Tab 5: `<Diamond Loupe />` (EIP-2535 Introspection)
* **Facet Routing Table**:
  * Function Signature (e.g. `withdraw(uint256)`).
  * 4-byte Selector (`0x2e1a7d4d`).
  * Current Target Facet address.
  * Version Lifecycle state (`Stable`, `Active`, `Quarantined`).
* **Contract Overview**: Interactive address cards with one-click copy and direct MSTScan testnet links.

### 4.6 Global Components
* **macOS Command Palette (`⌘K`)**:
  * Opened via `⌘K` or top search click.
  * Search across files (`SolGitDiamond.sol`, `VaultV1.sol`, etc.), selectors (`0x2e1a7d4d`), navigation tabs, and actions ("Simulate Hack", "Merge PR", "Reset").
* **macOS Sonoma Floating Toasts**:
  * Glass notification pill appearing at top-right or bottom-center upon copy, exploit simulation, or PR merge.

---

## 5. State Management & Data Flow

```
                      +---------------------------------------+
                      |          App Central State            |
                      | - activeTab                           |
                      | - selectedFile                        |
                      | - selectors[] (versions, status)      |
                      | - events[] (rollback logs)            |
                      | - isHacked, isMerged                  |
                      | - commandPaletteOpen                  |
                      | - toast message                       |
                      +-------------------+-------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                 |                                 |
        v                                 v                                 v
+------------------+             +------------------+             +------------------+
|   Code / Loupe   |             |  Pull Requests   |             |     Security     |
| - File viewer    |             | - PR #42 review  |             | - Hack Simulator |
| - Loupe mapping  |             | - Merge action   |             | - Invariant feed |
| - Router address |             | - Code diff      |             | - Incident logs  |
+------------------+             +------------------+             +------------------+
```

1. **Exploit Simulation Flow**:
   * User clicks "Simulate Exploit Attack".
   * Pipeline steps 1 through 5 animate sequentially.
   * `isHacked` set to `true`.
   * Selector `0x2e1a7d4d` current version reverts from 2 to 1; v2 status set to `Quarantined`.
   * New `RollbackEvent` prepended to `events`.
   * Security tab alert badge displays; Pull Requests tab badge highlights PR #42.
   * Toast notification: `Guardian emergencyRollback executed for 0x2e1a7d4d`.

2. **Pull Request Merge Flow**:
   * User navigates to Pull Requests tab and reviews PR #42.
   * User clicks "Merge pull request".
   * `isMerged` set to `true`.
   * PR #42 badge changes to `Merged` (purple).
   * V3 (`VaultV2Fixed.sol`) appended to selector `0x2e1a7d4d` history as `Stable`.
   * Code and Commits tabs reflect V3 commit.
   * Toast notification: `PR #42 merged: VaultV2Fixed promoted to Stable`.

3. **Reset Flow**:
   * Reset restores baseline state: `isHacked = false`, `isMerged = false`, original selector history and event list.

---

## 6. Implementation & Component Architecture

### 6.1 Component Directory Structure
```
dashboard/src/
├── app/
│   ├── layout.tsx                # App shell, fonts, metadata
│   ├── page.tsx                  # Main GitHub repository container & tab orchestrator
│   └── globals.css               # Tailwind CSS v4, macOS acrylic utilities, custom scrollbars
├── components/
│   ├── TopNav.tsx                # macOS App header, window controls, search ⌘K, network beacon
│   ├── RepoHeader.tsx            # GitHub repo title, meta badges, Watch/Star/Fork buttons
│   ├── TabNav.tsx                # GitHub subnav tabs with counter badges
│   ├── CommandPalette.tsx        # macOS ⌘K search & action modal
│   ├── Toast.tsx                 # macOS floating glass notification
│   ├── tabs/
│   │   ├── CodeTab.tsx           # GitHub file tree, commit bar, macOS code viewer, repo sidebar
│   │   ├── CommitsTab.tsx        # Version tree timeline, selector filters, commit nodes
│   │   ├── PullRequestsTab.tsx   # PR #42 detail, Foundry checks, AI comment, diff, merge action
│   │   ├── SecurityTab.tsx       # Live exploit sandbox, invariant cards, incident log feed
│   │   └── LoupeTab.tsx          # EIP-2535 selector routing matrix, contract addresses
│   ├── CodeDiff.tsx              # Standalone / embeddable diff viewer
│   └── SimulateHack.tsx          # Reusable attack simulation pipeline
└── lib/
    ├── data.ts                   # Contract addresses, selectors, Solidity files content, events
    └── types.ts                  # Shared TypeScript interfaces
```

---

## 7. Verification & Success Criteria

1. **Authentic macOS UX**:
   * Translucent frosted glass headers and cards with subtle borders.
   * macOS typography and button physics with smooth hover and active states.
   * Fully functional `⌘K` Command Palette with keyboard navigation.
2. **True GitHub Platform Parity**:
   * All 5 tabs (`Code`, `Commits`, `Pull Requests`, `Security`, `Diamond Loupe`) render cleanly with appropriate GitHub metadata.
   * File explorer allows clicking through contract files with formatted code previews.
   * Pull Requests view includes checks, comments, diffs, and working merge functionality.
3. **Smart Contract Guardian Workflows**:
   * Attack simulation cleanly updates state across tabs (Security, PRs, Commits, Code).
   * AI-healed PR merge accurately promotes V3 into stable Diamond routing.
   * Permanent Diamond address and MST Testnet links operate correctly.
4. **Zero Build & Type Errors**:
   * `npm run build` in `dashboard/` completes without errors or warnings.
