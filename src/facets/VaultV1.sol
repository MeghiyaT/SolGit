// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {VaultStorage} from "../storage/VaultStorage.sol";
import {SolGitErrors} from "../libraries/SolGitErrors.sol";

/// @title VaultV1 — Safe vault facet with deposit, withdraw, and transfer
/// @notice This is the "good" version. All operations follow CEI and have proper checks.
/// @dev Designed to be delegatecalled through the SolGitRouter. Uses namespaced VaultStorage.
contract VaultV1 {
    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event Transferred(address indexed from, address indexed to, uint256 amount);

    // ──────────────────────────────────────────────
    //  Functions
    // ──────────────────────────────────────────────

    /// @notice Deposit ETH into the vault
    function deposit() external payable {
        if (msg.value == 0) revert SolGitErrors.InvalidVersion(); // reuse error for "zero deposit"

        VaultStorage.Layout storage vs = VaultStorage.layout();
        vs.balances[msg.sender] += msg.value;
        vs.totalDeposits += msg.value;

        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw ETH from the vault
    /// @param amount The amount to withdraw
    function withdraw(uint256 amount) external {
        VaultStorage.Layout storage vs = VaultStorage.layout();

        // Checks
        if (amount == 0) revert SolGitErrors.InvalidVersion();
        if (vs.balances[msg.sender] < amount) revert SolGitErrors.Unauthorized();

        // Effects (CEI: state before interaction)
        vs.balances[msg.sender] -= amount;
        vs.totalDeposits -= amount;

        // Interactions
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert SolGitErrors.Unauthorized();

        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Transfer balance to another account within the vault
    /// @param to Recipient address
    /// @param amount Amount to transfer
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
    /// @param account The account to query
    /// @return The balance in wei
    function balanceOf(address account) external view returns (uint256) {
        return VaultStorage.layout().balances[account];
    }
}
