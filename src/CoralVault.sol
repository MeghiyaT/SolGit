// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title CoralVault
 * @notice High-Yield Native Staking Protocol on MST Coral Testnet.
 *         Managed behind SolGit EIP-2535 Diamond Proxy & Guardian Auto-Defense.
 */
contract CoralVault {
    // ──────────────────────────────────────────────
    //  State & Storage
    // ──────────────────────────────────────────────
    mapping(address => uint256) public balances;
    uint256 public totalDeposits;

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event Transferred(address indexed from, address indexed to, uint256 amount);

    // ──────────────────────────────────────────────
    //  Core Functions
    // ──────────────────────────────────────────────

    /// @notice Deposit native tMSTC into Coral Vault
    function deposit() external payable {
        require(msg.value > 0, "ZeroDeposit: deposit must be greater than 0");
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;

        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw staked tMSTC
    /// @param amount Amount in wei to withdraw
    function withdraw(uint256 amount) external {
        require(amount > 0, "ZeroAmount: withdraw must be greater than 0");
        require(balances[msg.sender] >= amount, "InsufficientBalance: requested exceeds available balance");

        // Checks-Effects-Interactions (CEI) pattern
        balances[msg.sender] -= amount;
        totalDeposits -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "EthTransferFailed: transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Transfer vault staked balance to another account
    function transfer(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "ZeroAddress: cannot transfer to zero address");
        require(amount > 0, "ZeroAmount: transfer amount must be greater than 0");
        require(balances[msg.sender] >= amount, "InsufficientBalance");

        balances[msg.sender] -= amount;
        balances[to] += amount;

        emit Transferred(msg.sender, to, amount);
        return true;
    }

    /// @notice Query the staked balance of an account
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}

