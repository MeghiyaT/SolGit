// SPDX-License-Identifier: MIT
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
        // router is set later via setRouter once it's deployed
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
            // Initialize lastStableIndex to max (meaning "none")
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

        // Set as the active version
        _activeIndex[selector] = index;

        emit VersionPushed(selector, version, impl, keccak256(impl.code));
    }

    /// @inheritdoc IVersionRegistry
    function promote(bytes4 selector, uint32 version) external onlyOwner {
        uint256 index = _versionIndex(selector, version);
        VersionInfo storage vi = _history[selector][index];

        // Cannot promote a quarantined version
        if (vi.status == VersionStatus.Quarantined) {
            revert SolGitErrors.VersionQuarantined(selector, version);
        }

        vi.status = VersionStatus.Stable;
        _lastStableIndex[selector] = index;

        emit VersionPromoted(selector, version);
    }

    /// @inheritdoc IVersionRegistry
    function rollback(bytes4 selector, uint32 badVer, uint32 goodVer) external onlyRouter {
        // Quarantine the bad version
        uint256 badIndex = _versionIndex(selector, badVer);
        _history[selector][badIndex].status = VersionStatus.Quarantined;

        // Restore the good version (must be Stable)
        uint256 goodIndex = _versionIndex(selector, goodVer);
        VersionInfo storage goodInfo = _history[selector][goodIndex];

        if (goodInfo.status != VersionStatus.Stable) {
            revert SolGitErrors.InvalidVersion();
        }

        _activeIndex[selector] = goodIndex;

        emit VersionRolledBack(selector, badVer, goodVer);
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

    // ──────────────────────────────────────────────
    //  Internal
    // ──────────────────────────────────────────────

    /// @dev Convert 1-indexed version to 0-indexed array position, with bounds check
    function _versionIndex(bytes4 selector, uint32 version) internal view returns (uint256) {
        if (version == 0 || version > _history[selector].length) {
            revert SolGitErrors.InvalidVersion();
        }
        return version - 1;
    }
}
