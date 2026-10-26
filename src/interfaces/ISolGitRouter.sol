// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title ISolGitRouter — Interface for the Diamond-style router with soft-fail rollback
interface ISolGitRouter {
    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    /// @notice Emitted when a guard violation triggers automatic rollback
    /// @param selector The function selector that was rolled back
    /// @param badVersion The version that was quarantined
    /// @param goodVersion The stable version that was restored
    /// @param caller The address that triggered the failing call
    /// @param contextHash keccak256 of the calldata for forensic tracing
    event FeatureRolledBack(
        bytes4 indexed selector,
        uint32 badVersion,
        uint32 goodVersion,
        address indexed caller,
        bytes32 contextHash
    );

    // ──────────────────────────────────────────────
    //  Functions
    // ──────────────────────────────────────────────

    /// @notice Returns the owner of the router
    function owner() external view returns (address);
}
