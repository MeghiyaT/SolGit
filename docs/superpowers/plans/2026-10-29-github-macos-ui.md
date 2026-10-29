# SolGit GitHub + macOS UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the SolGit dashboard into a professional GitHub-style smart contract repository web application with authentic macOS UI/UX design language.

**Architecture:** A modular 5-tab repository workspace (`Code`, `Commits`, `Pull Requests`, `Security`, `Diamond Loupe`) powered by a global reactive state machine. Built with Next.js 16 + React 19 + Tailwind CSS, featuring macOS Sonoma materials (acrylic vibrancy, traffic light window chrome, segmented controls, SF typography, floating glass toasts) and a global `⌘K` Command Palette.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Lucide React icons.

**Spec:** `docs/superpowers/specs/2026-10-29-github-macos-ui-design.md`

## Global Constraints
- Target workspace directory: `dashboard/`.
- Styling framework: Tailwind CSS v4 with custom macOS vibrancy utilities in `dashboard/src/app/globals.css`.
- Typography: System font stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display"`) and monospace for contract addresses, selectors, and Solidity code.
- Contract references: Chain ID `91562037` (MST Blockchain Testnet), Diamond Router `0xCEe1d6467040c32185dBC60afAc508266b3D19EB`.
- Interactive continuity: Exploit simulation, Guardian emergency rollback, and AI PR #42 merge functionality must remain fully functional and update cross-tab state in real time.

