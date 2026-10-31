# SolGit Judge Demo Blueprint: Standalone Demo dApp, Live AI Fixer Console & Vercel Deployment

**Date:** 2026-10-30  
**Context:** Hackathon Presentation & Live Multi-Role Demo  
**Status:** Ready for Implementation  

---

## 1. Current Verified Platform State

All 5 core subsystems have been tested, debugged, and verified:

1. **Smart Contracts (`src/`, `test/`)**:
   - 37 / 37 Foundry tests passing across 5 test suites.
   - EIP-2535 Diamond Proxy (`SolGitDiamond.sol`), Guardian rollback facet (`SolGitGuardianFacet.sol`), and per-selector versioning (`VersionRegistry.sol`) verified.
   - Intentionally vulnerable facet `VaultV2.sol` (unchecked arithmetic underflow on `withdraw`) and clean AI-patched facet `VaultV2Fixed.sol` (Checks-Effects-Interactions) both tested.

2. **Off-Chain Sentinel Watcher & AI Fixer (`watcher/`)**:
   - Verified live on MST Coral Testnet (Chain ID `54635`).
   - Guardian submitted live on-chain `emergencyRollback` tx.
   - AI Fixer with Groq LLM synthesized `VaultV2Fixed.sol`, ran automated `forge test` sandbox verification (clean pass), and committed to isolated git branch `solgit-fix-0x2e1a7d-v2`.

3. **Developer CLI (`cli/`)**:
   - Configuration persistence bug resolved in `cli/src/lib/chain.ts`: `loadConfig()` now properly maps `diamondAddress` and `guardianAddress` across repeated `solgit init` invocations.
   - TypeScript build clean (`tsc`).

4. **Web Dashboard (`dashboard/`)**:
   - Next.js 16.4.3 production build (`next build`) runs with **0 errors and 0 warnings**.
   - Turbopack-optimized multi-root storage resolution implemented in `dashboard/src/lib/storage.ts`.
   - All 8 unit tests passing (`npm test`).

5. **End-to-End Runner (`demo.sh`)**:
   - Restored and verified: runs Foundry tests, builds CLI/Watcher, and triggers the live self-healing loop.

---

## 2. The 3-Act Judge Demo Blueprint

### Act 1: The Developer Perspective (SolGit Platform)
- **Screen**: SolGit Dashboard (`http://localhost:3000` or deployed Vercel URL).
- **Narrative**:
  - Developers deploy their smart contracts behind SolGit's permanent **EIP-2535 Diamond Proxy**.
  - One permanent address on MST Coral Testnet (`0x3348...0D69`).
  - The dApp frontend only ever interacts with this address — it never changes even across upgrades or emergency rollbacks.
  - Active version for `withdraw()` is currently `v2` (containing an underflow flaw).

### Act 2: The Attacker Perspective (Standalone Demo dApp)
- **Screen**: Standalone DeFi dApp running on **Port 3001** (`http://localhost:3001`).
- **Narrative & UI**:
  - Realistic DeFi protocol called **"Coral Vault"** (staking / liquidity pool).
  - Completely separate from SolGit, with no artificial "Attacker Mode" labels or SolGit promotional banners.
  - A normal user connects and deposits `1 tMSTC` $\rightarrow$ TVL updates.
  - An attacker connects an account with **0 balance**, enters `200 tMSTC` in the standard **Withdraw** field, and clicks **"Withdraw"**.
  - Because of `VaultV2`'s unchecked subtraction, the transaction attempts to drain funds.

### Act 3: Platform Defense & AI Self-Healing
- **Instant On-Chain Defense**:
  - SolGit Sentinel intercepts the abnormal outflow.
  - The Guardian role executes `emergencyRollback(0x2e1a7d4d, v1)` on-chain in ~3 seconds.
  - **Zero Downtime**: The Diamond contract address does not change; other functions (`deposit`, `balanceOf`) never pause.
- **Demo dApp Reaction**:
  - The attacker's transaction reverts. The dApp displays a subtle, realistic protocol notice:
    > *"⚠️ Protocol Notice: Function 'withdraw' has been restored to stable Version 1 by the contract guardian. Unverified withdrawals are blocked."*
- **SolGit Live AI Console**:
  - In the SolGit Dashboard, a high-tech **Live Sentinel & AI Fixer Console** activates:
    1. `[INTERCEPT]` Exploit anomaly detected on selector `0x2e1a7d4d` (`withdraw`)
    2. `[DEFENSE]` Guardian on-chain `emergencyRollback` confirmed (with MSTScan link)
    3. `[AI AUDITOR]` Groq Llama-3.3 analyzing exploit trace and CEI pattern
    4. `[SANDBOX]` Automated `forge test --match-contract VaultV2FixedTest` passed (4/4 tests)
    5. `[GIT ENGINE]` Staged branch `solgit-fix-0x2e1a7d-v2` and opened Pull Request #42.
- **1-Click Merge**:
  - The developer reviews the side-by-side unified diff and clicks **"Merge Pull Request"**.
  - Selector `0x2e1a7d4d` is upgraded to `v3` live!

---

## 3. Architecture for Next Tasks

### Task 1: Standalone Demo dApp (`demo-dapp/`)
- Directory: `/Users/meghiyatulse/Study/SolGit/demo-dapp/`
- Port: `3001`
- Technologies: React / Next.js / Vite + TailwindCSS + Viem
- Features:
  - Clean DeFi Staking UI ("Coral Vault").
  - Connects to the permanent SolGit Diamond address.
  - Standard Deposit & Withdraw forms.
  - Error state handling showing the guardian rollback protocol notice.

### Task 2: Live AI Fixer Progress Console (`dashboard/src/components/AIFixerConsole.tsx`)
- High-tech terminal widget in the SolGit Dashboard (integrated into Security and PR views).
- Real-time pulse indicators, step-by-step telemetry, animated checkmarks, and live `forge test` logs.

### Task 3: Vercel Deployment
- Target: `dashboard/`
- Environment Variables required:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `PRIVATE_KEY` (Relayer gasless signer on MST Coral)
  - `MST_TESTNET_RPC_URL`
  - `GROQ_API_KEY`
- Architecture note: Vercel hosts the web app and serverless API; the Sentinel Watcher daemon runs persistently in the background.

