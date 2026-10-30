# SolGit: Git-Style Smart Contract Platform & Self-Healing Defense

> **A GitHub-like platform for Solidity smart contracts** with permanent contract addresses powered by **EIP-2535 Diamond Proxies**, automated **Guardian-role function rollbacks**, and an **AI Fixer** that patches compromised code.

Built for the **MST Blockchain** (Chain ID: `54635`, MST Coral Testnet, ~3s block time, EVM-compatible).

---

## The Vision: What SolGit Solves

Deploying smart contracts today is high-risk:
1. **Broken Addresses**: When a contract is upgraded or re-deployed to patch a bug, dApps, frontends, integrations, and liquidity pools must change their contract address or rely on rigid proxy patterns.
2. **Exploits Strike in Seconds**: By the time a developer wakes up to an attack notification, protocols are already drained.
3. **All-or-Nothing Freezes**: Traditional emergency pauses freeze the entire protocol, breaking user operations and causing panic.

**SolGit transforms smart contract management:**
* **Upload Like GitHub**: Developers upload their smart contracts (facets and functions) and manage versions per function selector.
* **Permanent Address (EIP-2535 Diamond)**: SolGit deploys the contract behind an EIP-2535 Diamond Proxy. Your dApp connects to one permanent address that never changes.
* **Automated Guardian Rollback**: When an attack is detected on a specific function, our off-chain Watcher instantly executes an on-chain `emergencyRollback` using the Guardian role. **Only the attacked function selector is reverted** to its last known stable facet version. Connected dApps experience zero disruption!
* **Self-Healing AI Fixer**: Once the contract is safe, the AI Fixer analyzes the exploit trace and vulnerable code, generates a secure patch, runs automated `forge test` verification, and opens a Pull Request with the hotfix ready for deployment.

---

## Architecture Overview

```mermaid
flowchart TD
    User([Users & dApps]) -->|Call permanent address| Diamond[SolGitDiamond\nEIP-2535 Master Proxy]
    
    subgraph Facet Routing
        Diamond -->|delegatecall| Cut[DiamondCutFacet\nOwner Cut Control]
        Diamond -->|delegatecall| Loupe[DiamondLoupeFacet\nEIP-2535 Introspection]
        Diamond -->|delegatecall| Guard[SolGitGuardianFacet\nEmergency Rollback]
        Diamond -->|delegatecall| Vault[Active Facet\ne.g., VaultV2 with withdraw]
    end

    subgraph SolGit Watcher & Guardian Defense
        Watcher[SolGit Watcher Engine] -->|1. Monitors Tx & State| Diamond
        Watcher -->|2. Exploit Detected!| GuardCall[Trigger emergencyRollback\nGuardian Role]
        GuardCall -->|3. On-chain cut replaces selector| Diamond
        Diamond -->|4. Selector now routes to| Stable[VaultV1 Stable Facet]
    end

    subgraph AI Fixer Pipeline
        Watcher -->|5. Hand off exploit incident| Fixer[AI Fixer Engine]
        Fixer -->|6. Slither & heuristic analysis| Code[Generate Patched Facet]
        Fixer -->|7. Verify fix| Forge[Automated forge test verification]
        Forge -->|8. Stage patch| PR[Git Branch / GitHub Pull Request]
    end
```

---

## Key Components

### 1. SolGit Diamond (`src/core/SolGitDiamond.sol` & `LibDiamond.sol`)
* **Standard EIP-2535 Diamond Proxy**: Manages per-function routing through namespaced diamond storage (`keccak256("diamond.standard.diamond.storage")`).
* **Owner Sovereignty**: Contract owner has full, unrestricted `diamondCut` authority.
* **The Guardian Invariant**: The SolGit Watcher holds the `Guardian` role, which is **strictly constrained** to `emergencyRollback(bytes4 selector, address targetFacet)`. The Guardian can **only** revert a selector to an address verified in `isRegisteredStableFacet`. The Guardian *can never inject arbitrary code or rug-pull the contract*.

