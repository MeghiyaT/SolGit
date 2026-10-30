# SolGit Spec: GitHub Dashboard Platform & Strict Web3 Wallet

**Date**: 2026-10-30  
**Status**: Approved Design  
**Target**: SolGit Dashboard (`dashboard/`)  

---

## 1. Overview & Vision

Transform SolGit from a single repository view into a true **GitHub Web Platform** tailored for smart contracts on the MST Blockchain (Chain ID `91562037`):

1. **Dashboard Landing Page (Identical to `github.com` Dashboard)**:
   - Matches the user's uploaded screenshot of GitHub Dashboard.
   - Top Nav: GitHub Octocat glyph + "Dashboard", search input (`Type / to search`), `+` Create dropdown, notifications, and Web3 Wallet account avatar / "Connect Wallet" button.
   - Left Sidebar: `Home` & `Feed` navigation, `Top repositories` list with search filter and green `New` repository button.
   - Center Workspace: Greeting (`Good morning, {account address or account nickname}!` or connected wallet address), recent Pull Requests widget, and recent Smart Contract activity. **Zero Copilot search box**.
   - Right Sidebar: MST Blockchain status card (Chain ID 91562037, RPC, Faucet) and "Latest from changelog".

2. **Strict Web3 Wallet Authentication**:
   - Strictly uses browser EVM wallets (`window.ethereum` / MetaMask, Rabby, etc.) via `viem`.
   - When disconnected, prompts "Connect Wallet" in the header.
   - Once connected, displays checksummed address, avatar identicon, balance in `tMSTC`, and network switcher for MST Blockchain Testnet.

3. **"New Repository / Upload Smart Contract" Flow**:
   - Accessible via the green `New` button in the left sidebar or the top `+` dropdown.
   - Fields: Repository Name, Description, Contract Visibility.
   - Contract Uploader: File upload for `.sol` files or paste Solidity code.
   - Automatically initializes the contract behind an EIP-2535 Diamond proxy with Guardian protection.

4. **Clean GitHub Repository View (When a repo is clicked)**:
   - Breadcrumb: `SolGit` with clickable or logo to return to Dashboard.
   - Subnav Tabs: `Code`, `Commits`, `Pull Requests`, `Security`, `Diamond Loupe`.
   - **All macOS red/yellow/green traffic light buttons removed**.
   - Clean, standard GitHub Dark design (`#0d1117`, `#161b22`, `#21262d`, `#30363d`), concise text, zero dense walls of jargon.

