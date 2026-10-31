// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {VaultStorage} from "../storage/VaultStorage.sol";
import {SolGitErrors} from "../libraries/SolGitErrors.sol";

/// @title VaultV2Fixed — secured vault facet
contract VaultV2Fixed {
    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────
    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event Transferred(address indexed from, address indexed to, uint256 amount);

    /// @notice Deposit ETH into the vault
    function deposit() external payable {
        if (msg.value == 0) revert SolGitErrors.ZeroDeposit();
        VaultStorage.Layout storage vs = VaultStorage.layout();
        vs.balances[msg.sender] += msg.value;
        vs.totalDeposits += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw ETH from the vault with full CEI protection
    function withdraw(uint256 amount) external {
        // Checks
        if (amount == 0) revert SolGitErrors.ZeroAmount();
        VaultStorage.Layout storage vs = VaultStorage.layout();
        uint256 userBal = vs.balances[msg.sender];
        if (userBal < amount) revert SolGitErrors.InsufficientBalance(userBal, amount);

        // Effects
        vs.balances[msg.sender] = userBal - amount;
        vs.totalDeposits -= amount;

        // Interactions
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert SolGitErrors.EthTransferFailed();

        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Transfer balance to another account with proper validation
    function transfer(address to, uint256 amount) external returns (bool) {
        if (to == address(0)) revert SolGitErrors.ZeroAddress();
        if (amount == 0) revert SolGitErrors.ZeroAmount();
        VaultStorage.Layout storage vs = VaultStorage.layout();
        uint256 senderBal = vs.balances[msg.sender];
        if (senderBal < amount) revert SolGitErrors.InsufficientBalance(senderBal, amount);
        // Effects
        vs.balances[msg.sender] = senderBal - amount;
        vs.balances[to] += amount;
        emit Transferred(msg.sender, to, amount);
        return true;
    }

    /// @notice Get balance of an account
    function balanceOf(address account) external view returns (uint256) {
        return VaultStorage.layout().balances[account];
    }
}
