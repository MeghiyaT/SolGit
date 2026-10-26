export interface VersionCommit {
  version: number;
  implementation: string;
  codeHash: string;
  status: "Stable" | "Active" | "Quarantined";
  timestamp: number;
  author: string;
  message: string;
}

export interface SelectorFeature {
  selector: string;
  signature: string;
  name: string;
  description: string;
  currentVersion: number;
  stableVersion: number;
  history: VersionCommit[];
}

export interface RollbackEvent {
  id: string;
  selector: string;
  badVersion: number;
  goodVersion: number;
  triggeredBy: string;
  contextHash: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  status: "BLOCKED & ROLLED BACK";
  invariant: string;
}

export const INITIAL_SELECTORS: SelectorFeature[] = [
  {
    selector: "0x2e1a7d4d",
    signature: "withdraw(uint256)",
    name: "Withdraw",
    description: "Withdraws native tMSTC from the user's allocated vault balance.",
    currentVersion: 2,
    stableVersion: 1,
    history: [
      {
        version: 1,
        implementation: "0xc7183455a4C133Ae270771860664b6B7ec320bB1",
        codeHash: "0xd6cde33a56d71c721227303a893cc00c557eb6e6daf271f6679d1e487df7ff9f",
        status: "Stable",
        timestamp: Date.now() - 3600000 * 24,
        author: "0x1234...deployer",
        message: "feat: initial safe withdraw with balance checks and CEI",
      },
      {
        version: 2,
        implementation: "0xa0Cb889707d426A7A386870A03bc70d1b0697598",
        codeHash: "0xccfd6166ab8da95f5f784946d3a59120ddc34d0a23739ac4c94f107bb056f083",
        status: "Active",
        timestamp: Date.now() - 3600000 * 2,
        author: "0x5678...contributor",
        message: "perf(withdraw): optimize gas using unchecked math (contains underflow bug)",
      },
    ],
  },
  {
    selector: "0xd0e30db0",
    signature: "deposit()",
    name: "Deposit",
    description: "Accepts native tMSTC deposit and credits msg.sender balance.",
    currentVersion: 1,
    stableVersion: 1,
    history: [
      {
        version: 1,
        implementation: "0xc7183455a4C133Ae270771860664b6B7ec320bB1",
        codeHash: "0xd6cde33a56d71c721227303a893cc00c557eb6e6daf271f6679d1e487df7ff9f",
        status: "Stable",
        timestamp: Date.now() - 3600000 * 24,
        author: "0x1234...deployer",
        message: "feat: initial safe deposit facet",
      },
    ],
  },
  {
    selector: "0xa9059cbb",
    signature: "transfer(address,uint256)",
    name: "Transfer",
    description: "Transfers internal vault balance between accounts without external calls.",
    currentVersion: 1,
    stableVersion: 1,
    history: [
      {
        version: 1,
        implementation: "0xc7183455a4C133Ae270771860664b6B7ec320bB1",
        codeHash: "0xd6cde33a56d71c721227303a893cc00c557eb6e6daf271f6679d1e487df7ff9f",
        status: "Stable",
        timestamp: Date.now() - 3600000 * 24,
        author: "0x1234...deployer",
        message: "feat: internal vault balance transfer",
      },
    ],
  },
  {
    selector: "0x70a08231",
    signature: "balanceOf(address)",
    name: "BalanceOf",
    description: "View function querying diamond storage slot for account balance.",
    currentVersion: 1,
    stableVersion: 1,
    history: [
      {
        version: 1,
        implementation: "0xc7183455a4C133Ae270771860664b6B7ec320bB1",
        codeHash: "0xd6cde33a56d71c721227303a893cc00c557eb6e6daf271f6679d1e487df7ff9f",
        status: "Stable",
        timestamp: Date.now() - 3600000 * 24,
        author: "0x1234...deployer",
        message: "feat: balanceOf view accessor",
      },
    ],
  },
];

export const INITIAL_EVENTS: RollbackEvent[] = [
  {
    id: "evt-1",
    selector: "0x2e1a7d4d",
    badVersion: 2,
    goodVersion: 1,
    triggeredBy: "0x9dF0C6b0066D5317aA5b38B36850548DaCCa6B4e",
    contextHash: "0xa3f8c12b98402a...c0d1e2f3",
    txHash: "0x89abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567",
    blockNumber: 120485,
    timestamp: "Just now",
    status: "BLOCKED & ROLLED BACK",
    invariant: "OUTFLOW_CAP (100 tMSTC max single-tx limit)",
  },
];

export const V1_CODE = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {VaultStorage} from "../storage/VaultStorage.sol";
import {SolGitErrors} from "../libraries/SolGitErrors.sol";

contract VaultV1 {
    function withdraw(uint256 amount) external {
        VaultStorage.Layout storage vs = VaultStorage.layout();

        // Checks
        if (amount == 0) revert SolGitErrors.InvalidVersion();
        if (vs.balances[msg.sender] < amount) revert SolGitErrors.Unauthorized();

        // Effects (CEI)
        vs.balances[msg.sender] -= amount;
        vs.totalDeposits -= amount;

        // Interactions
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert SolGitErrors.Unauthorized();

        emit Withdrawn(msg.sender, amount);
    }
}`;

export const V2_BUGGY_CODE = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {VaultStorage} from "../storage/VaultStorage.sol";
import {SolGitErrors} from "../libraries/SolGitErrors.sol";

contract VaultV2 {
    // ⚠️ INTENTIONALLY VULNERABLE FACET
    function withdraw(uint256 amount) external {
        VaultStorage.Layout storage vs = VaultStorage.layout();

        // ❌ BUG: Missing balance check!
        // ❌ Unchecked subtraction allows arithmetic underflow!
        unchecked {
            vs.balances[msg.sender] -= amount;
            if (amount <= vs.totalDeposits) {
                vs.totalDeposits -= amount;
            } else {
                vs.totalDeposits = 0;
            }
        }

        // Send ETH
        uint256 toSend = amount > address(this).balance ? address(this).balance : amount;
        if (toSend > 0) {
            (bool ok, ) = msg.sender.call{value: toSend}("");
            if (!ok) revert SolGitErrors.Unauthorized();
        }

        emit Withdrawn(msg.sender, amount);
    }
}`;

export const V2_FIXED_CODE = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {VaultStorage} from "../storage/VaultStorage.sol";
import {SolGitErrors} from "../libraries/SolGitErrors.sol";

contract VaultV2Fixed {
    // ✅ AI SELF-HEALED FIX
    function withdraw(uint256 amount) external {
        if (amount == 0) revert SolGitErrors.InvalidVersion();

        VaultStorage.Layout storage vs = VaultStorage.layout();

        // ✅ FIX 1: Enforce strict balance verification
        if (vs.balances[msg.sender] < amount) revert SolGitErrors.Unauthorized();

        // ✅ FIX 2: Standard checked arithmetic prevents underflow
        vs.balances[msg.sender] -= amount;
        vs.totalDeposits -= amount;

        // ✅ FIX 3: Checks-Effects-Interactions (CEI) adhered
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert SolGitErrors.Unauthorized();

        emit Withdrawn(msg.sender, amount);
    }
}`;
