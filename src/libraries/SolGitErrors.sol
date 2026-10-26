// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title SolGitErrors — Custom errors for the SolGit system
/// @dev Centralised error definitions. Using custom errors saves gas over require strings.
library SolGitErrors {
    /// @notice Caller is not authorised for this action
    error Unauthorized();

    /// @notice A post-execution invariant check failed
    /// @param invariantId keccak256 identifier of the violated invariant
    error InvariantViolation(bytes32 invariantId);

    /// @notice Attempted operation on a quarantined version
    /// @param selector The function selector whose version is quarantined
    /// @param version The quarantined version number
    error VersionQuarantined(bytes4 selector, uint32 version);

    /// @notice No stable version exists to roll back to
    /// @param selector The function selector with no stable fallback
    error NoStableVersion(bytes4 selector);

    /// @notice The specified version does not exist or is otherwise invalid
    error InvalidVersion();

    /// @notice A zero address was provided where a valid address is required
    error ZeroAddress();

    /// @notice No implementation is registered for the given selector
    /// @param selector The unregistered function selector
    error SelectorNotRegistered(bytes4 selector);

    /// @notice The delegatecall to a facet failed with a non-invariant error
    error FacetCallFailed(bytes reason);

    /// @notice Reentrancy detected
    error ReentrancyGuardLocked();
}
