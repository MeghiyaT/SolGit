# SolGit Redesign: Git-Style Smart Contract Platform & Self-Healing Rollback

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform SolGit into a clean, monolithic developer platform for smart contracts that deploys EIP-2535 Diamonds, provides a permanent contract address, monitors transactions via an off-chain Watcher to auto-rollback attacked function selectors to stable facets with the Guardian role, and automatically generates hotfixes using an AI Fixer.

**Architecture:** Monolithic repository containing:
1. `src/` & `test/`: Solidity EIP-2535 Diamond Proxy contracts with standard diamond storage (`LibDiamond`), Owner `diamondCut`, Guardian `emergencyRollback`, and `VersionRegistry`.
2. `core/`: Deployment and compilation engine managing diamond cuts, role setup, and version tracking.
3. `watcher/`: Event & transaction monitor that identifies exploits (reentrancy, drain velocity) and executes automated function selector rollbacks.
4. `fixer/`: AI Fixer pipeline that analyzes exploit traces, patches vulnerable facets, verifies fixes via `forge test`, and stages PRs.
5. `cli/`: Developer CLI (`solgit init`, `solgit push`, `solgit status`, `solgit rollback`).

**Tech Stack:** Solidity 0.8.24, Foundry (forge/cast), TypeScript, Node.js, Ethers.js / Viem, Slither.

**Spec Reference:** Architectural Pivot approved by user:
- Upload experience: Both CLI (`solgit push`) and Web interface.
- Detection: Slither vulnerability taxonomy + runtime transaction anomaly detection.
- Permissions: Guardian Pattern (Owner has full authority; SolGit Guardian can only rollback selectors to pre-registered stable facets).
- Core functionality first, followed by dashboard UI.

---

## Global Constraints

- Never commit build artifacts (`out/`, `cache/`, `dist/`, `broadcast/`, `node_modules/`, `.next/`).
- Standardize `.gitignore` to maintain a clean, professional monorepo aesthetics.
- Preserve EIP-2535 Diamond Standard compliance (`LibDiamond`, `IDiamondCut`, `IDiamondLoupe`).
- The Watcher must NEVER be able to inject arbitrary facets; it can ONLY revert a selector to an address that is marked `isRegisteredStableFacet`.

---

## Tasks

### Task 1: Repository Hygiene & Monolithic Structure Cleanup

- [ ] **Step 1.1: Clean up obsolete and stray files**
  - Delete `src/core/GuardExecutor.sol`, `src/interfaces/IGuardExecutor.sol`.
  - Delete obsolete scripts and tests: `script/SimulateExploit.s.sol`, `test/ReplayAttack.t.sol`, `demo.sh`.
  - Delete untracked build artifacts: `broadcast/`, `artifacts/`, `cli/.solgit.json`.
- [ ] **Step 1.2: Overhaul `.gitignore`**
  - Ignore `broadcast/`, `out/`, `cache/`, `artifacts/`.
  - Ignore `dist/` across all subdirectories (`cli/dist/`, `watcher/dist/`, `core/dist/`).
  - Ignore `.next/`, `node_modules/`, `.env`, `.env.*` (except `.env.example`).
  - Ensure `docs/` and plans are NOT ignored.
- [ ] **Step 1.3: Untrack previously committed build files**
  - Run `git rm -r --cached cli/dist watcher/dist` (preserving source code).
  - Verify `git status` shows only clean source files.

---

### Task 2: Core EIP-2535 Diamond Contracts with SolGit Guardian Role

- [ ] **Step 2.1: Implement Diamond Storage & Library (`src/libraries/LibDiamond.sol`)**
  - Define `DiamondStorage` at `keccak256("diamond.standard.diamond.storage")`.
  - Track `facetAddressAndSelectorPosition`, `facetAddresses`, `supportedInterfaces`.
  - Implement internal functions: `diamondCut`, `addFunctions`, `replaceFunctions`, `removeFunctions`.
  - Enforce facet collision and address sanity checks.
- [ ] **Step 2.2: Implement `src/core/SolGitDiamond.sol`**
  - Standard EIP-2535 fallback router delegating calls via `LibDiamond`.
  - Constructor accepts `owner` and `versionRegistry`.
- [ ] **Step 2.3: Implement Standard Diamond Facets**
  - `src/facets/DiamondCutFacet.sol`: Exposes `diamondCut(...)` with `onlyOwner`.
  - `src/facets/DiamondLoupeFacet.sol`: Implements `IDiamondLoupe` (`facets()`, `facetFunctionSelectors()`, `facetAddress()`, `supportsInterface()`).
  - `src/facets/OwnershipFacet.sol`: Implements `transferOwnership()` and `owner()`.
- [ ] **Step 2.4: Implement `src/facets/SolGitGuardianFacet.sol`**
  - Manage `guardian` address (settable by Owner).
  - Track `isRegisteredStableFacet(address facet) => bool`.
  - Implement `emergencyRollback(bytes4 selector, address targetFacet)`:
    - Modifier `onlyGuardian`.
    - Requires `isRegisteredStableFacet[targetFacet] == true`.
    - Directly replaces `selector` to `targetFacet` via `LibDiamond`.
    - Emits `SelectorRolledBack(bytes4 indexed selector, address indexed oldFacet, address indexed newFacet, string reason)`.
