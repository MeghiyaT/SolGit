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

    /// @notice ETH deposit amount cannot be zero
    error ZeroDeposit();

    /// @notice Amount specified cannot be zero
    error ZeroAmount();

    /// @notice Account balance is insufficient for requested withdrawal or transfer
    /// @param available Current account balance
    /// @param requested Attempted withdrawal or transfer amount
    error InsufficientBalance(uint256 available, uint256 requested);

    /// @notice ETH transfer failed
    error EthTransferFailed();

    /// @notice Direct deposits without calldata are not supported
    error DirectDepositNotSupported();

    /// @notice Target facet does not implement the selector to be rolled back
    /// @param facet Target facet address
    /// @param selector Function selector
    error TargetFacetDoesNotImplementSelector(address facet, bytes4 selector);

    /// @notice No implementation is registered for the given selector
    /// @param selector The unregistered function selector
    error SelectorNotRegistered(bytes4 selector);

    /// @notice The delegatecall to a facet failed with a non-invariant error
    error FacetCallFailed(bytes reason);

    /// @notice Reentrancy detected
    error ReentrancyGuardLocked();
}
