// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title IGuardExecutor — Interface for the invariant-checking execution wrapper
interface IGuardExecutor {
    /// @notice Execute a delegatecall to `target` with `data`, then run invariant checks.
    /// @dev Called via delegatecall from the router. Reverts with InvariantViolation
    ///      if post-execution invariants are violated. Bubbles up normal facet reverts.
    /// @param target The facet implementation address to delegatecall
    /// @param data The full calldata to forward
    /// @return success Whether the execution succeeded
    /// @return returnData The return data from the facet call
    function executeWithGuard(
        address target,
        bytes calldata data
    ) external payable returns (bool success, bytes memory returnData);
}