## Review Focus
1. **Empty / missing file selection in Code tab**: Clicking any file in the file explorer must display its code with line numbers; clicking outside or closing returns to clean view.
2. **Keyboard shortcut collision**: `⌘K` (Mac) and `Ctrl+K` (Windows/Linux) must open the Command Palette without hijacking browser native hotkeys unexpectedly; `Escape` must close the palette.
3. **Simulation state reactivity**: Triggering an attack in the Security tab must synchronously update the status badge on the Pull Requests tab (illuminating PR #42) and the Commits/Code tabs.
4. **Merge state idempotency**: Merging PR #42 must promote V3 to Stable, transition the PR badge to purple `Merged`, and prevent double-merging.
5. **Mobile / responsive overflow**: Tab navigation and code diffs must scroll horizontally with macOS hidden/custom scrollbars without clipping action buttons or metadata.

---

### Task 1: Styling System, Shared Types & Contract Data

**Files:**
- Create: `dashboard/src/lib/types.ts`
- Modify: `dashboard/src/lib/data.ts`
- Modify: `dashboard/src/app/globals.css`

**Interfaces:**
- Produces: `TabType`, `RepoFile`, `PullRequestItem`, `SelectorFeature`, `RollbackEvent`, `CONTRACTS`, `REPO_FILES`, `INITIAL_PR` in `dashboard/src/lib/types.ts` and `dashboard/src/lib/data.ts`.

- [ ] **Step 1: Write shared types in `dashboard/src/lib/types.ts`**
Define `TabType = 'code' | 'commits' | 'pulls' | 'security' | 'loupe'`, `RepoFile`, `PullRequestItem`, `ToastNotification`, and ensure compatibility with existing `SelectorFeature` and `RollbackEvent`.

- [ ] **Step 2: Expand `dashboard/src/lib/data.ts` with complete Solidity contract source code & PR data**
Add `REPO_FILES` dictionary containing full source code and metadata for `SolGitDiamond.sol`, `VersionRegistry.sol`, `VaultV1.sol`, `VaultV2.sol`, `VaultV2Fixed.sol`, `SolGitGuardianFacet.sol`, and `README.md`. Add `INITIAL_PR` data for PR #42.

- [ ] **Step 3: Add macOS acrylic, glassmorphism and scrollbar utilities in `dashboard/src/app/globals.css`**
Define `.macos-glass`, `.macos-window`, `.macos-card`, and custom dark webkit scrollbars.

- [ ] **Step 4: Verify build compiles**
Run: `cd dashboard && npm run build`
Expected: Build succeeds without type or CSS errors.

- [ ] **Step 5: Commit**
```bash
git add dashboard/src/lib/types.ts dashboard/src/lib/data.ts dashboard/src/app/globals.css
git commit -m "feat(ui): add macOS design system styles, shared types and repository data"
```

---

### Task 2: macOS Top Navigation & Global Header (`TopNav.tsx`)

**Files:**
- Create: `dashboard/src/components/TopNav.tsx`

**Interfaces:**
- Consumes: `TabType` from `dashboard/src/lib/types.ts`, `CONTRACTS` from `dashboard/src/lib/data.ts`.
- Produces: `<TopNav onOpenCommandPalette={() => void} onCopyAddress={(addr: string) => void} />`.

- [ ] **Step 1: Implement `TopNav.tsx` component**
Render macOS window traffic lights (`red`, `yellow`, `green`), SolGit icon badge with `v1.0.0` pill, repository breadcrumb (`mst-protocol / solgit-vault-diamond`), interactive search pill showing `⌘K`, MST live network beacon with pulsing dot, permanent Diamond Router pill with copy action, and MSTScan Explorer / Faucet links.

- [ ] **Step 2: Verify `TopNav` renders and copy button triggers notification callback**
Test click handler with address copy and toast event.

- [ ] **Step 3: Commit**
```bash
git add dashboard/src/components/TopNav.tsx
git commit -m "feat(ui): add macOS top navigation bar with traffic lights and search trigger"
```

---

### Task 3: GitHub Repository Header & Subnav Tabs (`RepoHeader.tsx` & `TabNav.tsx`)

**Files:**
- Create: `dashboard/src/components/RepoHeader.tsx`
- Create: `dashboard/src/components/TabNav.tsx`

**Interfaces:**
- Consumes: `TabType` from `dashboard/src/lib/types.ts`.
- Produces: `<RepoHeader isGuardianActive={boolean} />`, `<TabNav activeTab={TabType} onTabChange={(tab: TabType) => void} prCount={number} hasSecurityAlert={boolean} />`.

- [ ] **Step 1: Implement `RepoHeader.tsx`**
Display repo title with Git branch/book icon, `Public` badge, macOS-style segmented action buttons (`Watch [12]`, `Fork [3]`, `Star [48]`), and Guardian defense status badge (`Guardian Active: Soft-Fail Invariant Guard`).

- [ ] **Step 2: Implement `TabNav.tsx`**
Render the 5 GitHub repository tabs (`Code`, `Commits`, `Pull Requests`, `Security`, `Diamond Loupe`) with active pill/underline indicators, counter badges (`[1]`), and alert pulses.

- [ ] **Step 3: Verify tab switching triggers state updates**
Ensure clicking each tab invokes `onTabChange` with the corresponding `TabType`.

- [ ] **Step 4: Commit**
```bash
git add dashboard/src/components/RepoHeader.tsx dashboard/src/components/TabNav.tsx
git commit -m "feat(ui): add GitHub repository header and macOS styled subnav tabs"
```

---

### Task 4: Code Tab & macOS File Viewer (`tabs/CodeTab.tsx`)

**Files:**
- Create: `dashboard/src/components/tabs/CodeTab.tsx`

**Interfaces:**
- Consumes: `REPO_FILES`, `CONTRACTS` from `dashboard/src/lib/data.ts`.
- Produces: `<CodeTab selectedFile={string} onSelectFile={(name: string) => void} isHacked={boolean} isMerged={boolean} />`.

- [ ] **Step 1: Implement branch switcher, latest commit banner & clone dropdown**
Render branch selector (`main ▾`), commit summary bar showing avatar, author (`0xAI...Watcher`), commit message, SHA, and relative timestamp. Include a green macOS `Code ▾` popover with Diamond Router address and Foundry clone command.

- [ ] **Step 2: Implement GitHub-style file explorer table**
List files with file icons (Solidity, Markdown), file name, latest commit comment, and timestamp. Clicking a row selects the active file.

- [ ] **Step 3: Implement macOS code window viewer**
When a file is selected, display a macOS window-styled code inspector featuring traffic light dots, file path, line count, copy raw button, and syntax-styled code view with line numbers.

- [ ] **Step 4: Implement repository metadata sidebar**
Show About description, Diamond address, Chain ID 91562037, registered facets count, and Guardian defense invariants.

- [ ] **Step 5: Commit**
```bash
git add dashboard/src/components/tabs/CodeTab.tsx
git commit -m "feat(ui): implement Code tab with GitHub file tree and macOS code viewer"
```

---

### Task 5: Commits Tab & Version Lifecycle Graph (`tabs/CommitsTab.tsx`)

**Files:**
- Create: `dashboard/src/components/tabs/CommitsTab.tsx`

**Interfaces:**
- Consumes: `selectors: SelectorFeature[]` from `dashboard/src/lib/data.ts`.
- Produces: `<CommitsTab selectors={selectors} onOpenDiff={(selector: string) => void} />`.

- [ ] **Step 1: Implement selector filter pills**
Render filter buttons allowing users to view commits for all selectors or specific functions (`withdraw(uint256)`, `deposit()`, `balanceOf(address)`).

- [ ] **Step 2: Implement Git commit timeline with lifecycle status tags**
Draw vertical branch timeline with commit nodes, commit messages, author tags (`0xAI...Watcher`, `0xDeveloper`), commit hashes, and status tags (<span className="text-emerald-400">Stable</span>, <span className="text-cyan-400">Active</span>, <span className="text-rose-400">Quarantined</span>).

- [ ] **Step 3: Add quick diff view trigger button**
Allow inspecting the code diff corresponding to any commit.

- [ ] **Step 4: Commit**
```bash
git add dashboard/src/components/tabs/CommitsTab.tsx
git commit -m "feat(ui): implement Commits tab with Git timeline and lifecycle tags"
```

---

### Task 6: Pull Requests Tab & AI Patch Review (`tabs/PullRequestsTab.tsx`)

**Files:**
- Create: `dashboard/src/components/tabs/PullRequestsTab.tsx`

**Interfaces:**
- Consumes: `isMerged: boolean`, `isHacked: boolean`, `onMergeFix: () => void`.
- Produces: `<PullRequestsTab isMerged={isMerged} isHacked={isHacked} onMergeFix={onMergeFix} />`.

- [ ] **Step 1: Implement PR #42 header & branch routing**
Display PR badge (`Open` green or `Merged` purple), title `[SolGit AI Fix] Secure withdraw underflow patch`, and branch info (`solgit-fix-0x2e1a7d-v2` into `main`).

- [ ] **Step 2: Implement CI checks card & AI incident commentary**
Render automated Foundry test results (7/7 passed), Invariant verification safe, Slither analysis clean, and AI Fixer's explanation of the CEI underflow patch.

- [ ] **Step 3: Implement side-by-side / unified code diff**
Render the diff between buggy `VaultV2.sol` and patched `VaultV2Fixed.sol` with line numbers and red/green highlighted changes.

- [ ] **Step 4: Implement GitHub green "Merge pull request" action**
Add the classic GitHub merge button with loading spinner, confirmation feedback, and transition to merged state upon completion.

- [ ] **Step 5: Commit**
```bash
git add dashboard/src/components/tabs/PullRequestsTab.tsx
git commit -m "feat(ui): implement Pull Requests tab with AI self-healing review and merge"
```

---

### Task 7: Security Tab & Interactive Attack Sandbox (`tabs/SecurityTab.tsx`)

**Files:**
- Create: `dashboard/src/components/tabs/SecurityTab.tsx`

**Interfaces:**
- Consumes: `isHacked: boolean`, `events: RollbackEvent[]`, `onTriggerHack: () => void`, `onReset: () => void`.
- Produces: `<SecurityTab isHacked={isHacked} events={events} onTriggerHack={onTriggerHack} onReset={onReset} />`.

- [ ] **Step 1: Implement 5-stage attack & auto-rollback interactive simulation pipeline**
Animate the 5 stages with live visual indicators: Exploit attempt, Watcher detection, Guardian rollback, Quarantine, and AI Fixer hotfix generation.

- [ ] **Step 2: Implement invariant monitor cards**
Show real-time cards for `OUTFLOW_CAP`, `REENTRANCY_GUARD`, and `STATE_INTEGRITY`.

- [ ] **Step 3: Implement live incident feed**
Display chronological incident log with block numbers, context hashes, quarantined version pills, and MSTScan explorer links.

- [ ] **Step 4: Commit**
```bash
git add dashboard/src/components/tabs/SecurityTab.tsx
git commit -m "feat(ui): implement Security tab with attack simulation and incident logs"
```

---

### Task 8: Diamond Loupe Tab (`tabs/LoupeTab.tsx`)

**Files:**
- Create: `dashboard/src/components/tabs/LoupeTab.tsx`

**Interfaces:**
- Consumes: `selectors: SelectorFeature[]`, `CONTRACTS` from `dashboard/src/lib/data.ts`.
- Produces: `<LoupeTab selectors={selectors} onCopy={(val: string) => void} />`.

- [ ] **Step 1: Implement selector-to-facet routing matrix**
Display table with 4-byte selector (`0x2e1a7d4d`), function signature, target facet address, and active status.

- [ ] **Step 2: Implement Diamond Proxy contract directory cards**
Show direct links and quick-copy buttons for Diamond Router, Version Registry, Guardian facet, and Vault facet implementations.

- [ ] **Step 3: Commit**
```bash
git add dashboard/src/components/tabs/LoupeTab.tsx
git commit -m "feat(ui): implement Diamond Loupe tab with EIP-2535 introspection matrix"
```

---

### Task 9: Command Palette (`CommandPalette.tsx`) & macOS Toasts (`Toast.tsx`)

**Files:**
- Create: `dashboard/src/components/CommandPalette.tsx`
- Create: `dashboard/src/components/Toast.tsx`

**Interfaces:**
- Produces: `<CommandPalette isOpen={boolean} onClose={() => void} onSelectTab={(tab: TabType) => void} onSelectFile={(file: string) => void} onTriggerHack={() => void} onMergeFix={() => void} />`, `<Toast notification={ToastNotification | null} onClose={() => void} />`.

- [ ] **Step 1: Implement `CommandPalette.tsx` with fuzzy search**
Support searching files, function selectors, repository tabs, and direct actions ("Simulate Hack", "Merge PR", "Reset"). Support keyboard navigation (Arrow Up/Down, Enter, Esc).

- [ ] **Step 2: Implement `Toast.tsx`**
Render floating macOS glass notification card at top-right with icon, title, description, and auto-dismiss after 3 seconds.

- [ ] **Step 3: Commit**
```bash
git add dashboard/src/components/CommandPalette.tsx dashboard/src/components/Toast.tsx
git commit -m "feat(ui): add macOS Command Palette ⌘K and floating toast system"
```

---

### Task 10: App Shell Integration & Build Verification

**Files:**
- Modify: `dashboard/src/app/page.tsx`
- Modify: `dashboard/src/app/layout.tsx`

**Interfaces:**
- Connects all components and manages reactive state (`activeTab`, `selectedFile`, `selectors`, `events`, `isHacked`, `isMerged`, `commandPaletteOpen`, `toast`).

- [ ] **Step 1: Rewrite `dashboard/src/app/page.tsx` with complete GitHub + macOS tab architecture**
Mount `TopNav`, `RepoHeader`, `TabNav`, the active tab view (`CodeTab`, `CommitsTab`, `PullRequestsTab`, `SecurityTab`, `LoupeTab`), `CommandPalette`, and `Toast`. Bind keyboard listeners (`⌘K`, `Escape`, `1-5`).

- [ ] **Step 2: Update `dashboard/src/app/layout.tsx` metadata**
Set clean page title "SolGit — GitHub for Smart Contracts with macOS UX" and favicon/meta tags.

- [ ] **Step 3: Run full build and typecheck verification**
Run: `cd dashboard && npm run build`
Expected: Output `✓ Compiled successfully`, zero TypeScript errors, zero lint warnings.

- [ ] **Step 4: Commit**
```bash
git add dashboard/src/app/page.tsx dashboard/src/app/layout.tsx
git commit -m "feat(ui): complete GitHub + macOS UI integration in dashboard main shell"
```
