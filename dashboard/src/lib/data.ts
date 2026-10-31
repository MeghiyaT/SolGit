import type {
  TabType,
  VersionCommit,
  SelectorFeature,
  RollbackEvent,
  RepoFile,
  PullRequestCheck,
  PullRequestItem,
  ToastNotification,
  Repository,
} from "./types";

export type {
  TabType,
  VersionCommit,
  SelectorFeature,
  RollbackEvent,
  RepoFile,
  PullRequestCheck,
  PullRequestItem,
  ToastNotification,
  Repository,
};

export const INITIAL_REPOSITORIES: Repository[] = [];

export const CONTRACTS = {
  chainId: 54635,
  rpcUrl: "https://coralrpc.mstblockchain.com",
  explorer: "https://coral.mstscan.com",
  diamond: "0x56B05b503A117840A73740a1b8744B12732e44e5",
  router: "0x56B05b503A117840A73740a1b8744B12732e44e5",
  registry: "0x88FE3bAF29B6f5A3D8343B959dfB3516E2DA6B27",
  guardian: "0xD3dcC7D6cC2e1f0F5A31f8Ba94c42F1c2F72d771",
  guard: "0xD3dcC7D6cC2e1f0F5A31f8Ba94c42F1c2F72d771",
  vaultV1: "0x463DC23a3E649Cf3FF54762F6588f1D71C207c01",
  vaultV2: "0x91697d3d38C493F76745dcC72FBe248Fc14fBCB7",
  vaultV2Fixed: "0xb1C889707d426A7A386870A03bc70d1b06975990",
  attacker: "0x67852244E41F39CA15605264536E94BaBf56A4e7",
};

export const INITIAL_SELECTORS: SelectorFeature[] = [];

export const INITIAL_EVENTS: RollbackEvent[] = [];

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

export const SOLGIT_DIAMOND_CODE = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IDiamondCut} from "../interfaces/IDiamondCut.sol";

