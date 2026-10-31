// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title IVersionRegistry — Interface for per-selector version management
interface IVersionRegistry {
    // ──────────────────────────────────────────────
    //  Types
    // ──────────────────────────────────────────────

    enum VersionStatus {
        Stable,
        Active,
        Quarantined
    }

    struct VersionInfo {
        uint32 version;
        address implementation;
        bytes32 codeHash;
        VersionStatus status;
        uint64 timestamp;
    }

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event VersionPushed(bytes4 indexed selector, uint32 version, address implementation, bytes32 codeHash);

    event VersionPromoted(bytes4 indexed selector, uint32 version);

    event VersionRolledBack(bytes4 indexed selector, uint32 quarantinedVersion, uint32 activeVersion);

    event VersionManuallyReverted(bytes4 indexed selector, uint32 fromVersion, uint32 toVersion);

    // ──────────────────────────────────────────────
    //  Functions
    // ──────────────────────────────────────────────

    /// @notice Register a new version for a selector. Owner-only.
    /// @param selector The 4-byte function selector
    /// @param impl The implementation contract address
    /// @return version The new version number (1-indexed)
    function pushVersion(bytes4 selector, address impl) external returns (uint32 version);

    /// @notice Promote a version from Active to Stable. Owner-only.
    /// @param selector The function selector
    /// @param version The version number to promote
    function promote(bytes4 selector, uint32 version) external;

    /// @notice Roll back a selector: quarantine badVer, activate goodVer. Router-only.
    /// @param selector The function selector
    /// @param badVer The version to quarantine
    /// @param goodVer The version to restore (must be Stable)
    function rollback(bytes4 selector, uint32 badVer, uint32 goodVer) external;

    /// @notice Synchronize an emergency rollback executed by SolGitDiamond. Router-only.
    /// @param selector The function selector
    /// @param oldFacet The vulnerable facet address to quarantine
    /// @param newFacet The restored stable facet address
    function syncRollback(bytes4 selector, address oldFacet, address newFacet) external;

    /// @notice Synchronize a facet addition or replacement from SolGitDiamond. Router-only.
    /// @param selector The function selector
    /// @param implementation The new facet implementation address
    function syncDiamondCut(bytes4 selector, address implementation) external;

    /// @notice Manually revert a selector to a specified version. Owner-only.
    /// @param selector The function selector
    /// @param targetVersion The version number to revert to (cannot be Quarantined)
    function manualRevert(bytes4 selector, uint32 targetVersion) external;

    /// @notice Get the currently active version info for a selector
    function getActiveVersion(bytes4 selector) external view returns (VersionInfo memory);

    /// @notice Get a specific version's info
    function getVersion(bytes4 selector, uint32 version) external view returns (VersionInfo memory);

    /// @notice Get the full version history for a selector
    function getVersionHistory(bytes4 selector) external view returns (VersionInfo[] memory);

    /// @notice Get the last stable version number for a selector
    function getLastStableVersion(bytes4 selector) external view returns (uint32);
}