### 2. Version Registry (`src/core/VersionRegistry.sol`)
* Tracks per-selector version lifecycles (`Active`, `Stable`, `Quarantined`).
* Records commit hashes, facet code hashes, and deployment timestamps.

### 3. SolGit Watcher (`watcher/`)
* Off-chain guardian service that monitors diamond contract transactions and state anomalies (reentrancy traces, balance drain velocity, and exploit patterns).
* Upon detecting an exploit, signs and submits `emergencyRollback` to the Diamond proxy within seconds.

### 4. AI Fixer (`watcher/src/fixer.ts`)
* Analyzes root-cause bugs (e.g. unchecked arithmetic, missing Checks-Effects-Interactions, reentrancy).
* Produces clean patched Solidity code (`VaultV2Fixed.sol`).
* Automatically runs Foundry tests (`forge test`) in a sandbox to verify the patch before staging a Git branch and Pull Request.

### 5. Developer CLI (`cli/`)
* `solgit init --diamond <address> --registry <address>`: Initialize project configuration.
* `solgit status`: Inspect current version, active facets, and stability status across all selectors.
* `solgit push <selector> <implementation>`: Push a new facet version.
* `solgit promote <selector> <version>`: Mark a tested version as Stable.
* `solgit revert <selector> <version>`: Manually roll back a selector.

---

## Monorepo Layout

```
SolGit/
├── src/                          # Smart Contracts (Foundry)
│   ├── core/
│   │   ├── SolGitDiamond.sol     # EIP-2535 Master Diamond Proxy
│   │   └── VersionRegistry.sol   # Per-selector version & commit history
│   ├── facets/
│   │   ├── DiamondCutFacet.sol   # Owner diamondCut management
│   │   ├── DiamondLoupeFacet.sol # EIP-2535 introspection
│   │   ├── OwnershipFacet.sol    # ERC-173 ownership
│   │   ├── SolGitGuardianFacet.sol # Emergency rollback facet (Guardian role)
│   │   ├── VaultV1.sol           # Safe initial stable vault facet
│   │   ├── VaultV2.sol           # Vulnerable facet (for demo/testing)
│   │   └── VaultV2Fixed.sol      # Patched facet generated by AI Fixer
│   ├── libraries/
│   │   ├── LibDiamond.sol        # EIP-2535 Diamond storage & rollback logic
│   │   └── SolGitErrors.sol      # Custom error registry
│   └── storage/
│       └── VaultStorage.sol      # Namespaced diamond storage layout
├── test/                         # Foundry Test Suites (28 tests, 100% passing)
│   ├── SolGitDiamond.t.sol       # Diamond deployment, loupe, and delegation tests
│   ├── SolGitGuardian.t.sol      # Guardian rollback & exploit prevention tests
│   ├── VaultFacet.t.sol          # Vault business logic & invariant tests
│   └── VersionRegistry.t.sol     # Commit & version promotion tests
├── watcher/                      # Off-chain Watcher & AI Fixer Engine (TypeScript)
├── cli/                          # Developer CLI (TypeScript)
├── dashboard/                    # Web Platform & Visualizer (Next.js)
├── script/Deploy.s.sol           # Deployment script
└── demo.sh                       # End-to-end verification demo script
```

---

## Quickstart

### 1. Run Foundry Smart Contract Tests
```bash
forge test
```
All 28 tests will run and pass, verifying diamond delegation, loupe introspection, version tracking, and guardian emergency rollbacks.

### 2. Run the End-to-End Self-Healing Demo
```bash
./demo.sh
```
This runs the full pipeline:
1. Runs all Foundry smart contract tests.
2. Builds the TypeScript CLI and Watcher.
3. Launches the AI Watcher: detects an attack, executes Guardian emergency rollback, restores the selector to the stable facet on-chain without changing the contract address, runs the AI Fixer, verifies the patch with `forge test`, and creates a Git hotfix branch and PR.

### 3. Deploy to MST Blockchain Testnet
```bash
source .env
forge script script/Deploy.s.sol --rpc-url $MST_TESTNET_RPC_URL --broadcast --legacy
```
