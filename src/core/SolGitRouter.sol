// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ISolGitRouter} from "../interfaces/ISolGitRouter.sol";
import {IVersionRegistry} from "../interfaces/IVersionRegistry.sol";
import {IGuardExecutor} from "../interfaces/IGuardExecutor.sol";
import {SolGitErrors} from "../libraries/SolGitErrors.sol";

/// @title SolGitRouter — Diamond-style proxy with soft-fail guard rollback
/// @notice Routes function calls to versioned facet implementations via the GuardExecutor.
///         If a guard invariant is violated, the inner delegatecall reverts (undoing exploit state),
///         while the outer frame writes rollback state (quarantine + restore stable) and returns success.
/// @dev This is the entry point that users interact with. All selector-based calls go through fallback().
contract SolGitRouter is ISolGitRouter {
    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    address private _owner;
    IVersionRegistry public registry;
    address public guardExecutor; // stored as address for delegatecall

    // ──────────────────────────────────────────────
    //  Reentrancy guard (dedicated slot for router-level protection)
    // ──────────────────────────────────────────────

    /// @dev keccak256("solgit.router.reentrancy") - 1
    bytes32 private constant _ROUTER_REENTRANCY_SLOT =
        0x2c0e7e8e3c3e7f5a0e1d2c3b4a5968778695a4b3c2d1e0f1a2b3c4d5e6f70820;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor(address registryAddr, address guardAddr, address ownerAddr) {
        if (registryAddr == address(0) || guardAddr == address(0) || ownerAddr == address(0)) {
            revert SolGitErrors.ZeroAddress();
        }
        registry = IVersionRegistry(registryAddr);
        guardExecutor = guardAddr;
        _owner = ownerAddr;
    }

    // ──────────────────────────────────────────────
    //  View
    // ──────────────────────────────────────────────

    /// @inheritdoc ISolGitRouter
    function owner() external view returns (address) {
        return _owner;
    }

    // ──────────────────────────────────────────────
    //  Receive — reject direct ETH sends
    // ──────────────────────────────────────────────

    receive() external payable {
        revert SolGitErrors.Unauthorized();
    }

    // ──────────────────────────────────────────────
    //  Fallback — the soft-fail guard pattern
    // ──────────────────────────────────────────────

    // slither-disable-next-line locked-ether
    fallback() external payable {
        // ── Reentrancy check ──
        bytes32 reentrancySlot = _ROUTER_REENTRANCY_SLOT;
        uint256 reentrancyStatus;
        assembly {
            reentrancyStatus := sload(reentrancySlot)
        }
        if (reentrancyStatus == _ENTERED) revert SolGitErrors.ReentrancyGuardLocked();
        assembly {
            sstore(reentrancySlot, 2) // _ENTERED
        }

        // ── 1. Look up active version for this selector ──
        IVersionRegistry.VersionInfo memory vi = registry.getActiveVersion(msg.sig);

        // ── 2. Delegatecall GuardExecutor.executeWithGuard(impl, msg.data) ──
        bytes memory guardCalldata = abi.encodeCall(
            IGuardExecutor.executeWithGuard,
            (vi.implementation, msg.data)
        );

        (bool success, bytes memory ret) = guardExecutor.delegatecall(guardCalldata);

        // ── 3. If success: clear reentrancy guard and return the data ──
        if (success) {
            assembly {
                sstore(reentrancySlot, 1) // _NOT_ENTERED
            }
            // The return data from executeWithGuard is abi-encoded (bool, bytes).
            // Decode and return just the inner returnData.
            if (ret.length > 0) {
                (, bytes memory innerReturn) = abi.decode(ret, (bool, bytes));
                assembly {
                    return(add(innerReturn, 0x20), mload(innerReturn))
                }
            }
            return;
        }

        // ── 4. Failed — check if it's an InvariantViolation ──
        // InvariantViolation(bytes32) selector = 0xd5da9a1b (first 4 bytes of keccak256("InvariantViolation(bytes32)"))
        bytes4 errorSelector = bytes4(0);
        if (ret.length >= 4) {
            assembly {
                errorSelector := and(mload(add(ret, 0x20)), 0xffffffff00000000000000000000000000000000000000000000000000000000)
            }
        }

        // Compare with InvariantViolation selector
        bytes4 invariantSelector = SolGitErrors.InvariantViolation.selector;

        if (errorSelector == invariantSelector) {
            // ── THIS IS THE OUTER FRAME — state from the inner delegatecall is reverted ──
            // Write rollback in this frame so it persists.

            // Get the last stable version to roll back to
            uint32 badVersion = vi.version;
            uint32 goodVersion = 0;

            // Try to get the last stable version — if none exists, we can't auto-rollback
            try registry.getLastStableVersion(msg.sig) returns (uint32 stableVer) {
                goodVersion = stableVer;
            } catch {
                // No stable version to fall back to — just quarantine and revert
                assembly {
                    sstore(reentrancySlot, 1) // _NOT_ENTERED
                }
                revert SolGitErrors.NoStableVersion(msg.sig);
            }

            // Write the rollback: quarantine bad, restore stable
            registry.rollback(msg.sig, badVersion, goodVersion);

            // Emit the rollback event
            emit FeatureRolledBack(
                msg.sig,
                badVersion,
                goodVersion,
                msg.sender,
                keccak256(msg.data)
            );

            // Clear reentrancy guard
            assembly {
                sstore(reentrancySlot, 1) // _NOT_ENTERED
            }

            // Return success (empty) so the rollback transaction persists on-chain
            return;
        }

        // ── Not an invariant violation — bubble up the normal revert ──
        assembly {
            sstore(reentrancySlot, 1) // _NOT_ENTERED
        }
        assembly {
            revert(add(ret, 0x20), mload(ret))
        }
    }
}