- [ ] **Step 2.5: Implement `src/core/VersionRegistry.sol`**
  - Tracks projects, releases, facets, and per-selector stable/quarantined version mappings.
  - Exposes `registerVersion(string commitHash, address facet, bytes4[] selectors)`.
  - Exposes `markFacetStable(address facet)`.
  - Exposes `markFacetQuarantined(address facet)`.
- [ ] **Step 2.6: Write Foundry Unit & Integration Tests**
  - `test/SolGitDiamond.t.sol`: Verifies deployment, `diamondCut`, loupe facet querying, and regular execution.
  - `test/SolGitGuardian.t.sol`: Verifies guardian assignment, unauthorized call rejection, `emergencyRollback` replacing only the attacked function selector, and rejection if `targetFacet` is not marked stable.
  - Run `forge test` and ensure 100% pass.

---

### Task 3: Core Compiler & Deployment Engine

- [ ] **Step 3.1: Build Monorepo Core Package (`core/` or `cli/src/lib/`)**
  - Create compilation helper using `solc` / `forge build` artifact parsing.
  - Create diamond deployment helper:
    - Deploys `SolGitDiamond`.
    - Deploys `DiamondCutFacet`, `DiamondLoupeFacet`, `OwnershipFacet`, `SolGitGuardianFacet`.
    - Executes initial `diamondCut` to initialize core facets.
    - Configures Developer as Owner and SolGit Watcher as Guardian.
- [ ] **Step 3.2: Write automated test for deployment engine**
  - Test compiling and deploying a test contract (e.g., VaultFacet) via the deployment engine on a local node / anvil.

---

### Task 4: Off-Chain Watcher Engine (Attack Detection & Auto-Rollback)

- [ ] **Step 4.1: Refactor `watcher/` architecture**
  - Implement `watcher/src/monitor.ts`: Listens to diamond contract transactions, events, and state changes.
  - Implement `watcher/src/detector.ts`:
    - Checks for rapid abnormal balance drain (> threshold within single tx/block).
    - Checks for reentrancy patterns (reentrant call traces / multiple events across identical frames).
    - Checks for unhandled invariant breaks.
- [ ] **Step 4.2: Implement `watcher/src/executor.ts` (Guardian Rollback Client)**
  - When an attack is detected on function selector `selector`:
    - Looks up `lastStableFacet` for `selector` from `VersionRegistry`.
    - Submits signed `emergencyRollback(selector, lastStableFacet)` transaction to the Diamond using the Guardian private key.
    - Verifies transaction confirmation.
- [ ] **Step 4.3: Integration Test for Watcher Auto-Rollback**
  - Spin up test environment, simulate an exploit transaction against a vulnerable facet (e.g., reentrant withdraw).
  - Watcher detects exploit, triggers `emergencyRollback`.
  - Verify that the attacked selector is instantly reverted to `VaultV1` (stable), subsequent attacks fail, and the Diamond contract address remains unchanged.

---

### Task 5: AI Fixer Engine (Root Cause Analysis & Hotfix Verification)

- [ ] **Step 5.1: Build Exploit Context Extractor (`watcher/src/fixer/analyzer.ts`)**
  - Extracts the failed/attacked transaction calldata, selector, revert reason, or trace.
  - Fetches the source code of the vulnerable facet.
  - Analyzes vulnerability type (e.g., reentrancy: missing checks-effects-interactions or missing `ReentrancyGuard`).
- [ ] **Step 5.2: Build Patch Generator & Forge Test Runner (`watcher/src/fixer/patcher.ts`)**
  - Applies a patch addressing the specific vulnerability (e.g., re-ordering state updates or adding reentrancy guard).
  - Writes the patched facet (`[FacetName]Fixed.sol`).
  - Automatically executes `forge test --match-contract [TestContract]` to ensure the patch passes all tests and prevents the exploit.
- [ ] **Step 5.3: Build Hotfix Release Stager (`watcher/src/fixer/release.ts`)**
  - Packages the fixed facet, generates the diff, and stages the hotfix metadata for the developer to review and approve.

---

### Task 6: Developer CLI Updates (`cli/`)

- [ ] **Step 6.1: Update `solgit init` & `solgit push`**
  - `solgit init`: Initializes `.solgit/` config tracking repo name, network RPC, and diamond addresses.
  - `solgit push`: Compiles facets, deploys new facet versions, registers them in `VersionRegistry`, and applies `diamondCut`.
- [ ] **Step 6.2: Update `solgit status` & `solgit rollback`**
  - `solgit status`: Displays current Diamond address, all active function selectors mapped to facets, stability status, and Guardian address.
  - `solgit rollback`: Allows developer to manually trigger a rollback for a selector if needed.
- [ ] **Step 6.3: End-to-End Verification**
  - Test end-to-end: Init project -> Push initial stable facets (v1) -> Push vulnerable facet (v2) -> Trigger exploit -> Watcher auto-reverts selector to v1 -> AI Fixer generates and verifies v2-fixed -> CLI status confirms restored stability.

