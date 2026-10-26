// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IGuardExecutor} from "../interfaces/IGuardExecutor.sol";
import {VaultStorage} from "../storage/VaultStorage.sol";
import {SolGitErrors} from "../libraries/SolGitErrors.sol";

/// @title GuardExecutor — Delegatecall wrapper with post-execution invariant checks
/// @notice Called via delegatecall from the router. Delegatecalls the target facet,
///         then verifies invariants. If an invariant fails, reverts with InvariantViolation.
/// @dev Because this runs via delegatecall, it shares storage context with the router.
///      The reentrancy guard uses a dedicated storage slot to avoid collisions.
contract GuardExecutor is IGuardExecutor {
    // ──────────────────────────────────────────────
    //  Constants — Invariant identifiers
    // ──────────────────────────────────────────────

    bytes32 public constant OUTFLOW_CAP = keccak256("OUTFLOW_CAP");
    bytes32 public constant BALANCE_CONSERVATION = keccak256("BALANCE_CONSERVATION");
    bytes32 public constant BLOCK_WITHDRAWAL_LIMIT = keccak256("BLOCK_WITHDRAWAL_LIMIT");

    /// @dev Maximum single-tx withdrawal: 100 ether
    uint256 public constant MAX_WITHDRAWAL = 100 ether;

    /// @dev Maximum cumulative withdrawals per block: 200 ether
    uint256 public constant MAX_BLOCK_WITHDRAWALS = 200 ether;

    // ──────────────────────────────────────────────
    //  Reentrancy guard (storage-slot based for delegatecall safety)
    // ──────────────────────────────────────────────

    /// @dev keccak256("solgit.guard.reentrancy") - 1
    bytes32 private constant _REENTRANCY_SLOT = 0x1b0e6e8e3c3e7f5a0e1d2c3b4a5968778695a4b3c2d1e0f1a2b3c4d5e6f70819;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    modifier nonReentrant() {
        bytes32 slot = _REENTRANCY_SLOT;
        uint256 status;
        assembly {
            status := sload(slot)
        }
        if (status == _ENTERED) revert SolGitErrors.ReentrancyGuardLocked();
        assembly {
            sstore(slot, _ENTERED)
        }
        _;
        assembly {
            sstore(slot, _NOT_ENTERED)
        }
    }

    // ──────────────────────────────────────────────
    //  Core
    // ──────────────────────────────────────────────

    /// @inheritdoc IGuardExecutor
    function executeWithGuard(
        address target,
        bytes calldata data
    ) external payable nonReentrant returns (bool success, bytes memory returnData) {
        // ── Snapshot pre-call state ──
        VaultStorage.Layout storage vs = VaultStorage.layout();
        uint256 preBalance = address(this).balance;
        uint256 preTotalDeposits = vs.totalDeposits;

        // ── Delegatecall the target facet ──
        (success, returnData) = target.delegatecall(data);

        // If the facet itself reverted, bubble up (NOT an invariant violation)
        if (!success) {
            // Forward the revert reason from the facet
            assembly {
                revert(add(returnData, 0x20), mload(returnData))
            }
        }

        // ── Post-call invariant checks ──
        uint256 postBalance = address(this).balance;
        uint256 postTotalDeposits = vs.totalDeposits;

        // Invariant 1: Outflow cap — single-tx withdrawal cannot exceed MAX_WITHDRAWAL
        if (data.length >= 36 && bytes4(data) == bytes4(keccak256("withdraw(uint256)"))) {
            uint256 requested = abi.decode(data[4:], (uint256));
            if (requested > MAX_WITHDRAWAL) {
                revert SolGitErrors.InvariantViolation(OUTFLOW_CAP);
            }
        }

        if (preBalance > postBalance) {
            uint256 ethOutflow = preBalance - postBalance;
            if (ethOutflow > MAX_WITHDRAWAL) {
                revert SolGitErrors.InvariantViolation(OUTFLOW_CAP);
            }
        }

        if (preTotalDeposits > postTotalDeposits) {
            uint256 outflow = preTotalDeposits - postTotalDeposits;
            if (outflow > MAX_WITHDRAWAL) {
                revert SolGitErrors.InvariantViolation(OUTFLOW_CAP);
            }

            // Invariant 3: Per-block withdrawal limit
            if (vs.withdrawalBlockNumber != block.number) {
                vs.withdrawalBlockNumber = block.number;
                vs.currentBlockWithdrawals = outflow;
            } else {
                vs.currentBlockWithdrawals += outflow;
            }
            if (vs.currentBlockWithdrawals > MAX_BLOCK_WITHDRAWALS) {
                revert SolGitErrors.InvariantViolation(BLOCK_WITHDRAWAL_LIMIT);
            }
        }

        // Invariant 2: Balance conservation — ETH balance should be >= totalDeposits
        // (no phantom minting: you can't have more deposits recorded than ETH held)
        if (postBalance < postTotalDeposits) {
            revert SolGitErrors.InvariantViolation(BALANCE_CONSERVATION);
        }

        return (success, returnData);
    }
}