/// @title SolGitDiamond — EIP-2535 Diamond Proxy with SolGit Guardian Defense
/// @notice Master proxy entry point. Function calls are forwarded to facet implementations
///         via delegatecall. Address remains permanent across all upgrades and emergency rollbacks.
contract SolGitDiamond {
    constructor(
        address _contractOwner,
        address _guardian,
        IDiamondCut.FacetCut[] memory _diamondCut,
        address _init,
        bytes memory _calldata
    ) payable {
        LibDiamond.setContractOwner(_contractOwner);
        if (_guardian != address(0)) {
            LibDiamond.setGuardian(_guardian);
        }
        if (_diamondCut.length > 0) {
            LibDiamond.diamondCut(_diamondCut, _init, _calldata);
        }
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value.
    fallback() external payable {
        LibDiamond.DiamondStorage storage ds;
        bytes32 position = LibDiamond.DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;
        require(facet != address(0), "SolGitDiamond: Function does not exist");

        assembly {
            // Copy function selector and any arguments
            calldatacopy(0, 0, calldatasize())
            // Execute function call using the facet
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            // Get any return value
            returndatacopy(0, 0, returndatasize())
            // Return any return value or error back to the caller
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    receive() external payable {}
}`;

export const VERSION_REGISTRY_CODE = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IVersionRegistry} from "../interfaces/IVersionRegistry.sol";
import {SolGitErrors} from "../libraries/SolGitErrors.sol";

/// @title VersionRegistry — Per-selector version history and lifecycle management
/// @notice Tracks version history for each function selector with push, promote, rollback.
/// @dev Owner can push and promote versions. Only the authorized router can trigger rollbacks.
contract VersionRegistry is IVersionRegistry {
    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    address public owner;
    address public router;

    /// @dev selector => array of VersionInfo (1-indexed by version number)
    mapping(bytes4 => VersionInfo[]) private _history;

    /// @dev selector => index into _history for the currently active version
    mapping(bytes4 => uint256) private _activeIndex;

    /// @dev selector => index into _history for the last stable version (type(uint256).max = none)
    mapping(bytes4 => uint256) private _lastStableIndex;

    /// @dev Tracks all selectors that have been registered
    bytes4[] private _registeredSelectors;
    mapping(bytes4 => bool) private _isSelectorRegistered;

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert SolGitErrors.Unauthorized();
        _;
    }

    modifier onlyRouter() {
        if (msg.sender != router) revert SolGitErrors.Unauthorized();
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor(address _owner) {
        if (_owner == address(0)) revert SolGitErrors.ZeroAddress();
        owner = _owner;
    }

    // ──────────────────────────────────────────────
    //  Admin
    // ──────────────────────────────────────────────

    /// @notice Set the router address (one-time or owner-updatable)
    function setRouter(address _router) external onlyOwner {
        if (_router == address(0)) revert SolGitErrors.ZeroAddress();
        router = _router;
    }

    // ──────────────────────────────────────────────
    //  Core Functions
    // ──────────────────────────────────────────────

    /// @inheritdoc IVersionRegistry
    function pushVersion(bytes4 selector, address impl) external onlyOwner returns (uint32 version) {
        if (impl == address(0)) revert SolGitErrors.ZeroAddress();

        // Track selector if new
        if (!_isSelectorRegistered[selector]) {
            _registeredSelectors.push(selector);
            _isSelectorRegistered[selector] = true;
            _lastStableIndex[selector] = type(uint256).max;
        }

        uint256 index = _history[selector].length;
        version = uint32(index + 1); // 1-indexed version numbers

        _history[selector].push(
            VersionInfo({
                version: version,
                implementation: impl,
                codeHash: keccak256(impl.code),
                status: VersionStatus.Active,
                timestamp: uint64(block.timestamp)
            })
        );

        _activeIndex[selector] = index;
        emit VersionPushed(selector, version, impl, keccak256(impl.code));
    }

    /// @inheritdoc IVersionRegistry
    function promote(bytes4 selector, uint32 version) external onlyOwner {
        uint256 index = _versionIndex(selector, version);
        VersionInfo storage vi = _history[selector][index];

        if (vi.status == VersionStatus.Quarantined) {
            revert SolGitErrors.VersionQuarantined(selector, version);
        }

        vi.status = VersionStatus.Stable;
        _lastStableIndex[selector] = index;
        emit VersionPromoted(selector, version);
    }

    /// @inheritdoc IVersionRegistry
    function rollback(bytes4 selector, uint32 badVer, uint32 goodVer) external onlyRouter {
        uint256 badIndex = _versionIndex(selector, badVer);
        _history[selector][badIndex].status = VersionStatus.Quarantined;

        uint256 goodIndex = _versionIndex(selector, goodVer);
        VersionInfo storage goodInfo = _history[selector][goodIndex];

        if (goodInfo.status != VersionStatus.Stable) {
            revert SolGitErrors.InvalidVersion();
        }

        _activeIndex[selector] = goodIndex;
        emit VersionRolledBack(selector, badVer, goodVer);
    }

    /// @inheritdoc IVersionRegistry
    function manualRevert(bytes4 selector, uint32 targetVersion) external onlyOwner {
        uint256 targetIndex = _versionIndex(selector, targetVersion);
        VersionInfo storage targetInfo = _history[selector][targetIndex];

        if (targetInfo.status == VersionStatus.Quarantined) {
            revert SolGitErrors.VersionQuarantined(selector, targetVersion);
        }

        uint32 currentVer = _history[selector][_activeIndex[selector]].version;
        _activeIndex[selector] = targetIndex;
        emit VersionManuallyReverted(selector, currentVer, targetVersion);
    }

    // ──────────────────────────────────────────────
    //  View Functions
    // ──────────────────────────────────────────────

    /// @inheritdoc IVersionRegistry
    function getActiveVersion(bytes4 selector) external view returns (VersionInfo memory) {
        VersionInfo[] storage history = _history[selector];
        if (history.length == 0) revert SolGitErrors.SelectorNotRegistered(selector);
        return history[_activeIndex[selector]];
    }

    /// @inheritdoc IVersionRegistry
    function getVersion(bytes4 selector, uint32 version) external view returns (VersionInfo memory) {
        uint256 index = _versionIndex(selector, version);
        return _history[selector][index];
    }

    /// @inheritdoc IVersionRegistry
    function getVersionHistory(bytes4 selector) external view returns (VersionInfo[] memory) {
        return _history[selector];
    }

    /// @inheritdoc IVersionRegistry
    function getLastStableVersion(bytes4 selector) external view returns (uint32) {
        uint256 stableIdx = _lastStableIndex[selector];
        if (stableIdx == type(uint256).max) revert SolGitErrors.NoStableVersion(selector);
        return _history[selector][stableIdx].version;
    }

    /// @notice Returns all registered selectors
    function getRegisteredSelectors() external view returns (bytes4[] memory) {
        return _registeredSelectors;
    }

    function _versionIndex(bytes4 selector, uint32 version) internal view returns (uint256) {
        if (version == 0 || version > _history[selector].length) {
            revert SolGitErrors.InvalidVersion();
        }
        return version - 1;
    }
}`;

export const VAULT_V1_FULL_CODE = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {VaultStorage} from "../storage/VaultStorage.sol";
import {SolGitErrors} from "../libraries/SolGitErrors.sol";

/// @title VaultV1 — Safe vault facet with deposit, withdraw, and transfer
/// @notice Safe baseline version with strict balance checks and Checks-Effects-Interactions (CEI).
contract VaultV1 {
    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event Transferred(address indexed from, address indexed to, uint256 amount);

    function deposit() external payable {
        if (msg.value == 0) revert SolGitErrors.InvalidVersion();

        VaultStorage.Layout storage vs = VaultStorage.layout();
        vs.balances[msg.sender] += msg.value;
        vs.totalDeposits += msg.value;

        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        VaultStorage.Layout storage vs = VaultStorage.layout();

        // Checks
        if (amount == 0) revert SolGitErrors.InvalidVersion();
        if (vs.balances[msg.sender] < amount) revert SolGitErrors.Unauthorized();

        // Effects (CEI)
        vs.balances[msg.sender] -= amount;
        vs.totalDeposits -= amount;

        // Interactions
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert SolGitErrors.Unauthorized();

        emit Withdrawn(msg.sender, amount);
    }

    function transfer(address to, uint256 amount) external {
        if (to == address(0)) revert SolGitErrors.ZeroAddress();
        if (amount == 0) revert SolGitErrors.InvalidVersion();

        VaultStorage.Layout storage vs = VaultStorage.layout();
        if (vs.balances[msg.sender] < amount) revert SolGitErrors.Unauthorized();

        vs.balances[msg.sender] -= amount;
        vs.balances[to] += amount;

        emit Transferred(msg.sender, to, amount);
    }

    function balanceOf(address account) external view returns (uint256) {
        return VaultStorage.layout().balances[account];
    }
}`;

export const VAULT_V2_FULL_CODE = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {VaultStorage} from "../storage/VaultStorage.sol";
import {SolGitErrors} from "../libraries/SolGitErrors.sol";

/// @title VaultV2 — BUGGY vault facet (deliberate vulnerability for demo)
/// @notice Contains an unchecked arithmetic underflow vulnerability in withdraw().
/// @dev ⚠️ THIS CONTRACT IS INTENTIONALLY VULNERABLE.
contract VaultV2 {
    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event Transferred(address indexed from, address indexed to, uint256 amount);

    function deposit() external payable {
        if (msg.value == 0) revert SolGitErrors.InvalidVersion();

        VaultStorage.Layout storage vs = VaultStorage.layout();
        vs.balances[msg.sender] += msg.value;
        vs.totalDeposits += msg.value;

        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw ETH from the vault
    /// @dev ⚠️ BUG: No balance check + unchecked subtraction = underflow exploit
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

        // Send ETH (up to contract balance)
        uint256 toSend = amount > address(this).balance ? address(this).balance : amount;
        if (toSend > 0) {
            (bool ok,) = msg.sender.call{value: toSend}("");
            if (!ok) revert SolGitErrors.Unauthorized();
        }

        emit Withdrawn(msg.sender, amount);
    }

    function transfer(address to, uint256 amount) external {
        if (to == address(0)) revert SolGitErrors.ZeroAddress();
        if (amount == 0) revert SolGitErrors.InvalidVersion();

        VaultStorage.Layout storage vs = VaultStorage.layout();
        if (vs.balances[msg.sender] < amount) revert SolGitErrors.Unauthorized();

        vs.balances[msg.sender] -= amount;
        vs.balances[to] += amount;

        emit Transferred(msg.sender, to, amount);
    }

    function balanceOf(address account) external view returns (uint256) {
        return VaultStorage.layout().balances[account];
    }
}`;

export const VAULT_V2_FIXED_FULL_CODE = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {VaultStorage} from "../storage/VaultStorage.sol";
import {SolGitErrors} from "../libraries/SolGitErrors.sol";

/// @title VaultV2Fixed — AI-healed safe vault facet (PR #42)
/// @notice Patched version generated by SolGit AI Fixer.
///         Enforces strict balance checks and Checks-Effects-Interactions (CEI).
contract VaultV2Fixed {
    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event Transferred(address indexed from, address indexed to, uint256 amount);

    function deposit() external payable {
        if (msg.value == 0) revert SolGitErrors.InvalidVersion();

        VaultStorage.Layout storage vs = VaultStorage.layout();
        vs.balances[msg.sender] += msg.value;
        vs.totalDeposits += msg.value;

        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw ETH from the vault with strict balance checks and CEI
    /// @dev ✅ AI PATCH: Enforces balance validation and standard checked subtraction
    function withdraw(uint256 amount) external {
        if (amount == 0) revert SolGitErrors.InvalidVersion();

        VaultStorage.Layout storage vs = VaultStorage.layout();

        // ✅ FIX 1: Enforce strict balance verification
        if (vs.balances[msg.sender] < amount) revert SolGitErrors.Unauthorized();

        // ✅ FIX 2: Standard checked arithmetic prevents underflow
        vs.balances[msg.sender] -= amount;
        vs.totalDeposits -= amount;

        // ✅ FIX 3: Checks-Effects-Interactions (CEI) adhered
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert SolGitErrors.Unauthorized();

        emit Withdrawn(msg.sender, amount);
    }

    function transfer(address to, uint256 amount) external {
        if (to == address(0)) revert SolGitErrors.ZeroAddress();
        if (amount == 0) revert SolGitErrors.InvalidVersion();

        VaultStorage.Layout storage vs = VaultStorage.layout();
        if (vs.balances[msg.sender] < amount) revert SolGitErrors.Unauthorized();

        vs.balances[msg.sender] -= amount;
        vs.balances[to] += amount;

        emit Transferred(msg.sender, to, amount);
    }

    function balanceOf(address account) external view returns (uint256) {
        return VaultStorage.layout().balances[account];
    }
}`;

export const SOLGIT_GUARDIAN_CODE = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ISolGitGuardian} from "../interfaces/ISolGitGuardian.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

/// @title SolGitGuardianFacet — Automated Emergency Defense & Rollback Facet
/// @notice Grants the SolGit Watcher (Guardian) authority to execute immediate function-level
///         rollbacks to verified stable facets during an exploit, while preserving contract address.
contract SolGitGuardianFacet is ISolGitGuardian {
    function guardian() external view override returns (address) {
        return LibDiamond.guardian();
    }

    function setGuardian(address _guardian) external override {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.setGuardian(_guardian);
    }

    function registerStableFacet(address _facet, bool _isStable) external override {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.registerStableFacet(_facet, _isStable);
    }

    function isRegisteredStableFacet(address _facet) external view override returns (bool) {
        return LibDiamond.isRegisteredStableFacet(_facet);
    }

    function emergencyRollback(bytes4 _selector, address _targetFacet, string calldata _reason) external override {
        LibDiamond.enforceIsGuardian();
        LibDiamond.rollbackSelector(_selector, _targetFacet, _reason);
    }
}`;

export const README_MD_CODE = `# SolGit: Git-Style Smart Contract Platform & Self-Healing Defense

> **A GitHub-like platform for Solidity smart contracts** with permanent contract addresses powered by **EIP-2535 Diamond Proxies**, automated **Guardian-role function rollbacks**, and an **AI Fixer** that patches compromised code.

Built for the **MST Blockchain** (Chain ID: \`54635\`, ~3s block time, EVM-compatible).

---

## The Vision: What SolGit Solves

Deploying smart contracts today is high-risk:
1. **Broken Addresses**: When a contract is upgraded or re-deployed to patch a bug, dApps, frontends, integrations, and liquidity pools must change their contract address.
2. **Exploits Strike in Seconds**: By the time a developer wakes up to an attack notification, protocols are already drained.
3. **All-or-Nothing Freezes**: Traditional emergency pauses freeze the entire protocol, breaking user operations and causing panic.

**SolGit transforms smart contract management:**
* **Upload Like GitHub**: Developers upload their smart contracts (facets and functions) and manage versions per function selector.
* **Permanent Address (EIP-2535 Diamond)**: SolGit deploys the contract behind an EIP-2535 Diamond Proxy. Your dApp connects to one permanent address that never changes.
* **Automated Guardian Rollback**: When an attack is detected on a specific function, our off-chain Watcher instantly executes an on-chain \`emergencyRollback\` using the Guardian role. **Only the attacked function selector is reverted** to its last known stable facet version.
* **Self-Healing AI Fixer**: Once the contract is safe, the AI Fixer analyzes the exploit trace and vulnerable code, generates a secure patch, runs automated \`forge test\` verification, and opens a Pull Request with the hotfix ready for deployment.

---

## Monorepo Layout

\`\`\`
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
├── watcher/                      # Off-chain Watcher & AI Fixer Engine (TypeScript)
├── cli/                          # Developer CLI (TypeScript)
└── dashboard/                    # Web Platform & Visualizer (Next.js)
\`\`\`
`;

export const REPO_FILES: RepoFile[] = [
  {
    name: "SolGitDiamond.sol",
    path: "contracts/core/SolGitDiamond.sol",
    size: "2.1 KB",
    lines: 58,
    description: "EIP-2535 Diamond Proxy core with SolGit Guardian emergency defense",
    lastCommit: {
      message: "feat: add Guardian role validation to Diamond proxy dispatch",
      author: "0xF880...416B",
      time: "1 day ago",
      sha: "3a9b1c7",
    },
    content: SOLGIT_DIAMOND_CODE,
    language: "solidity",
  },
  {
    name: "VersionRegistry.sol",
    path: "contracts/core/VersionRegistry.sol",
    size: "8.6 KB",
    lines: 196,
    description: "Per-selector version tracking, commit history, and lifecycle status registry",
    lastCommit: {
      message: "feat(registry): add on-chain version lifecycle tracking with rollback",
      author: "0xF880...416B",
      time: "1 day ago",
      sha: "e819b4a",
    },
    content: VERSION_REGISTRY_CODE,
    language: "solidity",
  },
  {
    name: "VaultV1.sol",
    path: "contracts/facets/VaultV1.sol",
    size: "3.2 KB",
    lines: 77,
    description: "Safe baseline vault facet with deposit, withdraw, transfer and CEI enforcement",
    lastCommit: {
      message: "feat(vault): initial safe release with CEI pattern and deposit/withdraw",
      author: "0xF880...416B",
      time: "1 day ago",
      sha: "d6cde33",
    },
    content: VAULT_V1_FULL_CODE,
    language: "solidity",
  },
  {
    name: "VaultV2.sol",
    path: "contracts/facets/VaultV2.sol",
    size: "3.5 KB",
    lines: 82,
    description: "Vulnerable vault facet containing unchecked arithmetic underflow hazard in withdraw",
    lastCommit: {
      message: "perf(withdraw): optimize gas using unchecked math (contains underflow bug)",
      author: "0x5678...contributor",
      time: "2 hours ago",
      sha: "51171a8",
    },
    content: VAULT_V2_FULL_CODE,
    language: "solidity",
  },
  {
    name: "VaultV2Fixed.sol",
    path: "contracts/facets/VaultV2Fixed.sol",
    size: "3.4 KB",
    lines: 84,
    description: "AI-healed safe vault facet restoring strict balance verification and CEI pattern",
    lastCommit: {
      message: "fix(withdraw): AI-healed CEI balance verification patch (PR #42)",
      author: "0xAI-Watcher-Bot",
      time: "10 minutes ago",
      sha: "7b9e4a2",
    },
    content: VAULT_V2_FIXED_FULL_CODE,
    language: "solidity",
  },
  {
    name: "SolGitGuardianFacet.sol",
    path: "contracts/facets/SolGitGuardianFacet.sol",
    size: "1.6 KB",
    lines: 39,
    description: "Emergency defense facet granting authorized Guardian rollback privileges",
    lastCommit: {
      message: "feat(guardian): add emergencyRollback facet with verified stable checks",
      author: "0xF880...416B",
      time: "1 day ago",
      sha: "9c4e2d1",
    },
    content: SOLGIT_GUARDIAN_CODE,
    language: "solidity",
  },
  {
    name: "README.md",
    path: "README.md",
    size: "4.5 KB",
    lines: 139,
    description: "Repository documentation, architecture overview, and quickstart guide",
    lastCommit: {
      message: "docs: update architecture overview and self-healing demo guide",
      author: "0xF880...416B",
      time: "3 hours ago",
      sha: "fa0194b",
    },
    content: README_MD_CODE,
    language: "markdown",
  },
];

export const REPO_FILES_MAP: Record<string, RepoFile> = REPO_FILES.reduce(
  (acc, file) => {
    acc[file.path] = file;
    acc[file.name] = file;
    return acc;
  },
  {} as Record<string, RepoFile>
);

export const INITIAL_PULL_REQUESTS: PullRequestItem[] = [];
