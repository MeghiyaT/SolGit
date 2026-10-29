// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {VaultStorage} from "../storage/VaultStorage.sol";
import {SolGitErrors} from "../libraries/SolGitErrors.sol";

/// @title VaultV2 — BUGGY vault facet (deliberate vulnerability for demo)
/// @notice This version has an intentional unchecked arithmetic bug in withdraw().
///         The bug allows withdrawing more than deposited, draining the vault.
/// @dev ⚠️  THIS CONTRACT IS INTENTIONALLY VULNERABLE. DO NOT USE IN PRODUCTION.
///      The bug: withdraw uses `unchecked { balances -= amount }` which allows underflow,
///      and does NOT check that the user has sufficient balance.
contract VaultV2 {
    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event Transferred(address indexed from, address indexed to, uint256 amount);

    // ──────────────────────────────────────────────
    //  Functions
    // ──────────────────────────────────────────────

    /// @notice Deposit ETH into the vault (same as V1 — correct)
    function deposit() external payable {
        if (msg.value == 0) revert SolGitErrors.InvalidVersion();

        VaultStorage.Layout storage vs = VaultStorage.layout();
        vs.balances[msg.sender] += msg.value;
        vs.totalDeposits += msg.value;

        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw ETH from the vault
    /// @param amount The amount to withdraw
    /// @dev ⚠️  BUG: No balance check + unchecked subtraction = underflow exploit
    function withdraw(uint256 amount) external {
        VaultStorage.Layout storage vs = VaultStorage.layout();

        // BUG: Missing balance check! And unchecked arithmetic allows underflow.
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

    /// @notice Transfer balance (same as V1 — correct)
    function transfer(address to, uint256 amount) external {
        if (to == address(0)) revert SolGitErrors.ZeroAddress();
        if (amount == 0) revert SolGitErrors.InvalidVersion();

        VaultStorage.Layout storage vs = VaultStorage.layout();

        if (vs.balances[msg.sender] < amount) revert SolGitErrors.Unauthorized();

        vs.balances[msg.sender] -= amount;
        vs.balances[to] += amount;

        emit Transferred(msg.sender, to, amount);
    }

    /// @notice Get balance of an account
    function balanceOf(address account) external view returns (uint256) {
        return VaultStorage.layout().balances[account];
    }
}
