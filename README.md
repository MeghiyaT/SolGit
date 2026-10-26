# SolGit: Git-Style Smart Contract Version Control & Self-Healing Rollback

> Built for the **MST Blockchain** (Chain ID: `91562037`, ~3s block time, EVM-compatible).

SolGit brings Git semantics to Solidity smart contracts. Instead of all-or-nothing proxy upgrades or catastrophic exploit freezes, SolGit tracks **per-function selector version histories** (`v1`, `v2`, `v3`) with automated, self-healing rollbacks powered by on-chain invariant guards and an off-chain AI watcher.

---

## Architecture Overview

```mermaid
flowchart TD
    User([User / Attacker]) -->|Transaction| Router[SolGitRouter\nEIP-2535 Fallback]
    
    subgraph Execution & Invariant Monitoring
        Router -->|1. delegatecall| Guard[GuardExecutor\nPre/Post Invariant Checks]
        Guard -->|2. delegatecall| Facet[Target Facet\ne.g., VaultV2]
        Facet -->|3. State change & Return| Guard
        Guard -->|4. Verify Invariants\nOutflow Cap / Conservation / Rate Limit| Guard
    end

    Guard -- Invariant OK --> Router
    Router -- Return Data --> User

    Guard -- Invariant Violated! -->|Revert InvariantViolation| Router
    
    subgraph Soft-Fail Auto-Rollback Frame
        Router -->|5. Catches InvariantViolation\nOuter frame remains un-reverted!| Router
        Router -->|6. Quarantine Bad Version| Reg[VersionRegistry]
        Router -->|7. Restore Last Stable Version| Reg
        Router -->|8. Emit FeatureRolledBack event| Log[(Blockchain Logs)]
    end

    Log -->|9. Event Listener| Watcher[SolGit AI Watcher Service]
    Watcher -->|10. Vulnerability Replay & Analysis| Fixer[AI Fixer Engine]
    Fixer -->|11. Generate Hotfix & Run Forge Tests| PR[GitHub Pull Request / Branch]
```

### The Soft-Fail Guard Pattern

In EVM execution, if an entire transaction reverts, all state modifications written during that transaction are discarded—preventing the contract from updating its own status to flag an exploit on-chain.

SolGit solves this with the **Soft-Fail Guard Pattern**:
1. `SolGitRouter` delegatecalls `GuardExecutor`.
2. `GuardExecutor` delegatecalls the target facet implementation and executes post-call invariant checks (e.g., maximum outflow cap, vault total deposit conservation, per-block rate limits).
3. If an invariant fails, `GuardExecutor` reverts with `InvariantViolation(bytes32 invariantId)`. This undoes any malicious state changes inside the inner execution frame.
4. The outer frame in `SolGitRouter` intercepts `InvariantViolation`. Because the outer frame did not revert:
   - It transitions the bad version to `Quarantined`.
   - It points the selector back to the last known `Stable` version.
   - It emits `FeatureRolledBack(...)`.
   - It returns success, ensuring the rollback and quarantine state permanently commit to the blockchain!

---

## MST Blockchain Testnet Parameters

| Parameter | Value |
|---|---|
| **Chain ID** | `91562037` |
| **RPC URL** | `https://testnetrpc.mstblockchain.com` |
| **Explorer** | `https://testnet.mstscan.com` |
| **Faucet** | `https://faucet.mstblockchain.com` |
| **Native Token** | `tMSTC` (18 decimals) |
| **Block Time** | `~3s` |

---

## Project Structure

```
SolGit/
├── src/
│   ├── core/
│   │   ├── SolGitRouter.sol       # Soft-fail diamond router & rollback executor
│   │   ├── VersionRegistry.sol    # Selector version history (Stable, Active, Quarantined)
│   │   └── GuardExecutor.sol      # Delegatecall execution wrapper & invariant assertions
│   ├── facets/
│   │   ├── VaultV1.sol            # Safe baseline vault (deposit, withdraw, transfer)
│   │   └── VaultV2.sol            # Vulnerable facet (intentional unchecked underflow bug)
│   ├── storage/
│   │   └── VaultStorage.sol       # Namespaced diamond storage (EIP-2535)
│   └── test-helpers/
│       └── Attacker.sol           # Exploit contract simulating vault drain
├── test/
│   ├── ExploitRollback.t.sol      # End-to-end exploit detection & auto-rollback test
│   ├── StorageIsolation.t.sol     # Storage integrity and balance conservation tests
│   ├── VersionRegistry.t.sol      # Push, promote, quarantine, and rollback tests
│   ├── GuardExecutor.t.sol        # Invariant checks & outflow cap tests
│   ├── SolGitRouter.t.sol         # Diamond routing, access control, reentrancy tests
│   └── VaultFacet.t.sol           # Facet unit tests
├── cli/                           # TypeScript / viem CLI tool
├── watcher/                       # Node / viem AI watcher & self-healing patch service
├── dashboard/                     # Next.js + Tailwind CSS live interactive UI
└── script/
    └── Deploy.s.sol               # Foundry deployment script for MST Testnet
```

---

## Quickstart

### 1. Smart Contracts (Foundry)

Run the full Foundry test suite (36 tests):

```bash
forge test
```

### 2. TypeScript CLI (`solgit`)

Build and run the SolGit CLI:

```bash
cd cli
npm install
npm run build

# View CLI options
node dist/index.js --help

# Initialize configuration for MST Testnet
node dist/index.js init --rpc https://testnetrpc.mstblockchain.com --chain-id 91562037

# Check current version status across all selectors
node dist/index.js status

# View Git-style commit log for a selector
node dist/index.js log 0x2e1a7d4d

# Compare diff between two versions
node dist/index.js diff 0x2e1a7d4d 1 2
```

### 3. SolGit AI Watcher Service

The AI Watcher listens for `FeatureRolledBack` events, analyzes the vulnerable contract, generates an automatic security patch, verifies it with `forge test`, and creates a GitHub PR:

```bash
cd watcher
npm install
npm run build

# Run end-to-end demo mode
node dist/index.js --demo
```

### 4. Interactive Web Dashboard

Launch the Next.js visual dashboard:

```bash
cd dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the Version Tree, Code Diff viewer, Live Event Feed, and the **⚡ Simulate Hack Attack** sandbox!

---

## 3-Minute Hackathon Demo Script

1. **Show the Version Tree**: Observe the registered selectors (`deposit`, `withdraw`, `transfer`, `balanceOf`). Notice that `withdraw` is running on `v2 (Active)`.
2. **Inspect the Code Diff**: Toggle the diff viewer to see the intentional arithmetic bug in `VaultV2`—an unchecked subtraction without user balance verification.
3. **Click "⚡ Simulate Hack Attack"**:
   - Step 1: Attacker attempts to withdraw `200 tMSTC` from the vault.
   - Step 2: `GuardExecutor` catches an `OUTFLOW_CAP` violation (>100 tMSTC max single-tx cap).
   - Step 3: Inner delegatecall reverts the exploit; `SolGitRouter` outer frame remains active.
   - Step 4: Router immediately quarantines `v2` and restores `v1 (Stable)`.
   - Step 5: Vault balance is **100% preserved** (0 tMSTC stolen).
4. **Inspect the AI Fix & Merge**:
   - The AI Watcher generates a Pull Request with a secure patch.
   - Click **Review & Merge Hotfix** to merge the fix and promote `v3` to Stable status.
