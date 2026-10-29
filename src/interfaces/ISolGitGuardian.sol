// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title ISolGitGuardian — SolGit Guardian Interface for Automated Emergency Rollback
interface ISolGitGuardian {
    event GuardianUpdated(address indexed previousGuardian, address indexed newGuardian);
    event StableFacetRegistered(address indexed facet, bool isStable);
    event SelectorRolledBack(
        bytes4 indexed selector,
        address indexed oldFacet,
        address indexed newFacet,
        string reason
    );

    /// @notice Get the active guardian address authorized to execute rollbacks
    function guardian() external view returns (address);

    /// @notice Set or update the guardian address. Owner-only.
    /// @param _guardian The new guardian address
    function setGuardian(address _guardian) external;

    /// @notice Register or unregister a facet address as a trusted stable version
    /// @param _facet The facet implementation address
    /// @param _isStable Whether the facet is approved as a stable rollback target
    function registerStableFacet(address _facet, bool _isStable) external;

    /// @notice Query if a facet address is registered as a trusted stable rollback target
    /// @param _facet The facet implementation address
    function isRegisteredStableFacet(address _facet) external view returns (bool);

    /// @notice Guardian-only emergency rollback for an attacked function selector
    /// @dev Target facet MUST be registered in `isRegisteredStableFacet`
    /// @param _selector The 4-byte function selector under exploit
    /// @param _targetFacet The registered stable facet implementation to restore
    /// @param _reason Description or alert identifier of why the rollback was triggered
    function emergencyRollback(
        bytes4 _selector,
        address _targetFacet,
        string calldata _reason
    ) external;
}

