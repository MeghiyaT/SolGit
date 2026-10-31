#!/usr/bin/env bash
set -e

export PATH="$HOME/.foundry/bin:$PATH"

echo "=========================================================="
echo "   SolGit: Git-Style Smart Contract Platform & Self-Healing"
echo "   EIP-2535 Diamond Proxy Architecture + Guardian Auto-Defense"
echo "=========================================================="
echo ""

echo "▶ Step 1: Running Foundry Smart Contract Test Suite..."
forge test
echo "✔ Smart contracts verified (37 tests passed)."
echo ""

echo "▶ Step 2: Building Developer CLI and Watcher..."
npm --prefix cli run build --silent
npm --prefix watcher run build --silent
echo "✔ CLI and Watcher built successfully."
echo ""

echo "▶ Step 3: Launching SolGit AI Watcher Self-Healing Pipeline..."
node watcher/dist/index.js --demo

echo ""
echo "=========================================================="
echo "🎉 SolGit Demo Complete: Contract Address Preserved, Exploit Healed!"
echo "=========================================================="

